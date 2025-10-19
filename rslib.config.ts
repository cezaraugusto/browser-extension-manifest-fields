import * as path from 'path'
import {defineConfig} from '@rslib/core'

export default defineConfig({
  source: {
    entry: {
      index: path.resolve(__dirname, './index.ts'),
      'manifest-fields/index': path.resolve(
        __dirname,
        './manifest-fields/index.ts'
      ),
      'special-folders/index': path.resolve(
        __dirname,
        './special-folders/index.ts'
      )
    }
  },
  lib: [{format: 'cjs', dts: true}]
})
