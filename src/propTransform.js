const generator = require('@babel/generator')
const traverse = require('@babel/traverse')
const types = require('@babel/types')
const genCode = (node) => {
  return generator.default(node).code.replace(/"/g, "'").replace(/(^\')|(\'$)|[\n]/g, '')
}
class propTransform {
  constructor(thisIdentification, ast) {
    this.thisIdentification = thisIdentification
    this.ast = ast
  }

  traverse = traverse

  transform(node) {
    const { type } = node
    if (type === "ObjectProperty") {
      const { key, value } = node
      const keyName = genCode(key)
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

  generatorCode(node) {
    const { thisIdentification, ast } = this
    if (types.isMemberExpression(node) && genCode(node.object) === thisIdentification) {
      let flag = false
      traverse.default(node, {
        Identifier(path) {
          const { node: tNdoe, scope } = path
          const { name } = tNdoe
          if (name === thisIdentification && types.isNodesEquivalent(tNdoe, node.object)) {
            const hasThisIdentificationScope = scope.getBinding(thisIdentification)
            if (hasThisIdentificationScope && types.isNodesEquivalent(hasThisIdentificationScope.scope.block, ast.init)) {
              flag = true
              path.stop()
            }
          }
        }
      }, {}, node.path)
      if (flag) {
        return genCode(node.property)
      }
      else {
        return genCode(node)
      }
    }
    else {
      traverse.default(node, {
        MemberExpression(path) {
          const { node, scope } = path
          const { object, property } = node
          const objectName = genCode(object)
          if (objectName === thisIdentification) {
            const hasThisIdentificationScope = scope.getBinding(thisIdentification)
            if (hasThisIdentificationScope && types.isNodesEquivalent(hasThisIdentificationScope.scope.block, ast.init)) {
              path.replaceWith(property)
              //path.stop()
            }
          }
        }
      }, {}, node.path)
      return genCode(node)
    }
    //}
  }

  hasRenderHelper(node, helperName) {
    const { thisIdentification, ast } = this
    let flag = false
    if (types.isMemberExpression(node) && genCode(node.object) === thisIdentification) {
      traverse.default(node, {
        Identifier(path) {
          const { node: pathNode, scope } = path
          const { name } = pathNode
          const hasThisIdentificationScope = scope.getBinding(thisIdentification)
          const isThis = hasThisIdentificationScope && types.isNodesEquivalent(hasThisIdentificationScope.scope.block, ast.init)
          if (name === thisIdentification && types.isNodesEquivalent(pathNode, node.object) && isThis) {
            flag = true
            path.stop()
          }
        }
      }, {}, node.path)
    } else {
      traverse.default(node, {
        MemberExpression(path) {
          const { node, scope } = path
          const { object, property } = node
          const objectName = genCode(object)
          const propertyName = genCode(property)
          const hasThisIdentificationScope = scope.getBinding(thisIdentification)
          const isThis = hasThisIdentificationScope && types.isNodesEquivalent(hasThisIdentificationScope.scope.block, ast.init)
          if (objectName === thisIdentification && helperName === propertyName && isThis) {
            flag = true
            path.stop()
          }
        }
      }, {}, node.path)
    }
    return flag
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

  tag(node) {
    return [{ name: 'tag', value: this.generatorCode(node) }]
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
          return { name: `:${keyName}`, value: this.handlePropFilter(value) }
        }
      })
    }
    else {
      return []
    }
  }



  handlePropFilter(node) {
    const { type, callee } = node
    if (type === "CallExpression" && callee.type === "CallExpression" && this.hasRenderHelper(callee.callee, '_f')) {
      let str = this.generatorCode(node)
      const reg = /_f\(([^\(\)]+?)\)\(([^\(\)]+?)\)/
      let rnStr = '';
      const spaceStr = '__spaceStr'
      while (reg.test(str)) {
        const [str1, str2, str3] = reg.exec(str)
        rnStr = rnStr + `${str3 === spaceStr ? '' : str3} | ${str2.replace(/'/g, '')}`
        str = str.replace(str1, spaceStr)
      }
      return rnStr
    }
    else {
      return this.generatorCode(node)
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
          return { name: `:${keyName}`, value: this.handlePropFilter(value) }
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
        return this.handleEventProperty(property)
      })
    }
    else {
      return []
    }
  }

  handleEventProperty(node, isNative = false) {
    const { key, value } = node
    const { type } = value
    if (isNative) {
      return this.handleEventPropertyHasModifier(key, value, isNative)
    }
    else if (type === "FunctionExpression") {
      const { params, body: { body } } = value
      const hasIfStatement = body.some(item => item.type === "IfStatement")
      const hasReturnStatement = body.some(item => item.type === "ReturnStatement")
      if (params.length === 1 && genCode(params[0]) === '$event' && hasIfStatement && hasReturnStatement) {
        return this.handleEventPropertyHasModifier(key, value)
      }
      else {
        return this.handleEventPropertyNoModifier(key, value)
      }
    }
    else {
      return this.handleEventPropertyNoModifier(key, value)
    }
  }

  handleEventPropertyHasModifier(keyNode, valueNode, isNative = false) {
    const [keyModifier, keyName] = this.getEventKeyModifier(keyNode)
    const [valueModifier, functionStr] = this.getEventValueModifier(valueNode)
    const modifierArr = [...keyModifier, ...valueModifier];
    return {
      name: `@${keyName}${isNative ? '.native' : ''}${modifierArr.length ? '.' + modifierArr.join('.') : ''}`,
      value: functionStr
    }
  }

  handleEventPropertyNoModifier(keyNode, valueNode) {
    const name = this.generatorCode(keyNode)
    const value = this.generatorCode(valueNode)
    return {
      name: `@${name}`,
      value
    }
  }

  getEventKeyModifier(keyNode) {
    const keyCode = genCode(keyNode)
    const keyModifierCode = [
      {
        modifier: 'passive',
        key: '&'
      },
      {
        modifier: 'once',
        key: '~',
      },
      {
        modifier: 'capture',
        key: '!',
      }
    ]
    const modifierArr = []
    let prev;
    let index = 0
    for (index; index < 3; index++) {
      const char = keyCode.charAt(index)
      const keyModifierIndex = keyModifierCode.findIndex(keyModifier => keyModifier.key === char)
      if (keyModifierIndex > -1 && (!prev || prev < keyModifierIndex)) {
        prev = keyModifierIndex
        modifierArr.push(keyModifierCode[keyModifierIndex].modifier)
      }
      else {
        break
      }
    }
    const keyName = keyCode.substring(index)
    return [modifierArr, keyName]
  }

  getEventValueModifier(valueNode) {
    const { thisIdentification } = this
    const { body: { body } } = valueNode
    const modifierCode = {
      stop: '$event.stopPropagation();',
      prevent: '$event.preventDefault();',
      self: `$event.target !== $event.currentTarget`,
      ctrl: `!$event.ctrlKey`,
      shift: `!$event.shiftKey`,
      alt: `!$event.altKey`,
      meta: `!$event.metaKey`,
      left: `'button' in $event && $event.button !== 0`,
      middle: `'button' in $event && $event.button !== 1`,
      right: `'button' in $event && $event.button !== 2`,
      keyCode: `!$event.type.indexOf('key')`
    }
    const modifierCodeKeyArr = Object.keys(modifierCode)
    const modifierArr = []
    let functionStr;
    body.forEach(item => {
      const { type } = item
      if (type === "IfStatement") {
        const itemCode = genCode(item)
        for (let i = 0, len = modifierCodeKeyArr.length; i < len; i++) {
          const modifierCodeKeyItem = modifierCodeKeyArr[i]
          const modifierCodeStr = modifierCode[modifierCodeKeyItem]
          if (itemCode.includes(modifierCodeStr)) {
            if (modifierCodeKeyItem !== 'keyCode') {
              modifierArr.push(modifierCodeKeyItem)
              break;
            }
            else {
              const numKeyCodeReg = /\$event\.keyCode[\s]*!==[\s]*([\d]+)/
              const wordKeyCodeReg = new RegExp(`${thisIdentification}\._k\\(\\$event.keyCode,[\\s]*'([^,]+?)',[\\s]*([\\d]+|undefined),[\\s]*\\$event\.key,[\\s]*([^)]*|undefined)\\)`)
              const itemCodeArr = itemCode.split('&&')
              for (let i = 1; i < itemCodeArr.length; i++) {
                const itemCodeArrItem = itemCodeArr[i]
                if (numKeyCodeReg.test(itemCodeArrItem)) {
                  modifierArr.push(itemCodeArrItem.match(numKeyCodeReg)[1])
                }
                if (wordKeyCodeReg.test(itemCodeArrItem)) {
                  modifierArr.push(itemCodeArrItem.match(wordKeyCodeReg)[1])
                }
              }
            }
          }
        }
      }
      if (type === "ReturnStatement") {
        const { argument } = item
        if (argument.type === "CallExpression" && argument.callee.type === "FunctionExpression") {
          functionStr = this.generatorCode(argument.callee)
        }
        else {
          functionStr = this.generatorCode(argument)
        }
      }
    })
    return [modifierArr, functionStr]
  }

  nativeOn(node) {
    const { type } = node
    if (type === "ObjectExpression") {
      const { properties } = node
      return properties.map(property => {
        return this.handleEventProperty(property, true)
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

  getObjectPropertyByKey(node, propertyKey, flag = true) {
    const { properties, type } = node
    const fun = flag ? this.generatorCode.bind(this) : genCode
    if (type === "ObjectExpression") {
      const item = properties.find(property => {
        const { key } = property
        return fun(key) === propertyKey
      })
      if (item) {
        return fun(item.value)
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
      const callback = this.getObjectPropertyByKey(node, 'callback', false)
      const trimReg = new RegExp("\\(typeof[\\s]*[\\S]+[\\s]*===[\\s]*'string'[\\s]*\\?[\\s]*[\\S]+.trim\\(\\)[\\s]*:[\\s]*[\\S]+\\)")
      const hasTrim = trimReg.test(callback)
      const { thisIdentification } = this
      const numberReg = new RegExp(`${thisIdentification}._n\\([\\s\\S]+\\)`)
      const hasNumber = numberReg.test(callback)
      return [{ name: `v-model${hasTrim ? '.trim' : ''}${hasNumber ? '.number' : ''}`, value }]
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