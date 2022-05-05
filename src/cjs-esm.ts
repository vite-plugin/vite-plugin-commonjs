import { Plugin } from 'vite'
import { analyzer, TopLevelType } from './analyze'
import { generateImport } from './generate-import'

export default async function cjs2esm(
  this: ThisParameterType<Plugin['transform']>,
  _code: string,
  id: string,
) {
  const ast = this.parse(_code)
  const analyzed = analyzer(ast)
  const imports = generateImport(analyzed)

  let code = _code
  const importStatements = []
  for (const impt of [...imports].reverse()) {
    const {
      node,
      topLevelNode,
      importee: imptee,
      declaration,
      importName,
    } = impt
    const importee = imptee + ';'

    let replaced: string
    if (topLevelNode) {
      if (topLevelNode.type === TopLevelType.ExpressionStatement) {
        replaced = importee
      } else if (topLevelNode.type === TopLevelType.VariableDeclaration) {
        replaced = declaration ? `${importee} ${declaration};` : importee
      }
    } else {
      // TODO: Merge duplicated require id
      // 🚧-①
      importStatements.unshift(importee)
      replaced = importName
    }

    if (replaced) {
      const start = topLevelNode ? topLevelNode.start : node.start
      const end = topLevelNode ? topLevelNode.end : node.end
      code = code.slice(0, start) + replaced + code.slice(end)
    }
  }
  if (importStatements.length) {
    code = ['/* Declaration-promotion-S */', ...importStatements, '/* Declaration-promotion-E */'].join(' ') + code
  }

  // if (replaced) | code === _code | 原则上均属于冗余判断，原因是现在还未支持所有语法

  return code === _code ? null : code
}
