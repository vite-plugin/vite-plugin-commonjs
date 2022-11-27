import {
  type AcornNode,
  type Analyzed,
  type RequireStatement,
  TopScopeType,
} from './analyze'

/**
 * ```
 * At present, divide `require(id: Literal)` into three cases
 * 目前，将 require() 分为三种情况
 * 
 * ①(🎯)
 * In the top-level scope and can be converted to `import` directly
 * 在顶层作用域，并且直接转换成 import
 * 
 * ②(🚧)
 * If the `id` in `require(id: Literal)` is a literal string, the `require` statement will be promoted to the top-level scope and become an `import` statement
 * 如果 require(id: Literal) 中的 id 是字面量字符串，require 语句将会被提升到顶级作用域，变成 import 语句
 * 
 * ③(🚧)
 * If the `id` in `require(dynamic-id)` is a dynamic-id, the `require` statement will be converted to `__matchRequireRuntime` function
 * 如果 require(dynamic-id) 中的 id 动态 id，require 语句将会被转换成 __matchRequireRuntime 函数
 * ```
 */

export interface ImportRecord {
  node: AcornNode
  topScopeNode?: RequireStatement['topScopeNode']
  importee?: string
  // e.g.
  //   source code 👉 const ast = require('acorn').parse()
  //               ↓
  //   importee    👉 import * as __CJS_import__ from 'acorn'
  //   declaration 👉 const ast = __CJS_import__.parse()
  declaration?: string
  importName?: string
}

export function generateImport(analyzed: Analyzed) {
  const imports: ImportRecord[] = []
  let count = 0

  for (const req of analyzed.require) {
    const {
      node,
      ancestors,
      topScopeNode,
      dynamic,
    } = req

    // ③(🚧)
    // Processed in dynamic-require.ts
    if (dynamic === 'dynamic') continue

    const impt: ImportRecord = { node, topScopeNode }
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

    if (/* 🚨-① topScopeNode */false) {
      // ①(🎯)

      // @ts-ignore
      switch (topScopeNode.type) {
        case TopScopeType.ExpressionStatement:
          // TODO: With members - e.g. `require().foo`
          impt.importee = `import '${requireId}'`
          break

        case TopScopeType.VariableDeclaration:
          // TODO: Multiple declaration
          // @ts-ignore
          const VariableDeclarator = topScopeNode.declarations[0]
          const { /* L-V */id, /* R-V */init } = VariableDeclarator as AcornNode

          // Left value
          let LV: string | { key: string, value: string }[]
          if (id.type === 'Identifier') {
            LV = id.name
          } else if (id.type === 'ObjectPattern') {
            LV = []
            for (const { key, value } of id.properties) {
              // @ts-ignore
              LV.push({ key: key.name, value: value.name })
            }
          } else {
            throw new Error(`Unknown VariableDeclarator.id.type(L-V): ${id.type}`)
          }

          const LV_str = (spe: string) => typeof LV === 'object'
            ? LV.map(e => e.key === e.value ? e.key : `${e.key} ${spe} ${e.value}`).join(', ')
            : ''

          // Right value
          if (init.type === 'CallExpression') {
            if (typeof LV === 'string') {
              // const acorn = require('acorn')
              impt.importee = `import * as ${LV} from '${requireId}'`
            } else {
              // const { parse } = require('acorn')
              impt.importee = `import { ${LV_str('as')} } from '${requireId}'`
            }
          } else if (init.type === 'MemberExpression') {
            const onlyOneMember = ancestors.find(an => an.type === 'MemberExpression')?.property.name
            const importDefault = onlyOneMember === 'default'
            if (typeof LV === 'string') {
              if (importDefault) {
                // const foo = require('foo').default
                impt.importee = `import ${LV} from '${requireId}'`
              } else {
                impt.importee = onlyOneMember === LV
                  // const bar = require('foo').bar
                  ? `import { ${LV} } from '${requireId}'`
                  // const barAlias = require('foo').bar
                  : `import { ${onlyOneMember} as ${LV} } from '${requireId}'`
              }
            } else {
              if (importDefault) {
                // const { member1, member2 } = require('foo').default
                impt.importee = `import ${importName} from '${requireId}'`
              } else {
                // const { member1, member2 } = require('foo').bar
                impt.importee = `import { ${onlyOneMember} as ${importName} } from '${requireId}'`
              }
              impt.declaration = `const { ${LV_str(':')} } = ${importName}`
            }
          } else {
            throw new Error(`Unknown VariableDeclarator.init.type(R-V): ${id.init}`)
          }
          break

        default:
          throw new Error(`Unknown TopScopeType: ${topScopeNode}`)
      }
    } else {
      // ②(🚧)

      // This is probably less accurate but is much cheaper than a full AST parse.
      impt.importee = `import * as ${importName} from '${requireId}'`
      impt.importName = `${importName}.default || ${importName}` // Loose
    }

    imports.push(impt)
  }

  return imports
}
