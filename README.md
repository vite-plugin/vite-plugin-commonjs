# vite-plugin-commonjs
A pure JavaScript implementation for CommonJs

[![NPM version](https://img.shields.io/npm/v/vite-plugin-commonjs.svg?style=flat)](https://npmjs.org/package/vite-plugin-commonjs)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-commonjs.svg?style=flat)](https://npmjs.org/package/vite-plugin-commonjs)

English | [简体中文](https://github.com/vite-plugin/vite-plugin-commonjs/blob/main/README.zh-CN.md)

## 📢

- The plugin only work in the  `vite serve` phase
- In the `vite build` phase, CommonJs syntax will be supported by builtin [@rollup/plugin-commonjs](https://www.npmjs.com/package/@rollup/plugin-commonjs)

## Usage

```js
import commonjs from 'vite-plugin-commonjs'

export default {
  plugins: [
    commonjs(),
  ]
}
```

## TODO

- [ ] Nested scope
- [ ] Dynamic require id
