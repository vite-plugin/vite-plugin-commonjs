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
