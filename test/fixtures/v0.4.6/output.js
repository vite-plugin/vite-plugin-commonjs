/* export-runtime-S */ const module = { exports: {} }; const exports = module.exports; /* export-runtime-E *//* import-promotion-S */ import * as __CJS__import__2__ from 'foo'; import * as __CJS__import__8__ from 'foo'; import * as __CJS__import__9__ from 'foo'; import * as __CJS__import__11__ from 'foo'; import * as __CJS__import__12__ from 'foo'; import * as __CJS__import__13__ from 'foo'; import * as __CJS__import__14__ from 'foo'; import * as __CJS__import__15__ from 'foo'; import * as __CJS__import__16__ from '@/views/home.vue'; import * as __CJS__import__17__ from 'foo'; import * as __CJS__import__18__ from 'foo'; /* import-promotion-E */
import 'foo';
import 'foo';
__CJS__import__2__.bar();

import * as foo from 'foo';
import fooDefault from 'foo';
import __CJS__import__5__ from 'foo'; const { f1, f2 : f22, f3 } = __CJS__import__5__;
import { bar as __CJS__import__6__ } from 'foo'; const { b1, b2 : b22, b3 } = __CJS__import__6__;
import { bar } from 'foo';
const baz = __CJS__import__8__.bar.baz;
const { z1, z2: z22 } = __CJS__import__9__.baz();

import * as foo_require from 'foo';
exports.foo_require = foo_require;
exports.foo = __CJS__import__11__;
exports.bar = __CJS__import__12__.bar;
exports.bar = __CJS__import__13__.bar.baz;
module.exports = __CJS__import__14__.bar.baz;
const __CJS__export_default__ = module.exports = __CJS__import__15__.bar.baz();

const routes = [{
  path: '/',
  component: __CJS__import__16__,
}];

if (__CJS__import__17__.bar) {
  console.log(__CJS__import__18__.bar.baz());
}

function fn1(path) {
  import/*🚧-🐞*/(path).then(m => m.default || m)
}

// --------- export-statement ---------
export { __CJS__export_default__ as default }

const __CJS__export_foo_require__ = (module.exports == null ? {} : module.exports).foo_require;
const __CJS__export_foo__ = (module.exports == null ? {} : module.exports).foo;
const __CJS__export_bar__ = (module.exports == null ? {} : module.exports).bar;
export {
  __CJS__export_foo_require__ as foo_require,
  __CJS__export_foo__ as foo,
  __CJS__export_bar__ as bar
}