import {
  multilineCommentsRE,
  singlelineCommentsRE,
} from 'vite-plugin-utils'

export function isCommonjs(code: string) {
  // Avoid matching the content of the comment
  code = code
    .replace(multilineCommentsRE, '')
    .replace(singlelineCommentsRE, '')
  return /\b(?:require|module|exports)\b/.test(code)
}