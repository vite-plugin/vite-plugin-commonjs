import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'
import commonjs from '..'

fs.rmSync(path.join(__dirname, 'src-output'), { force: true, recursive: true })

export default defineConfig({
  root: __dirname,
  plugins: [
    commonjs(),
    {
      name: 'vite-plugin-commonjs-test',
      transform(code, id) {
        if (/\/src\//.test(id)) {
          // Write transformed code to output/
          const filename = id.replace('src', 'src-output')
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
