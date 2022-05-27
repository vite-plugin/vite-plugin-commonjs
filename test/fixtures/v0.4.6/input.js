
require('foo');
require('foo').bar;
require('foo').bar();

const foo = require('foo');
const fooDefault = require('foo').default;
const { f1, f2: f22, f3 } = require('foo').default;
const { b1, b2: b22, b3 } = require('foo').bar;
const bar = require('foo').bar;
const baz = require('foo').bar.baz;
const { z1, z2: z22 } = require('foo').baz();

const foo_require = require('foo');
exports.foo_require = foo_require;
exports.foo = require('foo');
exports.bar = require('foo').bar;
exports.bar = require('foo').bar.baz;
module.exports = require('foo').bar.baz;
module.exports = require('foo').bar.baz();

const routes = [{
  path: '/',
  component: require('@/views/home.vue'),
}];

if (require('foo').bar) {
  console.log(require('foo').bar.baz());
}

function fn1(path) {
  require(path)
}