
const PropTransform = require('./propTransform')
const generator = require('@babel/generator')
const types = require('@babel/types')
const Transformer = require('./Transformer')
const genCode = (node) => {
  return generator.default(node).code.replace(/"/g, "'").replace(/(^\')|(\'$)|[\n]/g, '')
}
class RenderTransform {
  constructor(renderAst, staticRenderFns) {
    const { id, init } = renderAst
    if (init?.type === 'FunctionExpression') {
      //id?.name === 'render' && 
      this.ast = renderAst
      this.staticRenderFns = staticRenderFns
      this.transform()
    }
    else {
      throw Error('无法识别的AST')
    }
  }

  transform() {
    const { body } = this.ast.init.body;
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
    this.propTransform = new PropTransform(this.thisIdentification, this.ast)
    this.transformStaticRenderFns()
    this.transformReturnStatement()
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

  transformStaticRenderFns() {
    const { staticRenderFns } = this
    const { type, elements } = staticRenderFns.init
    if (type === "ArrayExpression") {
      elements.map(item => {
        const thisRenderTransform = new Transformer(item)
      })
    }
  }

  transformReturnStatement() {
    const { argument } = this.returnStatement[0]
    const root = {
      tag: undefined,
      props: [],
      children: [],

    }
    if (argument.type === "CallExpression" && argument.callee.name === this.renderIdentification) {
      const a = this.transformRenderFuntion(argument)
      console.log(a)
    }
  }

  transformRenderFuntion(node) {
    const { arguments: args } = node
    const len = args[args.length - 1].type === "NumericLiteral" ? args.length - 1 : args.length
    const ctxObj = {
      tag: undefined,
      props: [],
      children: []
    }
    if (len >= 3) {
      const [tag, props, children] = args
      if (tag.type === "StringLiteral" && tag.value) {
        ctxObj.tag = tag.value
      }
      if (ctxObj.tag === "el-form-item") {
        console.log('====================================');
        console.log(ctxObj);
        console.log('====================================');
      }
      this.transformRenderFuntionProps(props, ctxObj)
      this.transformRenderFuntionChildren(children, ctxObj)
    }
    else if (len === 2) {
      const [tag, arg1] = args
      if (tag.type === "StringLiteral" && tag.value) {
        ctxObj.tag = tag.value
      }
      const { type } = arg1
      if (ctxObj.tag === "el-form-item") {
        console.log('====================================');
        console.log(ctxObj);
        console.log('====================================');
      }
      if (type === "ObjectExpression") {
        this.transformRenderFuntionProps(arg1, ctxObj)
      }
      else if (type === "CallExpression" && arg1.callee.type === "MemberExpression") {
        const { object, property } = arg1.callee
        const objectCode = genCode(object)
        const propertyCode = genCode(property)
        if (objectCode === this.thisIdentification) {
          switch (propertyCode) {
            case '_b':
              this.transformRenderFuntionProps(arg1, ctxObj)
              break
            case '_g':
              this.transformRenderFuntionProps(arg1, ctxObj)
              break
            case '_v':
              this.transformRenderFuntionChildren(arg1, ctxObj)
              break
            case '_m':
              this.transformRenderFuntionChildren(arg1, ctxObj)
              break
            case '_l':
              this.transformRenderFuntionChildren(arg1, ctxObj)
              break
          }
        }
      }
      else {
        this.transformRenderFuntionChildren(arg1, ctxObj)
      }
    }
    else {
      const [tag] = args
      if (tag.type === "StringLiteral" && tag.value) {
        ctxObj.tag = tag.value
      }
      if (ctxObj.tag === "el-form-item") {
        console.log('====================================');
        console.log(ctxObj);
        console.log('====================================');
      }
    }
    return ctxObj
  }

  transformRenderFuntionProps(props, ctxObj) {
    const { type } = props
    if (type === "ObjectExpression") {
      const { properties } = props
      properties.forEach(prop => {
        const { key } = prop
        const keyName = genCode(key)
        if (keyName !== 'scopedSlots') {
          const propsItem = this.propTransform.transform(prop)
          Array.prototype.push.apply(ctxObj.props, propsItem)
        }
        //Array.prototype.push.apply(ctxObj.props, this.propTransform.transform(prop))
      })
    }
    else if (type === "CallExpression" && props.callee.type === "MemberExpression") {
      const { object, property } = props.callee
      const objectCode = genCode(object)
      const propertyCode = genCode(property)
      if (objectCode === this.thisIdentification) {
        switch (propertyCode) {
          case '_b':
            this.transformRenderFuntionPropsWithVBind(props, ctxObj)
            break
          case '_g':
            this.transformRenderFuntionPropsWithListeners(props, ctxObj)
            break
        }
      }
    }
  }
  transformRenderFuntionPropsWithVBind(props, ctxObj) {
    const { arguments: args } = props
    this.transformRenderFuntionProps(args[0], ctxObj)
    ctxObj.props.push({ name: 'v-bind', value: this.propTransform.generatorCode(args[2]) })
  }

  transformRenderFuntionPropsWithListeners(props, ctxObj) {
    const { arguments: args } = props
    this.transformRenderFuntionProps(args[0], ctxObj)
    ctxObj.props.push({ name: 'v-on', value: this.propTransform.generatorCode(args[1]) })
  }


  transformRenderFuntionChildren(children, ctxObj) {
    const { type } = children
    if (type === "ArrayExpression") {
      children.elements.map(child => {
        this.transformRenderFuntionChild(child, ctxObj)
      })
    }
    else {
      this.transformRenderFuntionChild(children, ctxObj)
    }
  }

  transformRenderFuntionChild(child, ctxObj) {
    const { type, callee } = child
    if (type === "CallExpression" && callee.name === this.renderIdentification) {
      ctxObj.children.push(this.transformRenderFuntion(child))
    } else if (type === 'CallExpression' && callee.type === "MemberExpression") {
      const { object, property } = callee
      const objectCode = genCode(object)
      const propertyCode = genCode(property)
      if (objectCode === this.thisIdentification) {
        switch (propertyCode) {
          case '_v':
            this.transformRenderFuntionChildWithText(child, ctxObj)
            break
          case '_m':
            this.transformRenderFuntionChildWithStatic(child, ctxObj)
            break
          case '_l':
            this.transformRenderFuntionChildWithVFor(child, ctxObj)
            break
        }
      }
    }
  }

  transformRenderFuntionChildWithText(child, ctxObj) {
    const textCtx = {
      tag: '$text',
      props: [],
      text: '',
      isMustache: false
    }
    const self = this
    const { thisIdentification, ast } = this
    // let text = this.propTransform.handlePropFilter(this.propTransform.generatorCode(child.arguments[0]))
    if (this.propTransform.hasRenderHelper(child, '_s')) {
      this.propTransform.traverse.default(child, {
        MemberExpression(path) {
          const { node, scope, parentPath } = path
          const { object, property } = node
          const objectName = genCode(object)
          const propertyName = genCode(property)
          const hasThisIdentificationScope = scope.getBinding(thisIdentification)
          const isThis = hasThisIdentificationScope && types.isNodesEquivalent(hasThisIdentificationScope.scope.block, ast.init)
          if (objectName === thisIdentification && '_s' === propertyName && isThis) {
            textCtx.isMustache = true
            textCtx.text = self.propTransform.handlePropFilter(parentPath.node.arguments[0])
          }
        }
      }, {}, child.path
      )
    }
    else {
      textCtx.text = this.propTransform.generatorCode(child.arguments[0])
    }
    ctxObj.children.push(textCtx)
  }

  transformRenderFuntionChildWithStatic(child, ctxObj) {

  }

  transformRenderFuntionChildWithVFor(child, ctxObj) {
    const { arguments: args } = child
    const id = this.propTransform.generatorCode(args[0])
    const params = args[1].params.map(param => this.propTransform.generatorCode(param))
    const returnNode = args[1].body.body[0].argument
    const { type } = returnNode
    if (type === "CallExpression" && returnNode.callee.name === this.renderIdentification) {
      const children = this.transformRenderFuntion(returnNode)
      children.props.push({ name: 'v-for', value: `${params.length > 1 ? `(${params.join(',')})` : params[0]} in ${id}` })
      ctxObj.children.push(children)
    }
    else if (type === 'ArrayExpression') {
      const myCtx = {
        tag: 'template',
        props: [{ name: 'v-for', value: `${params.length > 1 ? `(${params.join(',')})` : params[0]} in ${id}` }],
        children: []
      }
      this.transformRenderFuntionChildren(returnNode, myCtx)
      ctxObj.children.push(myCtx)
    }
    //const { child }
  }

}

module.exports = RenderTransform