
class AstTransform {
  constructor(thisIdentification, renderIdentification) {
    this.thisIdentification = thisIdentification
    this.renderIdentification = renderIdentification
  }

  transform(node) {
    const { type } = node
    if (AstTransform.prototype[type]) {
      return this[type](node)
    }
    else {
      throw new Error(`${type}: 未定义的节点类型`)
    }
  }

  ArrayExpression(node) {
    const { elements } = node
    // const elementsStr = this.transform(elements)
  }

  AssignmentExpression(node) {
    const { left, right, operator } = node
    const leftStr = this.transform(left)
    const rightStr = this.transform(right)
    return `${leftStr} ${operator} ${rightStr}`
  }

  BinaryExpression(node) {
    const { left, operator, right } = node
    const leftStr = this.transform(left)
    const rightStr = this.transform(right)
    return `${leftStr} ${operator} ${rightStr}`
  }

  InterpreterDirective(node) {
    const { value } = node
    return value
  }

  Directive(node) {
    const { value } = node
    const valueStr = this.transform(value)
    
  }

  DirectiveLiteral(node) {
    const { value } = node
    return value
  }

  BlockStatement(node) {
    const { body, directives } = node
    const bodyStr = body.map(item => this.transform(item)).join('\n')
    return `{ ${bodyStr} }`
  }

  BreakStatement(node) {
    const { label } = node
    if (!label) {

    }
  }

  CallExpression(node) {
    const { callee, arguments: args,  } = node
  }

  CatchClause(node) {
    const { param, body } = node
    
  }

  ConditionalExpression(node) {
    const { test, consequent, alternate } = node
  }

  ContinueStatement(node) {
    const { label } = node
    if (label) {

    }
  }

  DebuggerStatement(node) {

  }

  DoWhileStatement(node) {
    const { test, body } = node
  } 

  EmptyStatement(node) {

  }

  
  ExpressionStatement(node) {
    const { expression } = node
    const expressionStr = this.transform(expression)

  }

  File(node) {
    
  }

  ForInStatement(node) {
    const { left, right, body } = node
  }

  ForStatement(node) {

  }

  FunctionDeclaration(node) {
    
  }

  ObjectExpression(node) {
    const { properties } = node
    const propertieStr = properties.map(property => this.transform(property)).join(', ')
    return `{ ${propertieStr} }`
  }

  ObjectProperty(node) {
    const { key, value } = node
    const keyStr = this.transform(key)
    const valueStr = this.transform(value)
    return `${keyStr}: ${valueStr}`
  }

  ObjectMethod(node) {
    const { kind, key, body, params } = node
    const keyStr = this.transform(key)
    const bodyStr = this.transform(body)
    const paramsStr = params.map(param => this.transform(param)).join(', ')
    return `${kind} ${keyStr}: function( ${paramsStr} ) ${bodyStr}`
  }



  VariableDeclaration(node) {
    const { kind, declarations } = node
    const declarationsStr = declarations.map(declaration => this.transform(declaration)).join(',')
    return `${kind} ${declarationsStr};`
  }

  VariableDeclarator(node) {
    const { id, init } = node
    const idStr = this.transform(id)
    const initStr = this.transform(init)
    return `${idStr} = ${initStr}`
  }

  NumericLiteral(node) {
    const { value } = node
    return value
  }

  Identifier(node) {
    const { name } = node
    return name
  }

  IfStatement(node) {
    const { consequent, test, alternate } = node
    const consequentStr = this.transform(consequent)
    const testStr = this.transform(test)
    if (!alternate) {
      return `if( ${testStr} ) ${consequentStr}`
    }
    else {
      const alternateStr = this.transform(alternate)
      return `if( ${testStr} ) ${consequentStr} else ${alternateStr}`
    }
  }







  
}

module.exports =  AstTransform