const fs = require('fs')
const path = require('path')
const tsc = require('node-typescript-compiler')
const tsconfig = require('./tsconfig')

const outDir = tsconfig.compilerOptions.outDir

tsc.compile({ project: '.' }).then(() => {
  fs.mkdirSync(path.join('.', outDir, 'sass'), { recursive: true })
  fs.copyFileSync(
    './src/sass/_mixins.scss',
    path.join('.', outDir, 'sass', '_mixins.scss')
  )
  console.log('done')
})
