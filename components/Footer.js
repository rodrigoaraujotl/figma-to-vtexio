class FooterConverter {
  convert(node) {
    return {
      type: 'footer',
      props: {
        blockClass: 'main-footer',
        ...this.extractStyles(node)
      },
      children: [
        {
          type: 'flex-layout.row',
          props: {
            blockClass: 'footer-content'
          },
          children: this.convertFooterSections(node.children || [])
        }
      ]
    }
  }

  convertFooterSections(sections) {
    return sections.map(section => ({
      type: 'flex-layout.col',
      props: {
        blockClass: `footer-section-${section.name.toLowerCase()}`
      },
      children: this.convertFooterItems(section.children || [])
    }))
  }

  convertFooterItems(items) {
    return items.map(item => ({
      type: 'rich-text',
      props: {
        text: item.characters || '',
        blockClass: 'footer-text'
      }
    }))
  }

  extractStyles(node) {
    return {
      backgroundColor: node.backgroundColor || '#f8f8f8',
      padding: node.padding || '40px 0'
    }
  }
}

module.exports = { FooterConverter }