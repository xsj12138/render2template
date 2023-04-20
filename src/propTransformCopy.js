const generator = require('@babel/generator')
const tr = require('@babel/traverse')
const t = require('@babel/types')
const generatorCode = (node) => {
  return generator.default(node).code
}
class propTransform {
  constructor(thisIdentification, ast) {
    this.thisIdentification = thisIdentification
    this.ast = ast
  }

  transform(node) {

    const { type } = node
    if (type === "ObjectProperty") {
      const { key, value } = node
      const keyName = generatorCode(key)
      if (propTransform.prototype[keyName]) {
        return this[keyName](value)
      }
      else {
        return this.others(value)
      }
    }
    else {
      return this.others(value)
    }
  }

  generatorCode(node, idFlag = true) {
    const { type } = node
    const value = generatorCode(node)
    const { thisIdentification, ast } = this
    if (!idFlag) {
      return value.replace(/"/g, "'").replace(/(^\')|(\'$)|[\n]/g, '')
    }
    tr.default(node, {
      MemberExpression(path) {
        const { node, scope } = path
        const { object, property  } = node
        const objectName = generatorCode(object)
        if (objectName === thisIdentification) {
          const hasThisIdentificationScope = scope.getBinding(thisIdentification)
          if (hasThisIdentificationScope && t.isNodesEquivalent(hasThisIdentificationScope.scope.block, ast.init)) {
            path.replaceWith(t.cloneNode(property))
          }
          path.skip()
        }
      }
    }, {}, node.path)
    let value1 = generatorCode(node)
    return value1.replace(/"/g, "'").replace(/(^\')|(\'$)|[\n]/g, '')
    switch (type) {
      case "FunctionExpression":
        const paramsHasThisIdentificationReg = new RegExp(`function\[\\s\]\*\\(\[^\\)]\*\[\^=\]\*${thisIdentification}\[^\\(]\*\\)`)
        const declarationHasThisIdentificationReg = new RegExp(`\(\\s\+|\(\{\|\,\)\[\\s\]\*\)${thisIdentification}\[\\s]*=`)
        const paramsHasThisIdentification = paramsHasThisIdentificationReg.test(value)
        const declarationHasThisIdentification = declarationHasThisIdentificationReg.test(value)
        if (paramsHasThisIdentification || declarationHasThisIdentification) {
          return value.replace(/"/g, "'").replace(/(^\')|(\'$)|[\n]/g, '')
        }
        else {
          const reg = new RegExp(`(${thisIdentification}.)[\\S]+?`, 'g')
          return value.replace(reg, function (str, $1) {
            return str.replace($1, '')
          }).replace(/"/g, "'").replace(/(^\')|(\'$)|[\n]/g, '')
        }
      default:
        const reg = new RegExp(`(${thisIdentification}.)[\\S]+?`, 'g')
        return value.replace(reg, function (str, $1) {
          return str.replace($1, '')
        }).replace(/"/g, "'").replace(/(^\')|(\'$)|[\n]/g, '')
    }
  }

  key(node) {
    const { type } = node
    if (type === "StringLiteral") {
      return [{ name: 'key', value: this.generatorCode(node) }]
    }
    else {
      return [{ name: ':key', value: this.generatorCode(node) }]
    }
  }

  slot(node) {
    const { type } = node
    if (type === "StringLiteral") {
      return [{ name: 'slot', value: this.generatorCode(node) }]
    }
    else {
      return [{ name: ':slot', value: this.generatorCode(node) }]
    }
    // else if (type === "MemberExpression") {
    //   return { name: ':slot', value: this.handleMemberExpression(node)}
    // } else if (type === "CallExpression") {
    //   return { name: ':slot', value: this.handleCallExpression(node)}
    // }
    // else {
    //   return { name: ':slot', value: generatorCode(node) }
    // }
  }

  handleMemberExpression(node) {
    const { object, property } = node
    const objectName = generatorCode(object)
    if (objectName === this.thisIdentification) {
      return generatorCode(property)
    }
    else {
      return generatorCode(node)
    }
  }

  handleCallExpression(node) {
    const { arguments: args, callee } = node
    const params = this.handleCallExpressionArgs(args)
    let calleeName = this.handleCallExpressionCallee(callee);
    return `${calleeName}(${params})`
  }

  handleCallExpressionArgs(args) {
    if (args?.length) {
      return args.map(arg => {
        const { type } = arg
        if (type === "MemberExpression") {
          return this.handleMemberExpression(arg)
        } else if (type === "CallExpression") {
          return this.handleCallExpression(arg)
        } else {
          return generatorCode(arg)
        }
      }).join(',')
    }
    else {
      return undefined
    }
  }

  handleCallExpressionCallee(callee) {
    const { type } = callee
    if (type === "MemberExpression") {
      return this.handleMemberExpression(callee)
    }
    else {
      return this.generatorCode(callee)
    }
  }

  ref(node) {
    const { type } = node
    if (type === "StringLiteral") {
      return [{ name: 'ref', value: this.generatorCode(node) }]
    }
    else {
      return [{ name: ':ref', value: this.generatorCode(node) }]
    }
  }

  is() {
    return []
  }

  pre() {
    return []
  }

  tag() {
    return []
  }

  staticClass(node) {
    return [{ name: 'class', value: this.generatorCode(node) }]
  }

  class() {
    return [{ name: ':class', value: this.generatorCode(node) }]
  }

  staticStyle(node) {
    return [{ name: 'style', value: this.generatorCode(node) }]
  }

  style(node) {
    return [{ name: ':style', value: this.generatorCode(node) }]
  }

  normalizedStyle() {
    return []
  }

  props(node) {
    const { type } = node
    if (type === "ObjectExpression") {
      const { properties } = node
      return properties.map(property => {
        const { key, value } = property
        const keyName = this.generatorCode(key)
        if (value.type === "StringLiteral") {
          return { name: `${keyName}`, value: this.generatorCode(value) }
        }
        else {
          return { name: `:${keyName}`, value: this.generatorCode(value) }
        }
      })
    }
    else {
      return []
    }
  }

  attrs(node) {
    const { type } = node
    if (type === "ObjectExpression") {
      const { properties } = node
      return properties.map(property => {
        const { key, value } = property
        const keyName = this.generatorCode(key)
        if (value.type === "StringLiteral") {
          return { name: `${keyName}`, value: this.generatorCode(value) }
        }
        else {
          return { name: `:${keyName}`, value: this.generatorCode(value) }
        }
      })
    }
    else {
      return []
    }
  }

  domProps(node) {
    const { type } = node
    if (type === "ObjectExpression") {
      const { properties } = node
      return properties.map(property => {
        const { key, value } = property
        const keyName = this.generatorCode(key)
        switch (keyName) {
          case 'innerHTML':
            return { name: 'v-html', value: this.generatorCode(value) }
          case 'textContent':
            return { name: 'v-text', value: this.generatorCode(value) }
          default:
            if (value.type === "StringLiteral") {
              return { name: `${keyName}`, value: this.generatorCode(value) }
            }
            else {
              return { name: `:${keyName}`, value: this.generatorCode(value) }
            }
        }
      })
    }
    else {
      return []
    }
  }

  hook() {
    return []
  }

  on(node) {
    const { type } = node
    if (type === "ObjectExpression") {
      const { properties } = node
      return properties.map(property => {
        const { key, value } = property
        const keyName = this.generatorCode(key)
        return { name: `@${keyName}`, value: this.generatorCode(value) }
      })
    }
    else {
      return []
    }
  }

  nativeOn(node) {
    const { type } = node
    if (type === "ObjectExpression") {
      const { properties } = node
      return properties.map(property => {
        const { key, value } = property
        const keyName = this.generatorCode(key)
        return { name: `@${keyName}`, value: this.generatorCode(value) }
      })
    }
    else {
      return []
    }
  }

  transition() {
    return []
  }

  show() {
    return []
  }

  inlineTemplate() {
    return []
  }

  getObjectPropertyByKey(node, propertyKey) {
    const { properties, type } = node
    if (type === "ObjectExpression") {
      const item = properties.find(property => {
        const { key } = property
        return this.generatorCode(key) === propertyKey
      })
      if (item) {
        return this.generatorCode(item.value)
      }
    }
  }

  directives(node) {
    const { type, tag } = node
    if (type === "TaggedTemplateExpression" && tag.type === "ArrayExpression") {
      const { elements } = tag
      return elements.map(element => {
        const name = this.getObjectPropertyByKey(element, 'rawName')
        const value = this.getObjectPropertyByKey(element, 'value')
        return { name: name, value }
      })
    }
    else {
      return []
    }
  }

  keepAlive() {
    return []
  }

  scopedSlots() {
    return []
  }

  model(node) {
    const { type } = node
    if (type === "ObjectExpression") {
      const value = this.getObjectPropertyByKey(node, 'value')
      return [ { name: 'v-model', value } ]
    }
    else {
      return []
    }
  }

  others() {
    return []
  }
}

module.exports = propTransform