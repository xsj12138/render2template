
const generator = require('@babel/generator')
const traverse = require('@babel/traverse')
const types = require('@babel/types')
const genCode = (node) => {
  const requireReg = /__webpack_require__\([\s]*\/\*\!([\s\S]*[\s])*\*\/[\s\S]+\)/
  return generator.default(node).code.replace(requireReg, (str, $1) => `require('${$1.trim()}')`).replace(/"/g, "'").replace(/^\'([^\']*)\'$/, (str, $1) => $1).replace(/\n/g, ' ').replace(/\s{2,}/, ' ')
  //.replace(/(^\')|(\'$)|[\n]/g, '')
}
class Transformer {
  constructor(ast, staticFns) {
    const { type } = ast
    this.staticFns = Array.isArray(staticFns) ? staticFns : []
    if (type === "FunctionExpression") {
      this.ast = ast
      this.initInfo()
    }
  }

  initInfo() {
    const { body } = this.ast.body;
    const returnStatement = [];
    const variableDeclaration = [];
    body.forEach(node => {
      if (node.type === "VariableDeclaration") {
        variableDeclaration.push(node)
      }
      if (node.type === "ReturnStatement") {
        returnStatement.push(node)
      }
    })
    this.variableDeclaration = variableDeclaration
    this.returnStatement = returnStatement
    this.getThisIdentification()
    this.gethIdentification()
    this.getRenderIdentification()
    const rootCtx = {
      tag: 'template',
      props: [],
      children: []
    }
    this.transform(this.returnStatement[0].argument, rootCtx)
    this.root = [rootCtx]
  }

  getThisIdentification(variableDeclaration = this.variableDeclaration) {
    for (let index = 0, len = variableDeclaration.length; index < len; index++) {
      const variableDeclarationItem = variableDeclaration[index]
      if (variableDeclarationItem.declarations) {
        this.getThisIdentification(variableDeclarationItem.declarations)
      }
      else if (variableDeclarationItem?.init?.type === "ThisExpression") {
        this.thisVariableDeclaration = variableDeclarationItem
        this.thisIdentification = variableDeclarationItem.id.name
        break
      }
    }
    if (!this.thisIdentification) {
      throw new Error('无法找到this对应的变量')
    }
  }

  gethIdentification(variableDeclaration = this.variableDeclaration) {
    for (let index = 0, len = variableDeclaration.length; index < len; index++) {
      const variableDeclarationItem = variableDeclaration[index]
      if (variableDeclarationItem.declarations) {
        this.gethIdentification(variableDeclarationItem.declarations)
      }
      else if (variableDeclarationItem?.init?.type === "MemberExpression" && variableDeclarationItem?.init?.object?.name === this.thisIdentification && variableDeclarationItem?.init?.property?.name === "$createElement") {
        this.hVariableDeclaration = variableDeclarationItem
        this.hIdentification = variableDeclarationItem.id.name
        break
      }
    }
    if (!this.thisIdentification) {
      throw new Error('无法找到createElement对应的变量')
    }
  }

  getRenderIdentification(variableDeclaration = this.variableDeclaration) {
    for (let index = 0, len = variableDeclaration.length; index < len; index++) {
      const variableDeclarationItem = variableDeclaration[index]
      if (variableDeclarationItem.declarations) {
        this.getRenderIdentification(variableDeclarationItem.declarations)
      }
      else if (variableDeclarationItem?.init?.type === "LogicalExpression" && variableDeclarationItem?.init?.operator === "||" && variableDeclarationItem?.init?.right.name === this.hIdentification) {
        this.renderVariableDeclaration = variableDeclarationItem
        this.renderIdentification = variableDeclarationItem.id.name
        break
      }
    }
    if (!this.thisIdentification) {
      throw new Error('无法找到render函数对应的变量')
    }
  }

  isRenderFunctionNode(node) {
    const { type, callee } = node
    const { renderIdentification, ast } = this
    let isRenderFlag = false
    if (type === "CallExpression" && callee.name === renderIdentification) {
      traverse.default(node, {
        Identifier: (path) => {
          const { node: pathNode, scope } = path
          const hasRenderIdentification = scope.getBinding(renderIdentification)
          const isRender = hasRenderIdentification && types.isNodesEquivalent(hasRenderIdentification.scope.block, ast)
          if (pathNode.name === renderIdentification && types.isNodesEquivalent(pathNode, callee) && isRender) {
            isRenderFlag = true
            path.stop()
          }
        }
      }, {}, node.path)
    }
    return isRenderFlag
  }

  isConditionalExpressionNode(node) {
    return node.type === 'ConditionalExpression'
  }

  isThisIdentificationNode(node) {
    const { type, object } = node
    let isThisIdentification = false
    const { thisIdentification, ast } = this
    if (type === "MemberExpression" && object.name === thisIdentification) {
      traverse.default(node, {
        Identifier(path) {
          const { node: pathNdoe, scope } = path
          const { name } = pathNdoe
          const hasThisIdentificationScope = scope.getBinding(thisIdentification)
          const isThis = hasThisIdentificationScope && types.isNodesEquivalent(hasThisIdentificationScope.scope.block, ast)
          if (name === thisIdentification && types.isNodesEquivalent(pathNdoe, object) && isThis) {
            isThisIdentification = true
            path.stop()
          }
        }
      }, {}, node.path)
    }
    return isThisIdentification
  }

  transformRenderFunctionNode(node) {
    if (this.isRenderFunctionNode(node)) {
      const { arguments: args } = node
      const len = args[args.length - 1].type === "NumericLiteral" ? args.length - 1 : args.length
      const ctx = {
        tag: '',
        props: [],
        children: []
      }
      if (len >= 3) {
        const [tag, props, children] = args
        ctx.tag = this.generatorCode(tag)
        this.transformProps(props, ctx)
        this.transform(children, ctx)
      } else if (len === 2) {
        const [tag, arg1] = args
        ctx.tag = this.generatorCode(tag)
        const { type } = arg1
        if (type === "ObjectExpression") {
          this.transformProps(arg1, ctx)
        }
        else if (type === "CallExpression" && this.isThisIdentificationNode(arg1.callee)) {
          const { property } = arg1.callee
          const propertyCode = genCode(property)
          switch (propertyCode) {
            case '_b':
              this.transformPropsWithVBind(arg1, ctx)
              break
            case '_g':
              this.transformPropsWithListeners(arg1, ctx)
              break
            case '_v':
              this.transformChildWithText(arg1, ctx)
              break
            case '_m':
              this.transformChildWithStatic(arg1, ctx)
              break
            case '_l':
              this.transformChildWithVFor(arg1, ctx)
              break
          }
        } else if (type === "ArrayExpression") {
          this.transform(arg1, ctx)
        }
      } else if (len === 1) {
        const [tag] = args
        ctx.tag = this.generatorCode(tag)
      } else {
        throw new Error('无法转换的节点')
      }
      return ctx
    }
    else {
      throw new Error('无法转换的节点')
    }
  }

  conditionalExpressionToArr(node) {
    const arr = []
    const { alternate, consequent, test } = node
    arr.push({ test, node: consequent })
    if (alternate.type === "ConditionalExpression") {
      Array.prototype.push.apply(arr, this.conditionalExpressionToArr(alternate))
    }
    else {
      arr.push({ node: alternate })
    }
    return arr
  }

  transformConditionExpressionNode(node) {
    if (this.isConditionalExpressionNode(node)) {
      const arr = this.conditionalExpressionToArr(node)
      return arr.map((item, index) => {
        const { test } = item
        const testName = test ? index === 0 ? 'v-if' : 'v-else-if' : 'v-else'
        const testValue = test ? this.generatorCode(test) : ''
        const { node } = item
        const ctx = this.transformConditionExpressionNodeChild(node)
        ctx.props.push({ name: testName, value: testValue })
        return ctx
      })
    }
  }

  transformConditionExpressionNodeChild(node) {
    if (this.isRenderFunctionNode(node)) {
      return this.transformRenderFunctionNode(node)
    } else if (node.type === "ArrayExpression") {
      const myCtx = {
        tag: 'template',
        props: [],
        children: []
      }
      this.transform(node, myCtx)
      return myCtx
    } else if (node.type === 'CallExpression' && this.hasRenderHelper(node.callee, '_e')) {
      return {
        tag: '$empty',
        props: [],
        children: []
      }
    }
  }

  transform(node, ctx) {
    if (this.isRenderFunctionNode(node)) {
      ctx.children.push(this.transformRenderFunctionNode(node))
    }
    else if (this.isConditionalExpressionNode(node)) {
      Array.prototype.push.apply(ctx.children, this.transformConditionExpressionNode(node))
    }
    else if (node.type === "CallExpression" && this.isThisIdentificationNode(node.callee)) {
      const { property } = node.callee
      const propertyCode = genCode(property)
      switch (propertyCode) {
        case '_v':
          this.transformChildWithText(node, ctx)
          break
        case '_m':
          this.transformChildWithStatic(node, ctx)
          break
        case '_l':
          this.transformChildWithVFor(node, ctx)
          break
      }
    }
    else if (node.type === "ArrayExpression") {
      node.elements.forEach(child => {
        this.transform(child, ctx)
      })
    }
    else {
      throw new Error('无法转换的节点')
    }

  }

  transformProps(node, ctx) {
    const { type } = node
    if (type === "ObjectExpression") {
      const { properties } = node
      properties.forEach(property => {
        const { key } = property
        const keyName = genCode(key)
        const propsItem = this.transformProp(property)
        if (keyName !== 'scopedSlots') {
          if (keyName === 'tag') {
            ctx.tag = propsItem[0].value
          }
          Array.prototype.push.apply(ctx.props, propsItem)
        }
        else {
          Array.prototype.push.apply(ctx.children, propsItem)
        }
      })
    }
    else if (type === 'CallExpression' && node.callee.type === "MemberExpression") {
      const { object, property } = node.callee
      const objectCode = genCode(object)
      const propertyCode = genCode(property)
      if (objectCode === this.thisIdentification) {
        switch (propertyCode) {
          case '_b':
            this.transformPropsWithVBind(node, ctx)
            break
          case '_g':
            this.transformPropsWithListeners(node, ctx)
            break
        }
      }
      else {
        throw new Error('未知的prop类型')
      }
    }
    else {
      throw new Error('未知的prop类型')
    }
  }

  transformPropsWithVBind(node, ctx) {
    const { arguments: args } = node
    this.transformProps(args[0], ctx)
    ctx.props.push({ name: 'v-bind', value: this.generatorCode(args[2]) })
  }

  transformPropsWithListeners(node, ctx) {
    const { arguments: args } = node
    this.transformProps(args[0], ctx)
    ctx.props.push({ name: 'v-on', value: this.generatorCode(args[1]) })
  }

  transformProp(node) {
    const { key, value } = node
    const keyName = genCode(key)
    if (Transformer.prototype[keyName]) {
      return this[keyName](value)
    }
    else {
      return this.others(value)
    }
  }

  transformChildren(node, ctx) {
    const { type } = node
    if (type === "ArrayExpression") {
      node.elements.forEach(child => {
        this.transformChild(child, ctx)
      })
    }
    else {
      this.transformChild(node)
    }
  }

  transformChild(node, ctx) {
    const { type } = node
    if (this.isRenderFunctionNode(node) || this.isConditionalExpressionNode(node)) {
      this.transform(node, ctx)
    } else if (type === 'CallExpression' && this.isThisIdentificationNode(node.callee)) {
      const { property } = node.callee
      const propertyCode = genCode(property)
      switch (propertyCode) {
        case '_v':
          this.transformChildWithText(node, ctx)
          break
        case '_m':
          this.transformChildWithStatic(node, ctx)
          break
        case '_l':
          this.transformChildWithVFor(node, ctx)
          break
      }
    }
  }

  transformChildWithText(node, ctx) {
    const textCtx = {
      tag: '$text',
      props: [],
      text: '',
      isMustache: false
    }
    const argNode = node.arguments[0]
    textCtx.text = this.transformChildWithTextNode(argNode)
    // if (this.hasRenderHelper(node, '_s')) {
    //   textCtx.isMustache = true
    //   const self = this
    //   traverse.default(node, {
    //     MemberExpression(path) {
    //       const { node: pathNode, parentPath } = path
    //       if (self.isThisIdentificationNode(pathNode)) {
    //         const propertyName = genCode(pathNode.property)
    //         if ('_s' === propertyName) {
    //           textCtx.isMustache = true
    //           const text = self.handlePropWithFilter(parentPath.node.arguments[0])
    //           parentPath.replaceWith(types.identifier(text))
    //           parentPath.skip()
    //         }
    //       }
    //     }
    //   }, {}, node.path)
    //   textCtx.text =  self.generatorCode(node.arguments[0])
    // }
    // else {
    //   textCtx.text = this.generatorCode(node.arguments[0])
    // }
    ctx.children.push(textCtx)
  }

  transformChildWithTextNode(node) {
    let str = ''
    if (types.isBinaryExpression(node)) {
      str = str + this.transformChildWithTextBinaryExpression(node)
    }
    else if (types.isCallExpression(node) && this.isThisIdentificationNode(node.callee) && node.callee.property.name === '_s') {
      str = str + '{{ ' + this.handlePropWithFilter(node.arguments[0]) + ' }}'
    } else {
      str = str + this.generatorCode(node)
    }
    return str
  }

  transformChildWithTextBinaryExpression(node) {
    let str = ''
    const { left, right } = node
    str = str + this.transformChildWithTextNode(left) + this.transformChildWithTextNode(right)
    return str
  }


  transformChildWithStatic(node, ctx) {
    const { arguments: args } = node
    const index = this.generatorCode(args[0])
    const { staticFns } = this
    if (index < staticFns.length) {
      ctx.children.push(staticFns[index])
    }
  }

  transformChildWithVFor(node, ctx) {
    const { arguments: args } = node
    const id = this.generatorCode(args[0])
    const params = args[1].params.map(param => this.generatorCode(param))
    const returnNode = args[1].body.body[0].argument
    const { type } = returnNode
    if (this.isRenderFunctionNode(returnNode)) {
      const children = this.transformRenderFunctionNode(returnNode)
      children.props.push({ name: 'v-for', value: `${params.length > 1 ? `(${params.join(',')})` : params[0]} in ${id}` })
      ctx.children.push(children)
    }
    else if (type === 'ArrayExpression') {
      const myCtx = {
        tag: 'template',
        props: [{ name: 'v-for', value: `${params.length > 1 ? `(${params.join(',')})` : params[0]} in ${id}` }],
        children: []
      }
      this.transform(returnNode, myCtx)
      ctx.children.push(myCtx)
    }
  }

  generatorCode(node) {
    if (types.isMemberExpression(node) && this.isThisIdentificationNode(node)) {
      return genCode(node.property)
    }
    else {
      const self = this
      traverse.default(node, {
        MemberExpression(path) {
          const { node: pathNode } = path
          const { property } = pathNode
          if (self.isThisIdentificationNode(pathNode)) {
            path.replaceWith(property)
            path.skip()
          }
        }
      }, {}, node.path)
      return genCode(node)
    }
  }

  hasRenderHelper(node, helperName) {
    let flag = false
    if (types.isMemberExpression(node) && this.isThisIdentificationNode(node)) {
      const { property } = node
      if (genCode(property) === helperName) {
        flag = true
      }
    }
    else {
      const self = this
      traverse.default(node, {
        MemberExpression(path) {
          const { node } = path
          const { property } = node
          const propertyName = genCode(property)
          if (self.isThisIdentificationNode(node) && helperName === propertyName) {
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
    const { type } = node
    if (type === "StringLiteral") {
      return [{ name: 'is', value: this.generatorCode(node) }]
    }
    else {
      return [{ name: ':is', value: this.generatorCode(node) }]
    }
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

  class(node) {
    return [{ name: ':class', value: this.generatorCode(node) }]
  }

  staticStyle(node) {
    const { type } = node
    if (type === "ObjectExpression") {
      const { properties } = node
      const value = properties.map(property => {
        const { key, value } = property
        return `${this.generatorCode(key)}: ${this.generatorCode(value)}`
      }).join(';')
      return [{ name: 'style', value }]
    }
    return []

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
        else if (value.type === "FunctionExpression") {
          return { name: `:${keyName}`, value: this.functionExpressionToArrowFunction(value) }
        }
        else {
          return { name: `:${keyName}`, value: this.handlePropWithFilter(value) }
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
        else if (value.type === "FunctionExpression") {
          return { name: `:${keyName}`, value: this.functionExpressionToArrowFunction(value) }
        }
        else {
          return { name: `:${keyName}`, value: this.handlePropWithFilter(value) }
        }
      })
    }
    else {
      return []
    }
  }

  handlePropWithFilter(node) {
    const { type, callee } = node
    if (type === "CallExpression" && callee.type === "CallExpression" && this.hasRenderHelper(callee.callee, '_f')) {
      const reg = /_f\(([^\(\)]+?)\)\(([^\(\)]+?)\)/
      let str = this.generatorCode(node);
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
      const rnArr = []
      properties.forEach(property => {
        const arrItem = this.handleEventProperty(property)
        if (Array.isArray(arrItem)) {
          Array.prototype.push.apply(rnArr, arrItem)
        }
        else {
          rnArr.push(arrItem)
        }
      })
      return rnArr
    }
    else {
      return []
    }
  }

  handleEventProperty(node, isNative = false) {
    const { key, value } = node
    const { type } = value
    if (isNative) {
      if (types.isArrayExpression(value)) {
        return value.elements.map(valueNode => this.handleEventPropertyHasModifier(key, valueNode, isNative))
      }
      else {
        return this.handleEventPropertyHasModifier(key, value, isNative)
      }

    }
    else if (type === "FunctionExpression") {
      const { params, body: { body } } = value
      const hasKeyModifier = /^[\&\~\!]/.test(genCode(key))
      const hasIfStatement = body.some(item => item.type === "IfStatement")
      const hasReturnStatement = body.some(item => item.type === "ReturnStatement")
      if (params.length === 1 && genCode(params[0]) === '$event' && (hasKeyModifier || (hasIfStatement && hasReturnStatement))) {
        if (types.isArrayExpression(value)) {
          return value.elements.map(valueNode => this.handleEventPropertyHasModifier(key, valueNode, isNative))
        }
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
    let value = this.functionExpressionToArrowFunction(valueNode)
    return {
      name: `@${name}`,
      value
    }
  }

  functionExpressionToArrowFunction(node) {
    if (node.type === "FunctionExpression") {
      const { body, params } = node
      const paramsStr = params.map(param => this.generatorCode(param)).join(', ')
      let bodyStr
      if (body.body.length === 1) {
        const codeNode = body.body[0]
        if (types.isReturnStatement(codeNode)) {
          bodyStr = this.generatorCode(codeNode.argument)
        }
        else {
          bodyStr = this.generatorCode(codeNode).replace(/\;$/, '')
        }
      }
      else {
        bodyStr = this.generatorCode(body)
      }
      return `(${paramsStr}) => ${bodyStr}`
    }
    else {
      return this.generatorCode(node)
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
    let hasReturnStatement = false
    let modifierCodeNum = 0
    body.forEach(item => {
      const { type } = item
      //if (type === "IfStatement") {
        const itemCode = genCode(item)
        for (let i = 0, len = modifierCodeKeyArr.length; i < len; i++) {
          const modifierCodeKeyItem = modifierCodeKeyArr[i]
          const modifierCodeStr = modifierCode[modifierCodeKeyItem]
          if (itemCode.includes(modifierCodeStr)) {
            modifierCodeNum = modifierCodeNum + 1
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
      //}
      if (type === "ReturnStatement") {
        hasReturnStatement = true
        const { argument } = item
        if (argument.type === "CallExpression" && argument.callee.type === "FunctionExpression") {
          const { callee } = argument
          functionStr = this.generatorCode(callee)
        }
        else {
          functionStr = this.generatorCode(argument)
        }
      }
    })
    if (!hasReturnStatement && modifierCodeNum !== body.length) {
      modifierArr = []
      functionStr = this.generatorCode(valueNode.body).trim().replace(/^\{|\}$/g, '')
    } 
    
    return [modifierArr, functionStr]
  }

  nativeOn(node) {
    const { type } = node
    if (type === "ObjectExpression") {
      const { properties } = node
      const rnArr = []
      properties.forEach(property => {
        const arrItem = this.handleEventProperty(property, true)
        if (Array.isArray(arrItem)) {
          Array.prototype.push.apply(rnArr, arrItem)
        }
        else {
          rnArr.push(arrItem)
        }
      })
      return rnArr
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
        return genCode(key) === propertyKey
      })
      if (item) {
        return item
      }
    }
  }

  getObjectPropertyValueByKey(node, propertyKey) {
    const item = this.getObjectPropertyByKey(node, propertyKey)
    if (item) {
      return this.generatorCode(item.value)
    }
  }

  directives(node) {
    const { type } = node
    if (type === "ArrayExpression") {
      const { elements } = node
      return elements.map(element => {
        const name = this.getObjectPropertyValueByKey(element, 'rawName')
        const value = this.getObjectPropertyValueByKey(element, 'value')
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

  scopedSlots(node) {
    const { type, callee } = node
    if (type === "CallExpression" && this.isThisIdentificationNode(callee) && genCode(callee.property) === '_u') {
      const { arguments: args } = node
      const scopedSlots = args[0]
      if (scopedSlots.type === "ArrayExpression") {
        return scopedSlots.elements.map(scopedSlot => {
          return this.handleScopedSlot(scopedSlot)
        })
      }
    }
    return []
  }

  handleScopedSlot(node) {
    const { type } = node
    if (type === "ObjectExpression") {
      const key = this.getObjectPropertyByKey(node, 'key')
      const slotName = types.isStringLiteral(key.value) ? 'slot' : ':slot'
      const slotValue = this.generatorCode(key.value)
      const fn = this.getObjectPropertyByKey(node, 'fn')
      const { params } = fn.value
      const { body } = fn.value.body
      let slotScopeName = params[0].name
      const variableDeclarators = []
      let returnStatement
      body.forEach(item => {
        if (types.isVariableDeclaration(item)) {
          variableDeclarators.push(item)
        }
        if (types.isReturnStatement(item)) {
          returnStatement = item
        }
      })
      const slotScopeNameArr = this.getVariableByCondition(variableDeclarators, function (node) {
        const { init } = node
        return types.isMemberExpression(init) && init.object.name === slotScopeName
      })
      if (slotScopeNameArr.length) {
        slotScopeName = `{ ${slotScopeNameArr.map(item => item.id).join(', ')} }`
      }
      const { argument } = returnStatement
      if (this.isRenderFunctionNode(argument)) {
        const ctx = this.transformRenderFunctionNode(argument)
        Array.prototype.push.apply(ctx.props, [
          { name: `${slotName}`, value: `${slotValue}` },
          { name: 'slot-scope', value: `${slotScopeName}` }
        ])
        return ctx
      }
      else if (types.isArrayExpression(argument)) {
        const myCtx = {
          tag: 'template',
          props: [
            { name: `${slotName}`, value: `${slotValue}` },
            { name: 'slot-scope', value: `${slotScopeName}` }
          ],
          children: []
        }
        this.transform(argument, myCtx)
        return myCtx
      }
    }
    return {
      tag: '$empty',
      props: [],
      children: []
    }
  }

  getVariableByCondition(variableDeclarators, conditionCb) {
    const arr = []
    variableDeclarators.forEach(variableDeclarator => {
      variableDeclarator.declarations.forEach(declaration => {
        if (conditionCb(declaration)) {
          arr.push({
            id: genCode(declaration.id),
            init: genCode(declaration.init)
          })
        }
      })
    })
    return arr
  }


  model(node) {
    const { type } = node
    if (type === "ObjectExpression") {
      const value = this.getObjectPropertyValueByKey(node, 'value')
      const callback = this.getObjectPropertyByKey(node, 'callback')
      const callbackStr = callback ? genCode(callback.value) : ''
      const trimReg = new RegExp("\\(typeof[\\s]*[\\S]+[\\s]*===[\\s]*'string'[\\s]*\\?[\\s]*[\\S]+.trim\\(\\)[\\s]*:[\\s]*[\\S]+\\)")
      const hasTrim = trimReg.test(callbackStr)
      const { thisIdentification } = this
      const numberReg = new RegExp(`${thisIdentification}._n\\([\\s\\S]+\\)`)
      const hasNumber = numberReg.test(callbackStr)
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

module.exports = Transformer