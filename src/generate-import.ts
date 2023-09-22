import type { CommonjsOptions, ImportInteropType } from 'src'
import type { Analyzed } from './analyze'

export interface ImportRecord {
  node: AcornNode
  importExpression?: string
  importInterop?: string
}

export function generateImport(analyzed: Analyzed, id: string, options: CommonjsOptions) {
  const { importRules } = options.advanced ?? {}
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
    let importInterop: ImportInteropType | string = 'defaultFirst'
    if (typeof importRules === 'string') {
      importInterop = importRules
    } else if (typeof importRules === 'function') {
      importInterop = importRules(id)
    }

    impt.importExpression = `import * as ${importName} from "${requireId}"`
    switch (importInterop) {
      case 'defaultFirst':
        impt.importInterop = `${importName}.default || ${importName}`
        break
      case 'namedFirst':
        impt.importInterop = `Object.keys(${importName}).join('') !== "default" ? ${importName} : ${importName}.default`
        break
      case 'merge':
        impt.importInterop = `${importName}.default ? Object.assign(${importName}.default, ${importName}) : ${importName}`
        break
      default:
        // User-defined module interop.
        impt.importInterop = importInterop // string | undefined
    }

    imports.push(impt)
  }

  return imports
}
