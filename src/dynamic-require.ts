import path from 'path'
import type { ResolvedConfig } from 'vite'
import {
  type Resolved,
  dynamicImportToGlob,
  Resolve,
  utils,
} from 'vite-plugin-dynamic-import'
import fastGlob from 'fast-glob'
import type { Options } from '.'
import type { Analyzed } from './analyze'
import { AcornNode } from './types'

const {
  normallyImporteeRE,
  tryFixGlobSlash,
  toDepthGlob,
  mappingPath,
} = utils

export interface DynamicRequireRecord {
  node: AcornNode
  /** normally path */
  normally?: string
  dynaimc?: {
    importee: string[]
    runtimeName: string
    runtimeFn: string
  }
}

export class DynaimcRequire {

  constructor(
    private config: ResolvedConfig,
    private options: Options,
    private resolve = new Resolve(config),
  ) { }

  public async generateRuntime(analyzed: Analyzed): Promise<DynamicRequireRecord[] | null> {
    const options = this.options
    const id = analyzed.id
    let counter = 0
    const importCache = new Map<string, string>(/* import-id, import-name */)
    const records: DynamicRequireRecord[] = []

    for (const req of analyzed.require) {
      const { node, dynamic } = req
      if (dynamic !== 'dynamic') continue

      const globResult = await globFiles(
        node,
        analyzed.code,
        analyzed.id,
        this.resolve,
        options.extensions!,
        options.dynamic?.loose !== false,
      )
      if (!globResult) continue
      const record: DynamicRequireRecord = { node }

      let { files, resolved, normally } = globResult
      // skip itself
      files = files.filter(f => path.join(path.dirname(id), f) !== id)
      // execute the Options.onFiles
      options.onFiles && (files = options.onFiles(files, id) || files)

      if (normally) {
        record.normally = normally
        continue
      }

      if (!files?.length) continue

      const maps = mappingPath(files, resolved)
      let counter2 = 0
      record.dynaimc = {
        importee: [],
        runtimeName: `__matchRequireRuntime${counter}__`,
        runtimeFn: '', // to be immediately set
      }

      const cases: string[] = []
      for (const [localFile, importeeList] of Object.entries(maps)) {
        let dynamic_require2import = importCache.get(localFile)
        if (!dynamic_require2import) {
          importCache.set(
            localFile,
            dynamic_require2import = `__dynamic_require2import__${counter}__${counter2++}`,
          )
        }

        record.dynaimc.importee.push(`import * as ${dynamic_require2import} from '${localFile}'`)
        cases.push(importeeList
          .map(importee => `    case '${importee}':`)
          .concat(`      return ${dynamic_require2import};`)
          .join('\n'))
      }

      record.dynaimc.runtimeFn = `function ${record.dynaimc.runtimeName}(path) {
  switch(path) {
${cases.join('\n')}
    default: throw new Error("Cann't found module: " + path);
  }
}`

      records.push(record)
    }

    return records.length ? records : null
  }
}

async function globFiles(
  /** ImportExpression */
  node: AcornNode,
  code: string,
  importer: string,
  resolve: Resolve,
  extensions: string[],
  loose = true,
): Promise<{
  files?: string[]
  resolved?: Resolved
  /** After `expressiontoglob()` processing, it may become a normally path */
  normally?: string
}> {
  let files: string[]
  let resolved: Resolved
  let normally: string

  const PAHT_FILL = '####/'
  const EXT_FILL = '.extension'
  let glob: string
  let globRaw: string

  glob = await dynamicImportToGlob(
    node.arguments[0],
    code.slice(node.start, node.end),
    async (raw) => {
      globRaw = raw
      resolved = await resolve.tryResolve(raw, importer)
      if (resolved) {
        raw = resolved.import.resolved
      }
      if (!path.extname(raw)) {
        // Bypass extension restrict
        raw = raw + EXT_FILL
      }
      if (/^\.\/\*\.\w+$/.test(raw)) {
        // Bypass ownDirectoryStarExtension (./*.ext)
        raw = raw.replace('./*', `./${PAHT_FILL}*`)
      }
      return raw
    },
  )
  if (!glob) {
    if (normallyImporteeRE.test(globRaw)) {
      normally = globRaw
      return { normally }
    }
    return
  }

  glob = tryFixGlobSlash(glob)
  loose !== false && (glob = toDepthGlob(glob))
  glob.includes(PAHT_FILL) && (glob = glob.replace(PAHT_FILL, ''))
  glob.endsWith(EXT_FILL) && (glob = glob.replace(EXT_FILL, ''))

  const fileGlob = path.extname(glob)
    ? glob
    // If not ext is not specified, fill necessary extensions
    // e.g.
    //   `./foo/*` -> `./foo/*.{js,ts,vue,...}`
    : glob + `.{${extensions.map(e => e.replace(/^\./, '')).join(',')}}`

  files = fastGlob
    .sync(fileGlob, { cwd: /* 🚧-① */path.dirname(importer) })
    .map(file => !file.startsWith('.') ? /* 🚧-② */`./${file}` : file)

  return { files, resolved }
}
