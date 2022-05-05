import { AcornNode } from './types'

// Top-level scope statement types
export enum TopLevelType {
  // require('foo')
  ExpressionStatement = 'ExpressionStatement',
  // const foo = rquire('foo')
  VariableDeclaration = 'VariableDeclaration',
  // TODO: others top-level ...
}

export interface RequireStatement {
  node: AcornNode
  ancestors: AcornNode[]
  // If require statement located top-level scope, this will have a value
  topLevelNode?: AcornNode & { type: TopLevelType }
  functionScope?: AcornNode
}

export interface ExportsStatement {
  node: AcornNode
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
    CallExpression(node, ancestors: AcornNode[]) {
      if (node.callee.name !== 'require') return

      analyzed.require.push({
        node,
        ancestors,
        topLevelNode: findTopLevelScope(ancestors) as RequireStatement['topLevelNode'],
        functionScope: findFunctionScope(ancestors),
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

  // TODO
  // CallExpression,CallExpression                  | require('foo')()
  // CallExpression,MemberExpression,CallExpression | require('foo').bar()

  if (/Program,ExpressionStatement,(CallExpression,|MemberExpression,){0,}CallExpression$/.test(ances)) {
    // require('foo')
    // require('foo').bar
    return arr.find(e => e.type === TopLevelType.ExpressionStatement)
  }
  if (/Program,VariableDeclaration,VariableDeclarator,(CallExpression,|MemberExpression,){0,}CallExpression$/.test(ances)) {
    // const foo = require('foo')
    // const bar = require('foo').bar
    // const { foo, bar: baz } = require('foo')
    return arr.find(e => e.type === TopLevelType.VariableDeclaration)
  }
}

function isExportTopLevelScope(ancestors: AcornNode[]) {

}
