import { builtinModules } from 'module'
import { type AcornNode } from './types'

// ------------------------------------------------- RegExp

export const multilineCommentsRE = /\/\*(.|[\r\n])*?\*\//gm
export const singlelineCommentsRE = /\/\/.*/g
export const queryRE = /\?.*$/s
export const hashRE = /#.*$/s

// ------------------------------------------------- const

export const JS_EXTENSIONS = [
  '.mjs',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.cjs'
]
export const KNOWN_SFC_EXTENSIONS = [
  '.vue',
  '.svelte',
]
// https://github.com/vitejs/vite/blob/d6418605577319b2f92ea37081e34376bb47b286/packages/vite/src/node/constants.ts#L66
export const KNOWN_ASSET_TYPES = [
  // images
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'ico',
  'webp',
  'avif',

  // media
  'mp4',
  'webm',
  'ogg',
  'mp3',
  'wav',
  'flac',
  'aac',

  // fonts
  'woff2?',
  'eot',
  'ttf',
  'otf',

  // other
  'webmanifest',
  'pdf',
  'txt'
]
export const KNOWN_CSS_TYPES = [
  'css',
  'less',
  'sass',
  'scss',
  'styl',
  'stylus',
  'pcss',
  'postcss',
]
export const builtins = [
  ...builtinModules.map(m => !m.startsWith('_')),
  ...builtinModules.map(m => !m.startsWith('_')).map(m => `node:${m}`)
]


// ------------------------------------------------- function

export function cleanUrl(url: string): string {
  return url.replace(hashRE, '').replace(queryRE, '')
}

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
    if (!this.overwrites) {
      this.overwrites = []
    }

    this.overwrites.push({ loc: [start, end], content })
    return this
  }

  public toString() {
    let str = this.str
    if (this.overwrites) {
      const arr = [...this.overwrites].sort((a, b) => b.loc[0] - a.loc[0])
      for (const { loc: [start, end], content } of arr) {
        // TODO: check start or end overlap
        str = str.slice(0, start) + content + str.slice(end)
      }
    }
    return this.starts + str + this.ends
  }
}
