const Transformer = require('./Transformer')
var vueBeautify = require('vue-beautify');
const selfClose = ['br', 'hr', 'area', 'base', 'img', 'input', 'link', 'meta', 'basefont', 'param', 'col', 'frame', 'embed', 'keygen', 'source']
class Parser {
  constructor(renderAst, staticAst) {
    if (renderAst?.id?.name === "render" && renderAst?.init?.type === "FunctionExpression" && staticAst?.id?.name === "staticRenderFns" && staticAst?.init?.type === "ArrayExpression") {
      this.renderAst = renderAst.init
      this.staticAst = staticAst.init
      this.init()
    }
  }

  init() {
    this.transformStatic()
    this.transformRender()
    var result = vueBeautify(this.parser(), {
      "indent_size": "2",
      "indent_char": " ",
      "max_preserve_newlines": "-1",
      "preserve_newlines": false,
      "keep_array_indentation": false,
      "break_chained_methods": false,
      "indent_scripts": "keep",
      "brace_style": "collapse",
      "space_before_conditional": false,
      "unescape_strings": false,
      "jslint_happy": false,
      "end_with_newline": false,
      "indent_inner_html": false,
      "comma_first": false,
      "e4x": true,
      "indent_empty_lines": false,
      "wrap_line_length": "160",
    });
    console.log('====================================');
    console.log(result);
    console.log('====================================');
    this.code = result
  }

  transformStatic() {
    const { staticAst } = this
    const { elements } = staticAst
    if (elements.length) {
      this.staticRoot = elements.map(item => {
        return new Transformer(item).root[0].children[0]
      })
    }
  }

  transformRender() {
    this.renderRoot = new Transformer(this.renderAst, this.staticRoot).root
  }

  parser() {
    const { renderRoot } = this
    return renderRoot.map((item) => this.parserItem(item)).join('\n')
  }

  parserItem(tagItem) {
    const { tag } = tagItem
    switch (tag) {
      case '$text':
        const { text, isMustache } = tagItem
        if (isMustache) {
          return `{{ ${text} }}`
        }
        else {
          return `${text}`
        }
      case '$empty':
        break
      default:
        const { props, children } = tagItem
        if ((!children || !children.length) && selfClose.includes(tag)) {
          return `<${tag} ${this.parserProps(props)} />`
        }
        return `<${tag} ${this.parserProps(props)}>
          ${this.parserChildren(children)}
        </${tag}>`
    }

  }

  parserProps(props) {
    const updateEventReg = /@update\:([\S]+)/
    props.forEach(item => {
      const { name } = item
      if (updateEventReg.test(name)) {
        const eventName = updateEventReg.exec(name)[1]
        const eventNameHump = eventName.replace(/\-(\w)/g, (str, $1) => $1.toUpperCase())
        const eventNameLine = eventName.replace(/([A-Z])/g, (str, $1) => `-${$1}`).toLowerCase()
        const eventNameReg = new RegExp(`:(${eventNameHump}|${eventNameLine})($|.sync$)`)
        const propItem = props.find(item => eventNameReg.test(item.name))
        if (propItem) {
          item.remove = true
          if (!/\.sync$/.test(propItem.name)) {
            propItem.name =  propItem.name + '.sync'
          }
        }
      }
    })

    const arr = props.reduce((prev, cur) => {
      if (!cur.remove && !prev.some(item => item.name === cur.name)) {
        prev.push(cur);
      }
      return prev;
    }, []);
    

    return arr.map(item => {
      const { name, value } = item
      //const updateEventReg = /@update\:([\S]+)/
      // if (updateEventReg.test(name)) {
      //   const eventName = updateEventReg.exec(name)[1]
      //   const eventNameHump = eventName.replace(/\-(\w)/g, (str, $1) => $1.toUpperCase())
      //   const eventNameLine = eventName.replace(/([A-Z])/g, (str, $1) => `-${$1}`).toLowerCase()
      //   if (props.findIndex(prop => prop.name === `@${eventNameHump}` || prop.name === `@${eventNameLine}`) > -1) {
      //     return ''
      //   }
      //   return ''
      // }
      if (name === 'tag') {
        return ''
      }
      if (value) {
        return `${name}="${value}"`
      }
      else {
        return `${name}`
      }
    }).join(' ')
  }

  parserChildren(children) {
    return children.map(child => {
      return this.parserItem(child)
    }).join('\n')
  }

}

module.exports = Parser