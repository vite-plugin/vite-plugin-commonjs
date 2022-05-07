import { Plugin } from 'vite'
import { analyzer, TopLevelType } from './analyze'
import { generateImport } from './generate-import'
import { generateExport } from './generate-export'

export default async function cjs2esm(
  this: ThisParameterType<Plugin['transform']>,
  _code: string,
  id: string,
) {
  const ast = this.parse(_code)
  const analyzed = analyzer(ast)
  const imports = generateImport(analyzed)
  const exportRuntime = generateExport(analyzed)

  let code = _code
  const promotionImports = []
  let moduleExportsHasInserted = false

  for (const impt of [...imports].reverse()) {
    const {
      node,
      topLevelNode,
      importee: imptee,
      declaration,
      importName,
    } = impt
    const importee = imptee + ';'

    let importStatement: string
    if (topLevelNode) {
      if (topLevelNode.type === TopLevelType.ExpressionStatement) {
        importStatement = importee
      } else if (topLevelNode.type === TopLevelType.VariableDeclaration) {
        importStatement = declaration ? `${importee} ${declaration};` : importee
      }
    } else {
      // TODO: Merge duplicated require id
      // 🚧-①
      promotionImports.unshift(importee)
      importStatement = importName
    }

    // require location
    const start = topLevelNode ? topLevelNode.start : node.start
    const end = topLevelNode ? topLevelNode.end : node.end

    if (exportRuntime?.exportDefault.node.start > start) {
      const { start: start2 } = exportRuntime.exportDefault.node
      // Replace module.exports statement
      code = code.slice(0, start2) + `const ${exportRuntime.exportDefault.name} = ` + code.slice(start2)
      moduleExportsHasInserted = true
    }

    if (importStatement) {
      // Replace require statement
      code = code.slice(0, start) + importStatement + code.slice(end)
    }
  }

  if (promotionImports.length) {
    code = ['/* import-promotion-S */', ...promotionImports, '/* import-promotion-E */'].join(' ') + code
  }

  if (exportRuntime) {
    if (exportRuntime.exportDefault && !moduleExportsHasInserted) {
      const { start } = exportRuntime.exportDefault.node
      code = code.slice(0, start) + `const ${exportRuntime.exportDefault.name} = ` + code.slice(start)
    }

    const polyfill = ['/* export-runtime-S */', exportRuntime.polyfill, '/* export-runtime-E */'].join(' ')
    code = [
      polyfill + code,
      '// --------- vite-plugin-commonjs ---------',
      exportRuntime.exportDefault?.statement,
      exportRuntime.exportMembers,
    ].filter(Boolean).join('\n')
  }

  return code === _code ? null : code
}
