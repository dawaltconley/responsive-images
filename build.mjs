import fs from 'node:fs'
import path from 'node:path'
import tsc from 'node-typescript-compiler'

import tsconfig from './tsconfig.json' assert { type: 'json' }

const outDir = tsconfig.compilerOptions.outDir

// cleanup
fs.rmSync(outDir, { recursive: true })

// compile
await tsc.compile({ project: '.' })

// copy sass mixins
fs.mkdirSync(path.join('.', outDir, 'sass'), { recursive: true })
fs.copyFileSync(
  './src/sass/_mixins.scss',
  path.join('.', outDir, 'sass', '_mixins.scss')
)

console.log('done')
