
function load(name: string) {
  const mod = require(`@/module-exports/${name}`)
  console.log(mod)
  return mod
}

export const hello = `[dynamic.tsx] ${load('hello.cjs').default}`
export const world = `[dynamic.tsx] ${load('world.cjs').default}`
