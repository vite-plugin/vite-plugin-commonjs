import { walk } from 'vite-plugin-utils/function'

// ①(🎯): Top-level scope statement types, it also means statements that can be converted
// 顶级作用于语句类型，这种可以被无缝换成 import
export enum TopScopeType {
  // require('foo')[.bar]
  ExpressionStatement = 'ExpressionStatement',
  // const bar = require('foo')[.bar]
  VariableDeclaration = 'VariableDeclaration',
}

export interface RequireStatement {
  /** CallExpression */
  node: AcornNode
  ancestors: AcornNode[]
  /**
   * If require statement located top-level scope ant it is convertible, this will have a value(🎯-①)  
   * 如果 require 在顶级作用于，并且是可转换 import 的，那么 topScopeNode 将会被赋值  
   * @deprecated 🤔
   */
  topScopeNode?: AcornNode & { type: TopScopeType }
  dynamic?:
  | 'dynamic'
  // e.g. require(`@/foo/bar.js`) 
  | 'Literal'
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
  ast: AcornNode
  code: string
  id: string
  require: RequireStatement[]
  exports: ExportsStatement[]
}

/**
 * `require` statement analyzer  
 * require 语法分析器  
 */
export function analyzer(ast: AcornNode, code: string, id: string): Analyzed {

  const analyzed: Analyzed = {
    ast,
    code,
    id,
    require: [],
    exports: [],
  }

  walk.sync(ast, {
    CallExpression(node, ancestors) {
      if (node.callee.name !== 'require') return

      const dynamic = checkDynamicId(node)

      analyzed.require.push({
        node,
        ancestors,
        topScopeNode: dynamic === 'dynamic'
          ? undefined
          : findTopLevelScope(ancestors) as RequireStatement['topScopeNode'],
        dynamic,
      })
    },
    AssignmentExpression(node) {
      if (node.left.type !== 'MemberExpression') return
      // only `module.exports`, `exports.xxx`
      if (!['module', 'exports'].includes(node.left.object.name)) return

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

function checkDynamicId(node: AcornNode): RequireStatement['dynamic'] {
  if (
    node.arguments[0]?.type === 'TemplateLiteral' &&
    node.arguments[0]?.quasis.length === 1
  ) {
    // e.g. require(`@/foo/bar.js`)
    return 'Literal'
  }

  // Only `require` with one-argument is supported
  return node.arguments[0]?.type !== 'Literal' ? 'dynamic' : undefined
}

// At present, only the "MemberExpression" of the one-depth is considered as the top-level scope
// 当前，只认为一层的 MemberExpression 顶级作用域
// e.g.
//   ✅ require('foo').bar
//   ❌ require('foo').bar.baz
//
// Will be return nearset scope ancestor node (🎯-①)
// 这将返回最近作用域的祖先节点
function findTopLevelScope(ancestors: AcornNode[]): AcornNode | undefined {
  const ances = ancestors.map(an => an.type).join()
  const arr = [...ancestors].reverse()

  // TODO: better top-scope detect

  if (/Program,ExpressionStatement,(MemberExpression,)?CallExpression$/.test(ances)) {
    // Program,ExpressionStatement,CallExpression                  | require('foo')
    // Program,ExpressionStatement,MemberExpression,CallExpression | require('foo').bar
    return arr.find(e => e.type === TopScopeType.ExpressionStatement)
  }
}
