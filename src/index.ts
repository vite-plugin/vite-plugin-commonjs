import path from 'path'
import type { Plugin, ResolvedConfig } from 'vite'
import { analyzer, TopScopeType } from './analyze'
import { generateImport } from './generate-import'
import { generateExport } from './generate-export'
import {
  cleanUrl,
  isCommonjs,
  JS_EXTENSIONS,
  KNOWN_ASSET_TYPES,
  KNOWN_CSS_TYPES,
  KNOWN_SFC_EXTENSIONS,
  MagicString,
} from './utils'
import { DynaimcRequire } from './dynamic-require'

export interface Options {
  extensions?: string[]
  filter?: (id: string) => false | undefined
  dynamic?: {
    /**
     * 1. `true` - Match all possibilities as much as possible, More like `webpack`
     * 2. `false` - It behaves more like `@rollup/plugin-dynamic-import-vars`
     * @default true
     */
    loose?: boolean
  }
  /**
   * If you want to exclude some files  
   * e.g.
   *   `type.d.ts`
   *   `interface.ts`
   */
  onFiles?: (files: string[], id: string) => typeof files | undefined
}

export default function commonjs(options: Options = {}): Plugin {
  let config: ResolvedConfig
  const extensions = JS_EXTENSIONS
    .concat(KNOWN_SFC_EXTENSIONS)
    .concat(KNOWN_ASSET_TYPES)
    .concat(KNOWN_CSS_TYPES)
  let dynaimcRequire: DynaimcRequire

  return {
    apply: 'serve',
    name: 'vite-plugin-commonjs',
    configResolved(_config) {
      config = _config
      options.extensions = [...new Set((config.resolve?.extensions || extensions).concat(options.extensions || []))]
      dynaimcRequire = new DynaimcRequire(_config, options)
    },
    async transform(code, id) {
      const pureId = cleanUrl(id)
      const extensions = JS_EXTENSIONS.concat(KNOWN_SFC_EXTENSIONS)
      const { ext } = path.parse(pureId)

      if (/node_modules\/(?!\.vite)/.test(pureId)) return
      if (!extensions.includes(ext)) return
      if (!isCommonjs(code)) return
      if (options.filter?.(pureId) === false) return

      const ast = this.parse(code)
      const analyzed = analyzer(ast, code, id)
      const imports = generateImport(analyzed)
      const exportRuntime = id.includes('node_modules/.vite')
        // Bypass Pre-build
        ? null
        : generateExport(analyzed)
      const dynamics = await dynaimcRequire.generateRuntime(analyzed)

      const promotionImports = []
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

        let importStatement: string
        if (topScopeNode) {
          if (topScopeNode.type === TopScopeType.ExpressionStatement) {
            importStatement = importee
          } else if (topScopeNode.type === TopScopeType.VariableDeclaration) {
            importStatement = declaration ? `${importee} ${declaration};` : importee
          }
        } else {
          // TODO: Merge duplicated require id
          promotionImports.push(importee)
          importStatement = importName
        }


        if (importStatement) {
          const start = topScopeNode ? topScopeNode.start : node.start
          const end = topScopeNode ? topScopeNode.end : node.end
          ms.overwrite(start, end, importStatement)
        }
      }

      if (promotionImports.length) {
        ms.prepend(['/* import-promotion-S */', ...promotionImports, '/* import-promotion-E */'].join(' '))
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
