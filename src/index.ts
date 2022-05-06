import { Plugin } from 'vite'
import {
  sortPlugin,
  OfficialPlugins,
  cleanUrl,
  multilineCommentsRE,
  singlelineCommentsRE,
} from 'vite-plugin-utils'
import cjs2esm from './cjs-esm'

export interface Options {
  filter?: (id: string) => false | void
}

export default function commonjs(options: Options = {}): Plugin {
  const plugin: Plugin = {
    apply: 'serve',
    name: 'vite-plugin-commonjs',
    transform(code, id) {
      const pureId = cleanUrl(id)

      if (/node_modules/.test(pureId) && !pureId.includes('.vite')) return
      if (options.filter?.(pureId) === false) return
      if (!isCommonjs(code)) return

      return cjs2esm.call(this, code, id)
    }
  }

  return sortPlugin({
    plugin,
    names: Object.values(OfficialPlugins).flat(),
    enforce: 'post',
  })
}

// ----------------------------------------------------------------------

function isCommonjs(code: string) {
  // Avoid matching the content of the comment
  code = code
    .replace(multilineCommentsRE, '')
    .replace(singlelineCommentsRE, '')
  return /\b(?:require|module|exports)\b/.test(code)
}
