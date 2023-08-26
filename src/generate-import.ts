import type { ImportType } from 'src'
import type { Analyzed } from './analyze'

export interface ImportRecord {
  node: AcornNode
  importExpression?: string
  importedName?: string
}

export function generateImport(analyzed: Analyzed, id: string, rules?: ImportType | ((id: string) => ImportType)) {
  const imports: ImportRecord[] = []
  let count = 0

  for (const { node, dynamic } of analyzed.require) {

    // Handled in `dynamic-require.ts`
    if (dynamic === 'dynamic') continue

    const impt: ImportRecord = { node }
    const importName = `__CJS__import__${count++}__`

    const requireIdNode = node.arguments[0]
    let requireId: string
    if (!requireIdNode) continue // Not value - require()
    if (requireIdNode.type === 'Literal') {
      requireId = requireIdNode.value
    } else if (dynamic === 'Literal') {
      requireId = requireIdNode.quasis[0].value.raw
    }

    if (!requireId!) {
      const codeSnippets = analyzed.code.slice(node.start, node.end)
      throw new Error(`The following require statement cannot be converted.
      -> ${codeSnippets}
         ${'^'.repeat(codeSnippets.length)}`)
    }

    // This is probably less accurate, but is much cheaper than a full AST parse.
    let importType: ImportType = 'defaultFirst'
    if (typeof rules === 'string') {
      importType = rules
    } else if (typeof rules === 'function') {
      importType = rules(id) || 'defaultFirst'
    }

    impt.importExpression = `import * as ${importName} from "${requireId}"`
    switch (importType) {
      case 'defaultFirst':
        impt.importedName = `${importName}.default || ${importName}`
        break
      case 'namedFirst':
        impt.importedName = `Object.keys(${importName}).join('') !== 'default' ? ${importName} : ${importName}.default`
        break
      case 'merge':
        impt.importedName = `${importName}.default ? Object.assign(${importName}.default, ${importName}) : ${importName}`
        break
      default:
        throw new Error(`Unknown import type: ${importType} for ${id}`)
    }

    imports.push(impt)
  }

  return imports
}
