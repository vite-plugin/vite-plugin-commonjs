import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { createServer } from 'vite'
const commonjs = createRequire(import.meta.url)('../dist').default

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const server = await createServer({
  configFile: false,
  root: __dirname,
  plugins: [
    commonjs(),
    {
      name: 'vite-plugin-commonjs-test',
      transform(code, id) {
        if (/fixtures\/.+\/input\.js$/.test(id)) {
          // Write transformed code to output.js
          fs.writeFileSync(path.join(path.dirname(id), 'output.js'), code)
        }
      },
    },
  ],
})

await server.listen()
const { address, port } = server.httpServer.address()
server.config.logger.info(`[test/serve] 👉 dev server running at: http://${address}:${port}`, { timestamp: true })