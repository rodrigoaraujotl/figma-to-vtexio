const { PageTemplate } = require('./page')

class TemplateManager {
  constructor() {
    this.pageTemplate = new PageTemplate()
    this.templates = new Map()
  }

  registerTemplate(name, content) {
    this.templates.set(name, content)
  }

  generateTemplate(name, content) {
    const template = this.templates.get(name) || this.pageTemplate
    return template.generate(content, name)
  }

  createPage(figmaContent) {
    const pageContent = this.processFigmaContent(figmaContent)
    return this.pageTemplate.createCustomPage(
      figmaContent.name.toLowerCase(),
      pageContent
    )
  }

  processFigmaContent(content) {
    return content.children.map(node => ({
      type: this.getBlockType(node),
      name: node.name.toLowerCase().replace(/\s+/g, '-'),
      props: {
        blockClass: node.name.toLowerCase().replace(/\s+/g, '-'),
        styles: this.extractStyles(node)
      },
      children: node.children ? this.processFigmaContent(node) : []
    }))
  }

  getBlockType(node) {
    switch (node.type) {
      case 'FRAME':
        return 'flex-layout.row'
      case 'GROUP':
        return 'flex-layout.col'
      case 'TEXT':
        return 'rich-text'
      case 'RECTANGLE':
        return node.fills?.[0]?.type === 'IMAGE' ? 'image' : 'rich-text'
      default:
        return 'flex-layout.row'
    }
  }

  extractStyles(node) {
    const styles = {}

    if (node.absoluteBoundingBox) {
      styles.width = `${node.absoluteBoundingBox.width}px`
      styles.height = `${node.absoluteBoundingBox.height}px`
    }

    if (node.style) {
      if (node.style.fontSize) styles.fontSize = `${node.style.fontSize}px`
      if (node.style.fontWeight) styles.fontWeight = node.style.fontWeight
      if (node.style.textAlignHorizontal) styles.textAlign = node.style.textAlignHorizontal.toLowerCase()
    }

    return styles
  }
}

module.exports = { TemplateManager }