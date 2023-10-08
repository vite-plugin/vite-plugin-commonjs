import type { Analyzed } from './analyze'

export interface ExportsRuntime {
  polyfill: string
  exportDeclaration: string
}

export function generateExport(analyzed: Analyzed): ExportsRuntime | null {
  if (!analyzed.exports.length) {
    return null
  }

  const memberDefault = analyzed.exports
    // Find `module.exports` or `exports.default`
    .find(exp => exp.token.left === 'module' || exp.token.right === 'default')

  let members = analyzed.exports
    // Exclude `module.exports` and `exports.default`
    .filter(exp => exp.token.left !== 'module' && exp.token.right !== 'default')
    .map(exp => exp.token.right)
  // Remove duplicate export
  members = [...new Set(members)]

  const membersDeclaration = members.map(
    m => `const __CJS__export_${m}__ = (module.exports == null ? {} : module.exports).${m}`,
  )
  const membersExport = members.map(m => `__CJS__export_${m}__ as ${m}`)
  if (memberDefault) {
    membersDeclaration.unshift(`const __CJS__export_default__ = (module.exports == null ? {} : module.exports).default || module.exports`)
    membersExport.unshift('__CJS__export_default__ as default')
  }

  return {
    polyfill: 'var module = { exports: {} }; var exports = module.exports;',
    exportDeclaration: `
${membersDeclaration.join(';\n')};
export {
  ${membersExport.join(',\n  ')},
}
`.trim(),
  }
}
