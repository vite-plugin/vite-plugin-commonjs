/* export-runtime-S */ const module = { exports: {} }; const exports = module.exports; /* export-runtime-E */
import { hello, world } from './dynamic';

exports.msg = `
[foo.js]

const { hello, world } = require('./dynamic')

hello: ${hello}
world: ${world}
`
/* export-statement-S */
const __CJS__export_msg__ = (module.exports == null ? {} : module.exports).msg;
export {
  __CJS__export_msg__ as msg,
}
/* export-statement-E */