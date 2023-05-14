# vite-plugin-commonjs
一个纯 JavaScript 实现的 vite-plugin-commonjs

[![NPM version](https://img.shields.io/npm/v/vite-plugin-commonjs.svg?style=flat)](https://npmjs.org/package/vite-plugin-commonjs)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-plugin-commonjs.svg?style=flat)](https://npmjs.org/package/vite-plugin-commonjs)

[English](https://github.com/vite-plugin/vite-plugin-commonjs#readme) | 简体中文

✅ alias  
✅ bare module(node_modules)  
✅ dynamic-require 和 👉 [Webpack](https://webpack.js.org/guides/dependency-management/#require-with-expression) `require('./foo/' + bar)`类似  

📦 开箱即用  
🔨 只在 `vite serve` 阶段起作用  
🚚 在 `vite build` 阶段 CommonJs 语法由内置的 [@rollup/plugin-commonjs](https://www.npmjs.com/package/@rollup/plugin-commonjs) 插件处理  

## 使用

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
     * 1. `true` - 尽量匹配所有可能场景, 功能更像 `webpack`
     * 2. `false` - 功能更像rollup的 `@rollup/plugin-dynamic-import-vars`插件
     * @default true
     */
    loose?: boolean
    /**
     * 如果你想排除一些文件  
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
    // 默认会排除 `node_modules`，所以必须显式的包含它explicitly
    // https://github.com/vite-plugin/vite-plugin-commonjs/blob/v0.7.0/src/index.ts#L125-L127
    if (id.includes('node_modules/xxx')) {
      return true
    }
  }
})
```

## 案例

[vite-plugin-commonjs/test](https://github.com/vite-plugin/vite-plugin-commonjs/tree/main/test)

✅ require 声明

```js
// 顶级作用域
const foo = require('foo').default
// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
import foo from 'foo'

const foo = require('foo')
// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
import * as foo from 'foo'

const foo = require('foo').bar
// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
import * as __CJS_import__0__ from 'foo'; const { bar: foo } = __CJS_import__0__

// 非顶级作用域
const foo = [{ bar: require('foo').bar }]
↓
import * as __CJS_import__0__ from 'foo'; const foo = [{ bar: __CJS_import__0__.bar }]
```

✅ exports 声明

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

✅ dynamic-require 声明

*我们假设项目结构如下*

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
