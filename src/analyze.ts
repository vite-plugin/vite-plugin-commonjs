import { AcornNode } from './types'

// Supported transform statement types
export enum StatementType {
  ExpressionStatement = 'ExpressionStatement',
  VariableDeclaration = 'VariableDeclaration',
  ArrayExpression = 'ArrayExpression',
  ObjectExpression = 'ObjectExpression',
}

export interface RequireStatement {
  node: AcornNode
  ancestors: AcornNode[]
  nearestAncestor: AcornNode & { type: StatementType }
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
      let nearestAncestor: RequireStatement['nearestAncestor']

      if (isFunctionScope(ancestors)) {
        // TODO: Nested scope
      } else if (nearestAncestor = isImportTopLevelScope(ancestors) as RequireStatement['nearestAncestor']) {
        analyzed.require.push({
          node,
          ancestors,
          nearestAncestor,
        })
      }
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

function isFunctionScope(ancestors: AcornNode[]) {
  return !!ancestors.find(an => [
    'FunctionDeclaration',
    'ArrowFunctionExpression',
  ].includes(an.type))
}

// Will be return nearset ancestor node
function isImportTopLevelScope(ancestors: AcornNode[]): AcornNode {
  const ances = ancestors.map(an => an.type).join()
  const arr = [...ancestors].reverse()

  // TODO
  // CallExpression,CallExpression                  | require('id')()
  // CallExpression,MemberExpression,CallExpression | require('id').foo()

  if (/Program,ExpressionStatement,(CallExpression,|MemberExpression,){0,}CallExpression$/.test(ances)) {
    // require('path');
    // require('path').resolve;
    return arr.find(e => e.type === StatementType.ExpressionStatement)
  }
  if (/Program,VariableDeclaration,VariableDeclarator,(CallExpression,|MemberExpression,){0,}CallExpression$/.test(ances)) {
    // const fs = require('fs');
    // const readFile = require('fs').readFile;
    // const { stat, cp: cpAlias } = require('fs');
    return arr.find(e => e.type === StatementType.VariableDeclaration)
  }
  if (/Program,VariableDeclaration,VariableDeclarator,(ArrayExpression,|ObjectExpression,Property,){0,}(CallExpression,|MemberExpression,){0,}CallExpression$/.test(ances)) {
    // const arr = [{ fs: require('./fs')}];
    // const json = { fs: [require('./fs')]};
    return arr.find(e => [
      StatementType.ArrayExpression,
      StatementType.ObjectExpression,
    ].includes(e.type as StatementType))
  }
}

function isExportTopLevelScope(ancestors: AcornNode[]) {

}
