/* export-runtime-S */ const module = { exports: {} }; const exports = module.exports; /* export-runtime-E */
module.exports = function fn() { };
const __CJS__export_default__ = module.exports = function fn() { };

exports.foo = 'foo';
exports.foo = 'foo';

function fn2() {
  exports.bar = exports.foo;
}

const obj = { foo: 'foo' };

exports.obj = obj;
exports.obj = obj;

// --------- vite-plugin-commonjs ---------
export { __CJS__export_default__ as default }

const __CJS__export_foo__ = (module.exports == null ? {} : module.exports).foo;
const __CJS__export_bar__ = (module.exports == null ? {} : module.exports).bar;
const __CJS__export_obj__ = (module.exports == null ? {} : module.exports).obj;
export {
  __CJS__export_foo__ as foo,
  __CJS__export_bar__ as bar,
  __CJS__export_obj__ as obj
}
