/* [vite-plugin-commonjs] export-runtime-S */ var module = { exports: {} }; var exports = module.exports; /* [vite-plugin-commonjs] export-runtime-E *//* [vite-plugin-commonjs] import-hoist-S */ import * as __CJS__import__0__ from "./dynamic"; /* [vite-plugin-commonjs] import-hoist-E */
const { hello, world } = __CJS__import__0__.default || __CJS__import__0__

// ❌ `exports` exported members are dynamic.
// import { cjs } from './cjs'
// ✅
import cjs from './cjs'

exports.msg = `
[foo.js]

const { hello, world } = require('./dynamic')

hello: ${hello}
world: ${world}

<hr/>
[cjs.js]

import cjs from './cjs'

cjs: ${JSON.stringify(cjs)}
`
/* [vite-plugin-commonjs] export-statement-S */
const __CJS__export_default__ = (module.exports == null ? {} : module.exports).default || module.exports;
const __CJS__export_msg__ = (module.exports == null ? {} : module.exports).msg;
export {
  __CJS__export_default__ as default,
  __CJS__export_msg__ as msg,
}
/* [vite-plugin-commonjs] export-statement-E */