import path from 'node:path'
import type { ResolvedConfig } from 'vite'
import {
  Resolve,
  mappingPath,
  globFiles,
} from 'vite-plugin-dynamic-import'
import { normalizePath, COLOURS } from 'vite-plugin-utils/function'
import {
  type Options,
  TAG,
} from '.'
import type { Analyzed } from './analyze'

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

    for (const { dynamic, node } of analyzed.require) {
      if (dynamic !== 'dynamic') continue

      const importExpression = analyzed.code.slice(node.start, node.end)
      const globResult = await globFiles({
        importeeNode: node.arguments[0],
        importExpression,
        importer: analyzed.id,
        resolve: this.resolve,
        extensions: this.options.extensions,
        loose: options.dynamic?.loose !== false,
      })
      if (!globResult) continue
      const record: DynamicRequireRecord = { node }

      let { files, resolved, normally } = globResult

      if (normally) {
        record.normally = normally
        continue
      }

      if (!files?.length) {
        console.log(
          TAG,
          COLOURS.yellow(`no files matched: ${importExpression}\n`),
          `  file: ${analyzed.id}`,
        )
        continue
      }

      // skip itself
      files = files.filter(f => normalizePath(path.join(path.dirname(id), f)) !== id)
      // execute the dynamic.onFiles
      options.dynamic?.onFiles && (files = options.dynamic?.onFiles(files, id) || files)

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
