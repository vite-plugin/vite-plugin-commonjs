import type { Analyzed } from './analyze'

export interface ExportsRuntime {
  polyfill: string
  exportDeclaration: string
}

export function generateExport(analyzed: Analyzed): ExportsRuntime | null {
  if (!analyzed.exports.length) {
    return null
  }

  // Since the `v0.10.0` version, it no longer matches whether there is an `exports.default` member, but exports directly.
  // Because Vite will add `interop` related code snippets after the `import()` statement.
  // `interop` snippets  👉 https://github.com/vitejs/vite/blob/v4.4.11/packages/vite/src/node/plugins/importAnalysis.ts#L874
  // Check needs interop 👉 https://github.com/vitejs/vite/blob/v4.4.11/packages/vite/src/node/optimizer/index.ts#L1165-L1166
  const memberDefault = {
    declaration: 'const __CJS__export_default__ = (module.exports == null ? {} : module.exports).default || module.exports',
    export: '__CJS__export_default__ as default',
  }

  let members = analyzed.exports
    // Exclude `module.exports` and `exports.default`
    .filter(exp => exp.token.left !== 'module' && exp.token.right !== 'default')
    .map(exp => exp.token.right)
  // Remove duplicate export
  members = [...new Set(members)]

  const membersDeclaration = [
    memberDefault.declaration,
    ...members.map(m => `const __CJS__export_${m}__ = (module.exports == null ? {} : module.exports).${m}`),
  ]
  const membersExport = [
    memberDefault.export,
    ...members.map(m => `__CJS__export_${m}__ as ${m}`),
  ]

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
