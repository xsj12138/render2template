const parser = require('@babel/parser')
const fs = require('fs-extra')
const path = require('path')

fs.readFile(path.resolve(__dirname, 'demo.js'),  'utf-8', (err, data) => {
  if (!err && data) {
    const ast = parser.parse(data)
    console.log(ast)
  }
})
