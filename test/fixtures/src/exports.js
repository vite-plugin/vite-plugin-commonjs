
const { hello, world } = require('./dynamic')

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
