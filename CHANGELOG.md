## 0.10.4 (2024-11-21)

- b1ff4b6 feat: bump vite-plugin-utils to 0.4.4 to support `.cjs`, `.cts` extension by default
- debe58a fix: bump vite-plugin-utils to 0.4.4 for large cjs bundles #62

## 0.10.3 (2023-09-16)

- e369497 chore: bump deps
- 7c9ee77 fix: works with `@vitejs/plugin-vue2` #49

## 0.10.2 (2023-09-15)

- 7704cd4 chore: add comments
- 5c3e702 bugfix #54
- 5e3294e docs: add commonjs.zh-CN.md link
- ff77d51 feat: add commonjs.zh-CN.md, commonjs.jpg

## 0.10.1 (2023-11-14)

- 492aab3 fix(#42): auto-increment dynamic require id

## 0.10.0 (2023-10-08)

- c286fe2 chore: backup files
- f1e672b chore: update test v0.10.0
- 63324c2 chore: backup export
- 2eefcbc fix: always export `default`
- de0a56e feat: supports full module interop

## 0.9.0 (2023-08-26)

- 49e77ca chore: update test
- 61a9fe5 chore: code format
- c1e1ceb feat: support advanced import rules option

#### PR

- @Jinjiang feat: support advanced import rules option #35

## 0.8.2 (2023-07-17)

- feat: update to ES2023 #32, closes [#32](https://github.com/vite-plugin/vite-plugin-commonjs/issues/32)

## 0.8.1 (2023-07-12)

- dfd8742 feat: generate sourcemap #28
- 4257aa6 chore: remove `build.test.ts`
- 23b7cdf fix: correct esbuild loader
- ef781ec Merge pull request #29 from vite-plugin/v0.8.0

## 0.8.0 (2023-06-24)

- bf2f306 fix: dynamic-require typo #28, closes [#28](https://github.com/vite-plugin/vite-plugin-commonjs/issues/28)
- 66ce5dd feat: support build

## 0.7.1 (2023-05-14)

- ddfbfeb fix: bump vite-plugin-dynamic-import to 1.4.0 for `pnpm`
- 356c22e chore: cleanup
- 4e4f807 docs: update

## 0.7.0 (2023-04-30)

- e9eb5f0 refactor(test): integrate vitest 🌱
- 0c892f1 chore: bump deps
- 750fd4b chore: cleanup
- 4691bcc feat: `glob` files log
- 80f46f0 refactor: cleanup
- 7d6a47f chore: backup `v0.5.3`
- 782db06 docs: v0.7.0
- d3207f3 refactor(build): better scripts
- e69a65a refactor: better support `node_modules` #23
- 62a8cd9 chore: cleanup types

## 0.6.2 (2023-03-12)

- enhancement: support node_modules | #19

## 0.6.1 (2022-12-10)

- b163947 v0.6.1
- 232042f feat: cjs examples
- 4ad7a9b fix: `var` instead `const` #17

```diff
- const module = { exports: {} }; const exports = module.exports;
+ var module = { exports: {} }; var exports = module.exports;
```

## 0.6.0 (2022-11-27)

#### More like Vite, loose syntax!

**0.6.x**

```js
const { foo } = require('foo')
↓
const { foo } = __CJS__import__0__.default || __CJS__import__0__
```

```js
const bar = require('bar')
↓
import * as __CJS__import__0__ from '/bar'
const bar = __CJS__import__0__.default || __CJS__import__0__
```

**0.5.x**

```js
const { foo } = require('foo')
↓
import { foo } from 'foo'
```

```js
const bar = require('bar')
↓
import * as __CJS__import__0__ from '/bar'
const bar = __CJS__import__0__
```

#### Main commit

- eda5464 v0.6.0
- b5f7089 refactor!: loose syntax convert #15

## 0.5.3 (2022-10-16)

- ee0a882 `src-output` -> `__snapshots__`
- 16593ff v0.5.3
- 2a5752b docs: v0.5.3
- 236730a refactor: use vite-plugin-utils
- bb793a5 chore: update config
- 1148671 feat: support `"type": "module"`
- f590da1 chore: `"strict": true`
- cf98458 bump deps
- 04f95f7 chore: bump deps
- 0434172 chore: update comments

---

## [2022-05-04] v0.3.0

- 🔨 Refactor v0.2.6 | 0d694c438db42b0283ff949e694e2e8fbeca6785
- 🌱 Add test | 419be39fc2a74edec6dc453e7ffa8cc99e76bbf4

## [2022-05-04] v0.3.2

- 🌱 Support all require-statement | ef8691e
- 🌱 Add samples | 8bbcc7a

## [2022-05-04] v0.4.0

- 🌱 Support exports statement | 5c75137
- 🐞 Apply serve | 8bc7bf9

## [2022-05-04] v0.4.4

- 🐞 export default empty value | a8897c5
- 🐞 duplicate export | 217110f
- 🐞 skip empty require id | c56173d
- 🐞 extension detect | 579dda9

## [2022-05-21] v0.4.5

- e546cb7 docs: function-scope
- 6d3c9d9 feat: 🚧-🐞 support function scope require()
- 68add57 fix(🐞): re implementation overwrite()
- abf41ed docs: v0.4.5
- 9429f63 fix: check this.overwrites empty
- 7075e03 fix: Bypass Pre-build
- 2a66ff3 refactor: use utils.MagicString
- e4173d3 feat: class MagicString
- aa5b885 refactor: use utils.simpleWalk()
- 94aa885 feat: simpleWalk()
- 60135e4 fix: improve findtoplevelscope
- 39f8505 chore: rename topLevelNode -> topScopeNode
- 174b2d6 chore: update comment
- aeebcab fix: filter node_modules
- c5ae2c0 refactor: use utils.isCommonjs instead isCommonjs
- 2a0f85a add utils.ts

## [2022-05-12] v0.4.6
- 6f8c1d6 refactor: better code
- 3f7e008 fix(🐞): improve MagicString.overwrite()

## [2022-05-13] v0.4.7

- 4d44b15 vite-plugin-commonjs@0.4.7
- a9ad902 test: v0.4.7
- 095c40f chore: comments
- 2dc2637 refactor: imporve generate-export

## [2022-06-16] v0.5.0

- 04be6ad docs: v0.5.0
- eeecebf test: v0.5.0
- 0ddb4ed remove cjs-esm.ts
- 1198cdc feat(v0.5.0): support dynamic require
- ec74309 faet: const - KNOWN_ASSET_TYPES, KNOWN_CSS_TYPES, builtins
- 4346d86 chore: comments
- 9560e5b feat(v0.5.0): dynamic-require.ts

## [2022-06-20] v0.5.1

- 961cbb5 docs: v0.5.1
- 1584867 chore: more exact RegExp
- 82301e3 refactor: `options.dynamic` instead of `options.depth`
- 3b471ad chore: comments

## [2022-06-24] v0.5.2

- a11aeaf test: v0.5.2
- 83d9f3d docs: v0.5.2
- b7e02cd refactor: move `options.onFiles` to `options.dynamic.onFiles`
