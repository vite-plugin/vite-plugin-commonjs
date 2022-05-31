import path from 'path'
import { type Plugin } from 'vite'
import cjs2esm from './cjs-esm'
import {
  cleanUrl,
  isCommonjs,
  JS_EXTENSIONS,
  KNOWN_SFC_EXTENSIONS,
} from './utils'

export interface Options {
  filter?: (id: string) => false | void
}

export default function commonjs(options: Options = {}): Plugin {
  return {
    apply: 'serve',
    name: 'vite-plugin-commonjs',
    transform(code, id) {
      const pureId = cleanUrl(id)

      if (/node_modules\/(?!\.vite)/.test(pureId)) return
      if (!JS_EXTENSIONS.concat(KNOWN_SFC_EXTENSIONS).includes(path.extname(pureId))) return
      if (!isCommonjs(code)) return
      if (options.filter?.(pureId) === false) return

      return cjs2esm.call(this, code, id)
    }
  }
}
