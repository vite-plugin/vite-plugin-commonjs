import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'
import commonjs from '../..'

export default defineConfig({
  root: __dirname,
  plugins: [
    commonjs(),
    {
      name: 'vite-plugin-commonjs-test',
      transform(code, id) {
        if (/\/src\//.test(id)) {
          // write transformed code to dist/
          const filename = id.replace('src', 'dist')
          const dirname = path.dirname(filename)
          if (!fs.existsSync(dirname)) fs.mkdirSync(dirname)
          fs.writeFileSync(filename, code)
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
    extensions: [
      '.cjs',
      '.mjs',
      '.js',
      '.mts',
      '.ts',
      '.jsx',
      '.tsx',
      '.json',
    ],
  },
})
