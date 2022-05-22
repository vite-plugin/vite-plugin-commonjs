# vite-plugin-commonjs
A pure JavaScript implementation for CommonJs

[![NPM version](https://img.shields.io/npm/v/vite-plugin-commonjs.svg?style=flat)](https://npmjs.org/package/vite-plugin-commonjs)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-commonjs.svg?style=flat)](https://npmjs.org/package/vite-plugin-commonjs)

English | [简体中文](https://github.com/vite-plugin/vite-plugin-commonjs/blob/main/README.zh-CN.md)

🔨 The plugin only work in the  `vite serve` phase  
🚚 In the `vite build` phase, CommonJs syntax will be supported by builtin [@rollup/plugin-commonjs](https://www.npmjs.com/package/@rollup/plugin-commonjs)  

## Usage

```js
import commonjs from 'vite-plugin-commonjs'

export default {
  plugins: [
    commonjs(/* options */),
  ]
}
```

## API

```ts
export interface Options {
  filter?: (id: string) => false | void
}
```

## TODO

✅ Nested scope(function-scope) 🔨

At present `v0.4.5`, require statement in the function scope will be converted to dynamic import

```js
function (id) {
  require(id)
}
↓
function (id) {
  import(id).then(m => m.default || m)
}
```

*🚧 It is planned to be compatible with this case through Sync-Ajax in `v0.5.0` version*

❌ Dynamic require id

✅ `node_modules/.vite` 🤔

This plugin only handles `require()` under `node_modules/.vite` and 🚧 **ignores** `exports`

✅ require statement

```js
// Top-level scope
const foo = require('foo').default
↓
import foo from 'foo';

const foo = require('foo')
↓
import * as foo from 'foo';

const foo = require('foo').bar
↓
import * as __CJS_import__0__ from 'foo'; const { bar: foo } = __CJS_import__0__;

// Non top-level scope
const foo = [{ bar: require('foo').bar }]
↓
import * as __CJS_import__0__ from 'foo'; const foo = [{ bar: __CJS_import__0__.bar }]
```

✅ exports statement

```js
module.exports = fn() { };
↓
const __CJS__export_default__ = module.exports = fn() { };
export { __CJS__export_default__ as default }

exports.foo = 'foo';
↓
const __CJS__export_foo__ = (module.exports == null ? {} : module.exports).foo;
export { __CJS__export_foo__ as foo }
```
