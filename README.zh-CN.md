# vite-plugin-commonjs
一个纯 JavaScript 实现的 vite-plugin-commonjs

[English](https://github.com/vite-plugin/vite-plugin-commonjs#readme) | 简体中文

[![NPM version](https://img.shields.io/npm/v/vite-plugin-commonjs.svg?style=flat)](https://npmjs.org/package/vite-plugin-commonjs)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-commonjs.svg?style=flat)](https://npmjs.org/package/vite-plugin-commonjs)

🔨 只在 `vite serve` 阶段起作用  
🚚 在 `vite serve` 阶段 CommonJs 语法由内置的 [@rollup/plugin-commonjs](https://www.npmjs.com/package/@rollup/plugin-commonjs) 处理  

## 使用

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
