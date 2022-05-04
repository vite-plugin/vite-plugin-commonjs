import { Plugin } from 'vite'
import { analyzer, StatementType } from './analyze'
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
      nearestAncestor,
      importee: imptee,
      declaration,
      importName,
    } = impt
    const importee = imptee + ';'
    let start: number, end: number

    let replaced: string
    if (nearestAncestor.type === StatementType.ExpressionStatement) {
      replaced = importee
      start = nearestAncestor.start
      end = nearestAncestor.end
    } else if (nearestAncestor.type === StatementType.VariableDeclaration) {
      replaced = declaration ? `${importee} ${declaration};` : importee
      start = nearestAncestor.start
      end = nearestAncestor.end
    } else if ([
      StatementType.ArrayExpression,
      StatementType.ObjectExpression,
    ].includes(nearestAncestor.type)) {
      importStatements.unshift(importee)
      replaced = importName
      start = node.start
      end = node.end
    }

    if (replaced) {
      code = code.slice(0, start) + replaced + code.slice(end)
    }
  }
  if (importStatements.length) {
    code = ['/* Declaration-promotion-S */', ...importStatements, '/* Declaration-promotion-E */'].join(' ') + code
  }

  // if (replaced) | code === _code | 原则上均属于冗余判断，原因是现在还未支持所有语法

  return code === _code ? null : code
}
