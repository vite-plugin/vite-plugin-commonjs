import { AcornNode } from './types'

// 🎯-①: Top-level scope statement types, it also means statements that can be converted
// 顶级作用于语句类型，这种可以被无缝换成 import
export enum TopScopeType {
  // require('foo')
  // require('foo').bar
  ExpressionStatement = 'ExpressionStatement',
  // const foo = rquire('foo')
  // const bar = rquire('foo').bar
  VariableDeclaration = 'VariableDeclaration',
}

export interface RequireStatement {
  node: AcornNode
  ancestors: AcornNode[]
  // 🎯-①: If require statement located top-level scope and it is convertible, this will have a value
  // 如果 require 在顶级作用于，并且是可转换 import 的，那么 topScopeNode 将会被赋值
  topScopeNode?: AcornNode & { type: TopScopeType }
  functionScopeNode?: AcornNode
}

export interface ExportsStatement {
  node: AcornNode
  // module(left).exports(right) = 'foo'
  // exports(left).bar(right) = 'bar'
  token: {
    left: string
    right: string
  }
}

export interface Analyzed {
  require: RequireStatement[]
  exports: ExportsStatement[]
}

export function analyzer(ast: AcornNode): Analyzed {

  const analyzed: Analyzed = {
    require: [],
    exports: [],
  }

  simpleWalk(ast, {
    CallExpression(node, ancestors) {
      if (node.callee.name !== 'require') return

      analyzed.require.push({
        node,
        ancestors,
        topScopeNode: findTopLevelScope(ancestors) as RequireStatement['topScopeNode'],
        functionScopeNode: findFunctionScope(ancestors),
      })
    },
    AssignmentExpression(node, ancestors) {
      if (node.left.type !== 'MemberExpression') return
      if (!(node.left.object.type === 'Identifier' && ['module', 'exports'].includes(node.left.object.name))) return

      analyzed.exports.push({
        node,
        token: {
          left: node.left.object.name,
          right: node.left.property.name,
        },
      })
    },
  })

  return analyzed
}

// ----------------------------------------------------------------------

function simpleWalk(
  ast: AcornNode,
  visitors: {
    [type: string]: (node: AcornNode, ancestors: AcornNode[]) => void | Promise<void>,
  },
  ancestors: AcornNode[] = [],
) {
  if (!ast) return
  if (Array.isArray(ast)) {
    for (const element of ast as AcornNode[]) {
      simpleWalk(element, visitors, ancestors)
    }
  } else {
    ancestors = ancestors.concat(ast)
    for (const key of Object.keys(ast)) {
      (typeof ast[key] === 'object' &&
        simpleWalk(ast[key], visitors, ancestors))
    }
  }
  visitors[ast.type]?.(ast, ancestors)
}

simpleWalk.async = function simpleWalkAsync() { }

// The function node that wraps it will be returned
function findFunctionScope(ancestors: AcornNode[]) {
  return ancestors.find(an => [
    'FunctionDeclaration',
    'ArrowFunctionExpression',
  ].includes(an.type))
}

// Will be return nearset ancestor node
function findTopLevelScope(ancestors: AcornNode[]): AcornNode {
  const ances = ancestors.map(an => an.type).join()
  const arr = [...ancestors].reverse()

  if (/Program,ExpressionStatement,(MemberExpression,)?CallExpression$/.test(ances)) {
    // Program,ExpressionStatement,CallExpression                  | require('foo')
    // Program,ExpressionStatement,MemberExpression,CallExpression | require('foo').bar
    return arr.find(e => e.type === TopScopeType.ExpressionStatement)
  }

  if (/Program,VariableDeclaration,VariableDeclarator,(MemberExpression,)?CallExpression$/.test(ances)) {
    // const bar = require('foo').bar
    // const { foo, bar: baz } = require('foo')
    return arr.find(e => e.type === TopScopeType.VariableDeclaration)
  }
}
