import {
  Analyzed,
  RequireStatement,
  TopScopeType,
} from './analyze'
import { AcornNode } from './types'

/**
 * At present, divide `require()` into three cases
 * 目前，将 require() 分为三种情况
 * 
 * ①:
 * In the top-level scope and can be converted to `import` (🎯-①)
 * 在顶层作用域，并且直接转换成 import
 * 
 * ②:
 * In the top-level scope, but it cannot be directly converted to `import`, the `require` will be promoted
 * 在顶层作用域，但不能直接转换成 import，require 将会被提升
 * 
 * ③:
 * In a block level scope or function scope, it will be converted into `import()` (🚧-①: 🐞)
 * 在块级作用域或函数作用域中，require 将会转换成 import()
 * 
 * TODO:
 * For the `require()` statement in the function scope, consider using sync-ajax to cooperate with the server-side return code snippets and insert it into <head> tag
 * function 作用域中的 require() 语句考虑用 sync-ajax 配合 server 端返回代码段并插入到 head 标签中
 */

export interface ImportRecord {
  node: AcornNode
  importee: string
  // e.g
  // const ast = require('acorn').parse()
  // ↓↓↓↓ generated ↓↓↓↓
  // import * as __CJS_import__0__ from 'acorn'
  // ↓↓↓↓ declaration ↓↓↓↓
  // const ast = __CJS_import__0__.parse()
  declaration?: string
  // Auto generated name
  // e.g. __CJS_import__0__
  importName?: string
  // 🎯-①
  topScopeNode?: RequireStatement['topScopeNode']
  // 🚧-①
  functionScopeNode?: AcornNode

  // ==============================================

  // const acorn(identifier) = require('acorn')
  _identifier?: string
  // const { parse(properties) } = require('acorn')
  _properties?: Record<string, string>
  // const alias = require('acorn').parse(members)
  _members?: string[]
}

export function generateImport(analyzed: Analyzed) {
  const imports: ImportRecord[] = []
  let count = 0

  for (const req of analyzed.require) {
    const {
      node,
      ancestors,
      topScopeNode,
      functionScopeNode,
    } = req
    const impt: ImportRecord = {
      node,
      importee: '',
      topScopeNode,
      functionScopeNode,
    }
    const importName = `__CJS__import__${count++}__`
    // TODO: Dynamic require id, e.g. require('path/' + filename)
    let requireId: string
    const requireIdNode = node.arguments[0]
    // There may be no requireId `require()`
    if (!requireIdNode) continue
    if (requireIdNode.type === 'Literal') {
      requireId = requireIdNode.value
    }

    if (!requireId && !functionScopeNode) {
      const codeSnippets = analyzed.code.slice(node.start, node.end)
      throw new Error(`The following require statement cannot be converted.
    -> ${codeSnippets}
       ${'^'.repeat(codeSnippets.length)}`)
    }
    
    if (topScopeNode) {
      switch (topScopeNode.type) {
        case TopScopeType.ExpressionStatement:
          // TODO: With members
          impt.importee = `import '${requireId}'`
          break

        case TopScopeType.VariableDeclaration:
          // TODO: Multiple declaration
          const VariableDeclarator = topScopeNode.declarations[0]
          const { /* L-V */id, /* R-V */init } = VariableDeclarator as AcornNode

          // Left value
          let LV: string | { key: string, value: string }[]
          if (id.type === 'Identifier') {
            LV = id.name
          } else if (id.type === 'ObjectPattern') {
            LV = []
            for (const { key, value } of id.properties) {
              LV.push({ key: key.name, value: value.name })
            }
          }  else {
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
            // 🚧-②
            const onlyOneMember = ancestors.find(an => an.type === 'MemberExpression').property.name
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
    } else if (functionScopeNode) {
      // 🚧-①: 🐞 The `require()` will be convert to `import()`
    } else {
      // This is probably less accurate but is much cheaper than a full AST parse.
      impt.importee = `import * as ${importName} from '${requireId}'`
      impt.importName = importName
    }

    imports.push(impt)
  }

  return imports
}

// TODO
export function generateDynamicIdImport(analyzed: Analyzed) { }
