import {
  Analyzed,
  RequireStatement,
  TopLevelType,
} from './analyze'
import { AcornNode } from './types'

/**
 * 目前将 require 分为量给
 * 1. 在顶层作用域，可转换的语句；即可直接转换成 import 的语句
 * 2. 在各种语句、作用域中 require 语句会被提升到底层作用域
 * 
 * TODO:
 * 1. 在各种语句、作用域中 require 精细化处理
 * 2. function 作用域中的 require 语句考虑用 sync-ajax 配合 server 端返回 iife 格式
 */

export interface ImportRecord {
  node: AcornNode
  topLevelNode: RequireStatement['topLevelNode']
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
      topLevelNode,
      // TODO: Nested scope
      functionScope,
    } = req
    const impt: ImportRecord = {
      node,
      topLevelNode,
      importee: ''
    }
    const importName = `__CJS__promotion__import__${count++}__`
    // TODO: Dynamic require id
    const requireId = node.arguments[0].value

    if (topLevelNode) {
      switch (topLevelNode.type) {
        case TopLevelType.ExpressionStatement:
          // TODO: With members
          impt.importee = `import '${requireId}'`
          break

        case TopLevelType.VariableDeclaration:
          // TODO: Multiple declaration
          const VariableDeclarator = topLevelNode.declarations[0]
          const { /* Left */id, /* Right */init } = VariableDeclarator as AcornNode

          let LV: string | { key: string, value: string }[]
          if (id.type === 'Identifier') {
            LV = id.name
          } else if (id.type === 'ObjectPattern') {
            LV = []
            for (const { key, value } of id.properties) {
              LV.push({ key: key.name, value: value.name })
            }
          }

          if (init.type === 'CallExpression') {
            if (typeof LV === 'string') {
              // const acorn = require('acorn')
              impt.importee = `import * as ${LV} from '${requireId}'`
            } else {
              const str = LV
                .map(e => e.key === e.value ? e.key : `${e.key} as ${e.value}`)
                .join(', ')
              // const { parse } = require('acorn')
              impt.importee = `import { ${str} } from '${requireId}'`
            }
          } else if (init.type === 'MemberExpression') {
            const members: string[] = ancestors
              .filter(an => an.type === 'MemberExpression')
              .map(an => an.property.name)
            if (typeof LV === 'string') {
              if (members.length === 1) {
                if (members[0] === 'default') {
                  // const acorn = require('acorn').default
                  impt.importee = `import ${LV} from '${requireId}'`
                } else {
                  impt.importee = members[0] === LV
                    // const parse = require('acorn').parse
                    ? `import { ${LV} } from '${requireId}'`
                    // const parse2 = require('acorn').parse
                    : `import { ${members[0]} as ${LV} } from '${requireId}'`
                }
              } else {
                impt.importee = `import * as ${importName} from '${requireId}'`
                // const bar = require('id').foo.bar
                impt.declaration = `const ${LV} = ${importName}.${members.join('.')}`
              }
            } else {
              impt.importee = `import * as ${importName} from '${requireId}'`
              // const { bar } = require('id').foo
              impt.declaration = `const { ${LV.join(', ')} } = ${importName}.${members.join('.')}`
            }
          }
          break
      }
    } else {
      // This is probably less accurate but is much cheaper than a full AST parse.
      // 🚧-①: 🐞 The require of the function scope will be promoted
      impt.importee = `import * as ${importName} from '${requireId}'`
      impt.importName = importName
    }

    imports.push(impt)
  }

  return imports
}

// TODO
export function generateDynamicIdImport(analyzed: Analyzed) { }
