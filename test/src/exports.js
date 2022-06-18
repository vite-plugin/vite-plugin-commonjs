
const { hello, world } = require('./dynamic')

exports.msg = `
[foo.js]

const { hello, world } = require('./dynamic')

hello: ${hello}
world: ${world}
`
