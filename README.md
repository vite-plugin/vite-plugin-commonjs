# vite-plugin-commonjs
A pure JavaScript implementation of CommonJs

[![NPM version](https://img.shields.io/npm/v/vite-plugin-commonjs.svg?style=flat)](https://npmjs.org/package/vite-plugin-commonjs)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-commonjs.svg?style=flat)](https://npmjs.org/package/vite-plugin-commonjs)

English | [简体中文](https://github.com/vite-plugin/vite-plugin-commonjs/blob/main/README.zh-CN.md)

✅ alias  
✅ bare module(node_modules)  
✅ dynamic-require similar to 👉 [Webpack](https://webpack.js.org/guides/dependency-management/#require-with-expression) `require('./foo/' + bar)`

📦 Out of the box  
🔨 Work only in the `vite serve` phase  
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

## API <sub><sup>(Define)</sup></sub>

```ts
export interface Options {
  filter?: (id: string) => boolean | undefined
  dynamic?: {
    /**
     * 1. `true` - Match all possibilities as much as possible, more like `webpack`
     * 2. `false` - It behaves more like `@rollup/plugin-dynamic-import-vars`
     * @default true
     */
    loose?: boolean
    /**
     * If you want to exclude some files  
     * e.g.
     * ```js
     * commonjs({
     *   dynamic: {
     *     onFiles: files => files.filter(f => f !== 'types.d.ts')
     *   }
     * })
     * ```
    */
    onFiles?: (files: string[], id: string) => typeof files | undefined
  }
}
```

#### node_modules

```js
commonjs({
  filter(id) {
    // `node_modules` is exclude by default, so we need to include it explicitly
    // https://github.com/vite-plugin/vite-plugin-commonjs/blob/v0.7.0/src/index.ts#L125-L127
    if (id.includes('node_modules/xxx')) {
      return true
    }
  }
})
```

## Cases

[vite-plugin-commonjs/test](https://github.com/vite-plugin/vite-plugin-commonjs/tree/main/test)

✅ require statement

```js
// Top-level scope
const foo = require('foo').default
// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
import foo from 'foo'

const foo = require('foo')
// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
import * as foo from 'foo'

const foo = require('foo').bar
// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
import * as __CJS_import__0__ from 'foo'; const { bar: foo } = __CJS_import__0__

// Non top-level scope
const foo = [{ bar: require('foo').bar }]
↓
import * as __CJS_import__0__ from 'foo'; const foo = [{ bar: __CJS_import__0__.bar }]
```

✅ exports statement

```js
module.exports = fn() { }
// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
const __CJS__export_default__ = module.exports = fn() { }
export { __CJS__export_default__ as default }

exports.foo = 'foo'
// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
const __CJS__export_foo__ = (module.exports == null ? {} : module.exports).foo
export { __CJS__export_foo__ as foo }
```

✅ dynamic-require statement

*We assume that the project structure is as follows*

```tree
├─┬ src
│ ├─┬ views
│ │ ├─┬ foo
│ │ │ └── index.js
│ │ └── bar.js
│ └── router.js
└── vite.config.js
```

```js
// router.js
function load(name: string) {
  return require(`./views/${name}`)
}
// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
import * as __dynamic_require2import__0__0 from './views/foo/index.js'
import * as __dynamic_require2import__0__1 from './views/bar.js'
function load(name: string) {
  return __matchRequireRuntime0__(`./views/${name}`)
}
function __matchRequireRuntime0__(path) {
  switch(path) {
    case './views/foo':
    case './views/foo/index':
    case './views/foo/index.js':
      return __dynamic_require2import__0__0;
    case './views/bar':
    case './views/bar.js':
      return __dynamic_require2import__0__1;
    default: throw new Error("Cann't found module: " + path);
  }
}
```
