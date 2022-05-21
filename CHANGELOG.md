
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

e546cb7 (HEAD -> v0.4.5, github/v0.4.5) docs: function-scope
6d3c9d9 feat: 🚧-🐞 support function scope require()
68add57 fix(🐞): re implementation overwrite()
abf41ed docs: v0.4.5
9429f63 fix: check this.overwrites empty
7075e03 fix: Bypass Pre-build
2a66ff3 refactor: use utils.MagicString
e4173d3 feat: class MagicString
aa5b885 refactor: use utils.simpleWalk()
94aa885 feat: simpleWalk()
60135e4 fix: improve findtoplevelscope
39f8505 chore: rename topLevelNode -> topScopeNode
174b2d6 chore: update comment
aeebcab fix: filter node_modules
c5ae2c0 refactor: use utils.isCommonjs instead isCommonjs
2a0f85a add utils.ts