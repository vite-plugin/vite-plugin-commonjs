
module.exports = function fn() { };

exports.foo = 'foo';

function fn2() {
  exports.bar = exports.foo;
}

const obj = { foo: 'foo' };

exports.obj = obj;
