import path from 'path'
import { Plugin } from 'vite'
import {
  sortPlugin,
  OfficialPlugins,
  cleanUrl,
  multilineCommentsRE,
  singlelineCommentsRE,
  JS_EXTENSIONS,
  KNOWN_SFC_EXTENSIONS,
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

      if (/node_modules/.test(pureId) /* && !pureId.includes('.vite') */) return
      if (!JS_EXTENSIONS.concat(KNOWN_SFC_EXTENSIONS).includes(path.extname(pureId))) return
      if (!isCommonjs(code)) return
      if (options.filter?.(pureId) === false) return

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
