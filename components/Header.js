class HeaderConverter {
  convert(node) {
    return {
      type: 'header-row',
      props: {
        blockClass: 'main-header',
        ...this.extractStyles(node)
      },
      children: [
        {
          type: 'logo',
          props: {
            url: node.logo?.imageUrl || '',
            width: node.logo?.width || 100
          }
        },
        {
          type: 'menu',
          props: {
            blockClass: 'main-menu'
          }
        },
        {
          type: 'minicart',
          props: {
            blockClass: 'cart-icon'
          }
        }
      ]
    }
  }

  extractStyles(node) {
    return {
      backgroundColor: node.backgroundColor || '#ffffff',
      height: node.height || '80px',
      padding: node.padding || '0 20px'
    }
  }
}

module.exports = { HeaderConverter }