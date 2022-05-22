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
    [type: string]: (node: AcornNode, ancestors: AcornNode[]) => void,
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

export class MagicString {
  private overwrites: { loc: [number, number]; content: string }[]
  private starts = ''
  private ends = ''

  constructor(
    public str: string
  ) { }

  public append(content: string) {
    this.ends += content
    return this
  }

  public prepend(content: string) {
    this.starts = content + this.starts
    return this
  }

  public overwrite(start: number, end: number, content: string) {
    if (end < start) {
      throw new Error(`"end" con't be less than "start".`)
    }
    const item: typeof this.overwrites[0] = { loc: [start, end], content }
    if (!this.overwrites) {
      this.overwrites = [item]
    } else {
      const index = this.overwrites.findIndex(e => e.loc[0] <= start)
      if (index > -1) {
        this.overwrites.splice(index, 0, item)
      } else {
        this.overwrites.push(item)
      }
    }

    // 🐞
    // this.overwrites = this.overwrites
    //   ? this.overwrites.reduce(
    //     (memo, e) => start >= e.loc[0] ? [...memo, item, e] : [...memo, e, item],
    //     [])
    //   : [item]
    return this
  }

  public toString() {
    let str = this.str
    if (this.overwrites) {
      for (const { loc: [start, end], content } of this.overwrites) {
        // TODO: check start or end overlap
        str = str.slice(0, start) + content + str.slice(end)
      }
    }
    return this.starts + str + this.ends
  }
}