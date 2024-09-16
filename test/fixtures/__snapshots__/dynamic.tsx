/* [vite-plugin-commonjs] import-require2import-S */ import * as __dynamic_require2import__1__0 from './module-exports/hello.cjs'; import * as __dynamic_require2import__1__1 from './module-exports/world.cjs'; /* [vite-plugin-commonjs] import-require2import-E */function load(name) {
  const mod = __matchRequireRuntime0__(`@/module-exports/${name}`);
  console.log(mod);
  return mod;
}
export const hello = `[dynamic.tsx] ${load("hello.cjs").default}`;
export const world = `[dynamic.tsx] ${load("world.cjs").default}`;

function __matchRequireRuntime0__(path) {
  switch(path) {
    case '@/module-exports/hello':
    case '@/module-exports/hello.cjs':
      return __dynamic_require2import__1__0;
    case '@/module-exports/world':
    case '@/module-exports/world.cjs':
      return __dynamic_require2import__1__1;
    default: throw new Error("Cann't found module: " + path);
  }
}