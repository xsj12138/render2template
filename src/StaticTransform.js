const Transformer = require("./Transformer")
class StaticTransform {
  constructor(staticRenderFn) {
    const { type  } = staticRenderFn
    if (type === "FunctionExpression") {
      this.ast = staticRenderFn
       this.transform()
    }
  }

  transform() {
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
    this.transform = new Transformer(this.ast, this.thisIdentification,  this.renderIdentification)
    const root = this.transform.transform(this.returnStatement[0].argument)
    console.log(root)
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

  }

}

module.exports = StaticTransform