import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { parse as parseAst } from 'acorn'
import {
  DEFAULT_EXTENSIONS,
  KNOWN_SFC_EXTENSIONS,
  KNOWN_ASSET_TYPES,
  KNOWN_CSS_TYPES,
} from 'vite-plugin-utils/constant'
import { MagicString, cleanUrl } from 'vite-plugin-utils/function'
import { analyzer, TopScopeType } from './analyze'
import { generateImport } from './generate-import'
import { generateExport } from './generate-export'
import { isCommonjs } from './utils'
import { DynaimcRequire } from './dynamic-require'

export interface Options {
  filter?: (id: string) => boolean | undefined
  dynamic?: {
    /**
     * 1. `true` - Match all possibilities as much as possible, more like `webpack`
     * 2. `false` - It behaves more like `@rollup/plugin-dynamic-import-vars`
     * @default true
     */
    loose?: boolean
    /**
     * If you want to exclude some files  
     * e.g.
     * ```js
     * commonjs({
     *   dynamic: {
     *     onFiles: files => files.filter(f => f !== 'types.d.ts')
     *   }
     * })
     * ```
    */
    onFiles?: (files: string[], id: string) => typeof files | undefined
  }
}

export default function commonjs(options: Options = {}): Plugin {
  let config: ResolvedConfig
  let extensions = DEFAULT_EXTENSIONS
  let dynaimcRequire: DynaimcRequire

  return {
    apply: 'serve',
    name: 'vite-plugin-commonjs',
    configResolved(_config) {
      config = _config
      // https://github.com/vitejs/vite/blob/v4.3.0/packages/vite/src/node/config.ts#L498
      if (config.resolve?.extensions) extensions = config.resolve.extensions
      dynaimcRequire = new DynaimcRequire(_config, {
        ...options,
        extensions: [
          ...extensions,
          ...KNOWN_SFC_EXTENSIONS,
          ...KNOWN_ASSET_TYPES.map(type => '.' + type),
          ...KNOWN_CSS_TYPES.map(type => '.' + type),
        ],
      })

      // esbuild plugin for Vite's Pre-Bundling
      _config.optimizeDeps.esbuildOptions ??= {}
      _config.optimizeDeps.esbuildOptions.plugins ??= []
      _config.optimizeDeps.esbuildOptions.plugins.push({
        name: 'vite-plugin-dynamic-import:pre-bundle',
        setup(build) {
          build.onLoad({ filter: /.*/ }, async ({ path: id }) => {
            let code: string
            try {
              code = fs.readFileSync(id, 'utf8')
            } catch (error) {
              return
            }

            const contents = await transformCommonjs({
              options,
              code,
              id,
              extensions,
              dynaimcRequire,
            })

            if (contents != null) {
              return { contents }
            }
          })
        },
      })
    },
    transform(code, id) {
      return transformCommonjs({
        options,
        code,
        id,
        extensions,
        dynaimcRequire,
      })
    },
  }
}

async function transformCommonjs({
  options,
  code,
  id,
  extensions,
  dynaimcRequire,
}: {
  options: Options,
  code: string,
  id: string,
  extensions: string[],
  dynaimcRequire: DynaimcRequire,
}) {
  if (!(extensions.includes(path.extname(id)) || extensions.includes(path.extname(cleanUrl(id))))) return
  if (!isCommonjs(code)) return

  const userCondition = options.filter?.(id)
  if (userCondition === false) return
  // exclude `node_modules` by default
  // here can only get the files in `node_modules/.vite` and `node_modules/vite/dist/client`, others will be handled by Pre-Bundling
  if (userCondition !== true && id.includes('node_modules')) return

  let ast: AcornNode
  try {
    ast = parseAst(code, { ecmaVersion: 2020 }) as AcornNode
  } catch (error) {
    // ignore as it might not be a JS file, the subsequent plugins will catch the error
    return null
  }

  const analyzed = analyzer(ast, code, id)
  const imports = generateImport(analyzed)
  const exportRuntime = id.includes('node_modules/.vite')
    // Bypass Pre-build
    ? null
    : generateExport(analyzed)
  const dynamics = await dynaimcRequire.generateRuntime(analyzed)

  const hoistImports = []
  const ms = new MagicString(code)

  // require
  for (const impt of imports) {
    const {
      node,
      importee: imptee,
      declaration,
      importName,
      topScopeNode,
    } = impt
    const importee = imptee + ';'

    let importStatement: string | undefined
    if (topScopeNode) {
      if (topScopeNode.type === TopScopeType.ExpressionStatement) {
        importStatement = importee
      } else if (topScopeNode.type === TopScopeType.VariableDeclaration) {
        importStatement = declaration ? `${importee} ${declaration};` : importee
      }
    } else {
      // TODO: Merge duplicated require id
      hoistImports.push(importee)
      importStatement = importName
    }

    if (importStatement) {
      const start = topScopeNode ? topScopeNode.start : node.start
      const end = topScopeNode ? topScopeNode.end : node.end
      ms.overwrite(start, end, importStatement)
    }
  }

  if (hoistImports.length) {
    ms.prepend(['/* import-hoist-S */', ...hoistImports, '/* import-hoist-E */'].join(' '))
  }

  // exports
  if (exportRuntime) {
    const polyfill = [
      '/* [vite-plugin-commonjs] export-runtime-S */',
      exportRuntime.polyfill,
      '/* [vite-plugin-commonjs] export-runtime-E */',
    ].join(' ')

    const _exports = [
      '/* [vite-plugin-commonjs] export-statement-S */',
      exportRuntime.exportDeclaration,
      '/* [vite-plugin-commonjs] export-statement-E */',
    ].filter(Boolean)
      .join('\n')
    ms.prepend(polyfill).append(_exports)
  }

  // dynamic require
  if (dynamics) {
    const requires: string[] = []
    const runtimes: string[] = []
    let count = 0

    for (const dynamic of dynamics) {
      const { node, normally, dynaimc: dymc } = dynamic
      if (normally) {
        const name = `__require2import__${count++}__`
        requires.push(`import * as ${name} from "${normally}";`)
        ms.overwrite(node.callee.start, node.callee.end, name)
      } else if (dymc) {
        requires.push(...dymc.importee.map(impt => impt + ';'))
        runtimes.push(dymc.runtimeFn)
        ms.overwrite(node.callee.start, node.callee.end, dymc.runtimeFn)
      }
    }

    if (requires.length) {
      ms.prepend(['/* [vite-plugin-commonjs] import-require2import-S */', ...requires, '/* [vite-plugin-commonjs] import-require2import-E */'].join(' '))
    }
    if (runtimes.length) {
      ms.append(runtimes.join('\n'))
    }
  }

  const str = ms.toString()
  return str !== code ? str : null
}
