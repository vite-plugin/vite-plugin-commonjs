import path from 'node:path'
import type { ResolvedConfig } from 'vite'
import fastGlob from 'fast-glob'
import {
  type Resolved,
  Resolve,
  dynamicImportToGlob,
  mappingPath,
  toLooseGlob,
} from 'vite-plugin-dynamic-import'
import { normalizePath, relativeify } from 'vite-plugin-utils/function'
import type { Options } from '.'
import type { AcornNode, Analyzed } from './analyze'
import { normallyImporteeRE } from './utils'

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
    private options: Options & { extensions: string[] },
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
        this.options.extensions,
        options.dynamic?.loose !== false,
      )
      if (!globResult) continue
      const record: DynamicRequireRecord = { node }

      let { files, resolved, normally } = globResult
      // skip itself
      files = files!.filter(f => normalizePath(path.join(path.dirname(id), f)) !== id)
      // execute the dynamic.onFiles
      options.dynamic?.onFiles && (files = options.dynamic?.onFiles(files, id) || files)

      if (normally) {
        record.normally = normally
        continue
      }

      if (!files?.length) continue

      const maps = mappingPath(
        files,
        resolved ? { [resolved.alias.relative]: resolved.alias.findString } : undefined,
      )
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
} | undefined> {
  let files: string[]
  let resolved: Resolved | undefined
  let normally: string

  const PAHT_FILL = '####/'
  const EXT_FILL = '.extension'
  let glob: string | null
  let globRaw!: string

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

  // @ts-ignore
  const globs = [].concat(loose ? toLooseGlob(glob) : glob)
    .map((g: any) => {
      g.includes(PAHT_FILL) && (g = g.replace(PAHT_FILL, ''))
      g.endsWith(EXT_FILL) && (g = g.replace(EXT_FILL, ''))
      return g
    })
  const fileGlobs = globs
    .map(g => path.extname(g)
      ? g
      // If not ext is not specified, fill necessary extensions
      // e.g.
      //   `./foo/*` -> `./foo/*.{js,ts,vue,...}`
      : g + `.{${extensions.map(e => e.replace(/^\./, '')).join(',')}}`
    )

  files = fastGlob
    .sync(fileGlobs, { cwd: /* 🚧-① */path.dirname(importer) })
    .map(file => relativeify(file))

  return { files, resolved }
}
