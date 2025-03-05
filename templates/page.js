class PageTemplate {
  generate(content, pageName = 'landing') {
    const template = {
      [`store.custom#${pageName}`]: {
        blocks: [
          "header-row",
          "flex-layout.row#main-content",
          "footer"
        ]
      },
      "header-row": {
        "children": [
          "logo",
          "search-bar",
          "minicart"
        ],
        "props": {
          "blockClass": "main-header",
          "sticky": true
        }
      },
      "flex-layout.row#main-content": {
        "children": this.processBlocks(content.blocks),
        "props": {
          "blockClass": "main-content",
          "fullWidth": true
        }
      },
      "footer": {
        "blocks": ["footer-layout"],
        "props": {
          "blockClass": "main-footer"
        }
      }
    }

    return {
      blocks: template,
      styles: this.processStyles(content.styles)
    }
  }

  processBlocks(blocks) {
    return blocks.map((block, index) => {
      const blockId = `${block.type}#${block.name || `section-${index}`}`
      
      this[blockId] = {
        props: block.props,
        children: block.children ? this.processBlocks(block.children) : []
      }

      return blockId
    })
  }

  processStyles(styles) {
    return {
      "vtex.store-components": {
        "styles.css": styles.css
      }
    }
  }

  createCustomPage(name, blocks) {
    return this.generate({
      blocks: blocks,
      styles: {
        css: this.generateCustomCSS(blocks)
      }
    }, name)
  }

  generateCustomCSS(blocks) {
    return blocks.reduce((css, block) => {
      if (block.props?.blockClass) {
        css += `.${block.props.blockClass} {\n`
        Object.entries(block.props.styles || {}).forEach(([key, value]) => {
          css += `  ${this.camelToKebab(key)}: ${value};\n`
        })
        css += '}\n'
      }
      return css
    }, '')
  }

  camelToKebab(string) {
    return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
  }
}

module.exports = { PageTemplate }