import { Analyzed } from './analyze'
import { AcornNode } from './types'

export interface ExportsRuntime {
  polyfill: string
  exportDefault?: {
    node: AcornNode
    name: string
    statement: string
  }
  exportMembers?: string
}

export function generateExport(analyzed: Analyzed): ExportsRuntime | null {
  if (!analyzed.exports.length) {
    return null
  }

  let exportDefault: ExportsRuntime['exportDefault']
  const moduleExports = [...analyzed.exports]
    // If there are multiple module.exports in one file, we need to get the last one
    .reverse()
    .find(exp => exp.token.left === 'module')?.node
  if (moduleExports) {
    const name = '__CJS__export_default__'
    exportDefault = {
      node: moduleExports,
      name,
      statement: `export { ${name} as default }`
    }
  }

  const members = analyzed.exports
    .map(exp => exp.token.right)
    .filter(member => member !== 'exports')
  const membersDeclaration = members
    .map(m => `const __CJS__export_${m}__ = (module.exports == null ? {} : module.exports).${m};`)
  const exportMembers = `
${membersDeclaration.join('\n')}
export {
  ${members.map(m => `__CJS__export_${m}__ as ${m}`).join(',\n  ')}
}
`

  return {
    polyfill: `const module = { exports: {} }; const exports = module.exports;`,
    exportDefault,
    exportMembers,
  }
}
