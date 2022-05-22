import { Plugin } from 'vite'
import { analyzer, TopScopeType } from './analyze'
import { generateImport } from './generate-import'
import { generateExport } from './generate-export'
import { MagicString } from './utils'

export default async function cjs2esm(
  this: ThisParameterType<Plugin['transform']>,
  code: string,
  id: string,
) {
  const ast = this.parse(code)
  const analyzed = analyzer(ast, code)
  const imports = generateImport(analyzed)
  // Bypass Pre-build
  const exportRuntime = id.includes('node_modules/.vite') ? null : generateExport(analyzed)

  const promotionImports = []
  const ms = new MagicString(code)

  // Replace require statement
  for (const impt of imports) {
    const {
      node,
      importee: imptee,
      declaration,
      importName,
      topScopeNode,
      functionScopeNode,
    } = impt
    const importee = imptee + ';'

    let importStatement: string
    if (topScopeNode) {
      if (topScopeNode.type === TopScopeType.ExpressionStatement) {
        importStatement = importee
      } else if (topScopeNode.type === TopScopeType.VariableDeclaration) {
        importStatement = declaration ? `${importee} ${declaration};` : importee
      }
    } else if (functionScopeNode) {
      // 🚧-①: 🐞
      ms.overwrite(node.callee.start, node.callee.end, 'import/*🚧-🐞*/')
      ms.overwrite(node.end, node.end, '.then(m => m.default || m)')
    } else {
      // TODO: Merge duplicated require id
      // 🚧-①
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

  if (exportRuntime) {
    if (exportRuntime.exportDefault) {
      const { start } = exportRuntime.exportDefault.node
      ms.overwrite(start, start, `const ${exportRuntime.exportDefault.name} = `)
    }

    const polyfill = ['/* export-runtime-S */', exportRuntime.polyfill, '/* export-runtime-E */'].join(' ')
    const _exports = [
      '\n// --------- export-statement ---------',
      exportRuntime.exportDefault?.statement,
      exportRuntime.exportMembers,
    ].filter(Boolean).join('\n')
    ms.prepend(polyfill).append(_exports)
  }

  const _code = ms.toString()
  return _code === code ? null : _code
}
