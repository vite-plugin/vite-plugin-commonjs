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

- [ ] Nested scope(function-scope)
- [ ] Dynamic require id
- [x] require statement

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

- [ ] exports statement
