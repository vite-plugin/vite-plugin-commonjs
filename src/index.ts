import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import {
  DEFAULT_EXTENSIONS,
  KNOWN_SFC_EXTENSIONS,
  KNOWN_ASSET_TYPES,
  KNOWN_CSS_TYPES,
} from 'vite-plugin-utils/constant'
import { MagicString } from 'vite-plugin-utils/function'
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
      // https://github.com/vitejs/vite/blob/37ac91e5f680aea56ce5ca15ce1291adc3cbe05e/packages/vite/src/node/plugins/resolve.ts#L450
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
    },
    async transform(code, id) {
      if (/node_modules\/(?!\.vite\/)/.test(id) && !options.filter?.(id)) return
      if (!extensions.includes(path.extname(id))) return
      if (!isCommonjs(code)) return
      if (options.filter?.(id) === false) return

      const ast = this.parse(code)
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
          '/* export-runtime-S */',
          exportRuntime.polyfill,
          '/* export-runtime-E */',
        ].join(' ')

        const _exports = [
          '/* export-statement-S */',
          exportRuntime.exportDeclaration,
          '/* export-statement-E */',
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
          ms.prepend(['/* import-require2import-S */', ...requires, '/* import-require2import-E */'].join(' '))
        }
        if (runtimes.length) {
          ms.append(runtimes.join('\n'))
        }
      }

      const _code = ms.toString()
      return _code === code ? null : _code
    }
  }
}
