const parser = require('@babel/parser')
const traverse = require('@babel/traverse')
const fs = require('fs-extra')
const MyParser = require('./Parser')
const path = require('path')
const staticBasePath = '../../../检查员信息管理/源码/webpack/src/views/taskBench/daily-examine/entrance'
const filePath = process.argv[2] || 'App-render.js'
const outputPath = process.argv[3] || 'output'
const basePath = process.argv[4] ? process.argv[4] : process.argv[2] ?  staticBasePath : ''

fs.readFile(path.resolve(__dirname, basePath, filePath), 'utf-8', (err, data) => {
  if (!err && data) {
    const ast = parser.parse(data)
    let render;
    let staticRenderFns;
    traverse.default(ast, {
      "VariableDeclarator"(path) {
        if (path.node.id.name === 'render') {
          render = path.node
          path.skip()
        }
        if (path.node.id.name === 'staticRenderFns') {
          staticRenderFns = path.node
          path.skip()
        }
        if (render && staticRenderFns) {
          path.stop()
        }
      }
    })
    //const renderTransform = new RenderTransform(render, staticRenderFns)
    const myParser = new MyParser(render, staticRenderFns)
    fs.outputFile(path.resolve(__dirname, outputPath, filePath.replace(/.js/, '.vue')), myParser.code, 'utf-8')
  }
})
