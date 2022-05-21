import {
  multilineCommentsRE,
  singlelineCommentsRE,
} from 'vite-plugin-utils'
import { AcornNode } from './types'

export function isCommonjs(code: string) {
  // Avoid matching the content of the comment
  code = code
    .replace(multilineCommentsRE, '')
    .replace(singlelineCommentsRE, '')
  return /\b(?:require|module|exports)\b/.test(code)
}


export function simpleWalk(
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
// TODO
simpleWalk.async = function simpleWalkAsync() { }