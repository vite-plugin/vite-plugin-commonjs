import {
  Analyzed,
  RequireStatement,
  StatementType,
} from './analyze'
import { AcornNode } from './types'

/**
 * 目前只考虑四种 require 情况
 * 
 * 1. 只有引入      | ExpressionStatement | require('acorn')
 * 2. 作为赋值表达式 | VariableDeclaration | const aconr = require('acorn')
 * 3. 作为数组成员   | ArrayExpression     | const arr = [require('acorn')]
 * 4. 作为对象属性值 | ObjectExpression    | const obj = { acorn: require('acorn') }
 * 
 * TODO: 存在于各种语句中
 */

/**
 * const acornDefault = require('acorn').default
 * ↓
 * import acornDefault from 'acorn';
 * 
 * const alias = require('acorn').parse
 * ↓
 * import * as _CJS_MODULE_0 from 'acorn'; var { parse } = _CJS_MODULE_0;
 * 
 * const acorn = require('acorn')
 * ↓
 * import * as _CJS_MODULE_1 from 'acorn';
 */

export interface ImportRecord {
  node: AcornNode
  nearestAncestor: RequireStatement['nearestAncestor']
  importee: string
  // e.g
  // const ast = require('acorn').parse()
  // ↓↓↓↓ generated ↓↓↓↓
  // import * as __CJS_import__0__ from 'acorn'
  // ↓↓↓↓ declaration ↓↓↓↓
  // const ast = __CJS_import__0__.parse()
  declaration?: string
  // Auto generated name: __CJS_import__0__
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
    const { node, ancestors, nearestAncestor } = req
    const impt: ImportRecord = {
      node,
      nearestAncestor,
      importee: ''
    }
    const importName = `__CJS_import__${count++}__`
    // TODO: Dynamic require id
    const requireId = node.arguments[0].value

    switch (nearestAncestor.type) {
      case StatementType.ExpressionStatement:
        // TODO: With members
        impt.importee = `import '${requireId}'`
        break

      case StatementType.VariableDeclaration:
        // TODO: Multiple declaration
        const VariableDeclarator = nearestAncestor.declarations[0]
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

      case StatementType.ArrayExpression:
      case StatementType.ObjectExpression:
        // TODO: Merge duplicated require id
        impt.importee = `import * as ${importName} from '${requireId}'`
        impt.importName = importName
        break
    }

    imports.push(impt)
  }

  return imports
}

// TODO
export function generateDynamicImport(analyzed: Analyzed) { }
