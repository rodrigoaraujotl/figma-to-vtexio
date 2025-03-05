class VTEXBlockMapper {
  constructor() {
    this.blockTypes = {
      // Layout blocks
      FRAME: {
        default: 'flex-layout.row',
        variants: {
          horizontal: 'flex-layout.row',
          vertical: 'flex-layout.col'
        }
      },
      // Content blocks
      TEXT: {
        default: 'rich-text',
        variants: {
          heading: 'rich-text',
          paragraph: 'rich-text'
        }
      },
      IMAGE: {
        default: 'image',
        variants: {
          banner: 'list-context.image-list',
          logo: 'logo'
        }
      },
      // Store blocks
      PRODUCT: {
        default: 'product-summary',
        variants: {
          shelf: 'list-context.product-list',
          highlights: 'list-context.product-list'
        }
      },
      // Navigation blocks
      MENU: {
        default: 'menu',
        variants: {
          drawer: 'drawer',
          megamenu: 'mega-menu'
        }
      },
      // Search blocks
      SEARCH: {
        default: 'search-bar',
        variants: {
          full: 'search-result-layout'
        }
      },
      // Slider blocks
      SLIDER: {
        default: 'slider-layout',
        variants: {
          banner: 'slider-layout',
          product: 'slider-layout'
        }
      }
    }
  }

  getBlockType(node) {
    const nodeName = node.name.toLowerCase()
    const nodeType = node.type

    // Check for specific naming patterns
    if (nodeName.includes('slider') || nodeName.includes('carousel') || nodeName.includes('banner-principal')) {
      return 'slider-layout'
    }
    if (nodeName.includes('banner') && !nodeName.includes('slider') && !nodeName.includes('carousel')) {
      return 'list-context.image-list'
    }
    if (nodeName.includes('shelf') || nodeName.includes('products')) {
      return 'list-context.product-list'
    }
    if (nodeName.includes('menu')) {
      return 'menu'
    }
    if (nodeName.includes('search')) {
      return 'search-bar'
    }

    // Default mappings based on Figma node type
    const blockConfig = this.blockTypes[nodeType]
    if (!blockConfig) {
      return 'flex-layout.row' // Default fallback
    }

    // Check for layout direction
    if (nodeType === 'FRAME') {
      return node.layoutMode === 'VERTICAL' 
        ? 'flex-layout.col' 
        : 'flex-layout.row'
    }

    return blockConfig.default
  }

  getBlockProps(node) {
    const props = {}
    const nodeName = node.name.toLowerCase()

    // Extract block class from name
    if (node.name.includes('--')) {
      props.blockClass = node.name.split('--')[1]
    }

    // Layout properties
    if (node.layoutMode) {
      props.orientation = node.layoutMode.toLowerCase()
      if (node.primaryAxisAlignItems) {
        props.justifyContent = this.mapAxisAlignment(node.primaryAxisAlignItems)
      }
      if (node.counterAxisAlignItems) {
        props.alignItems = this.mapAxisAlignment(node.counterAxisAlignItems)
      }
    }

    // Specific block properties
    const blockType = this.getBlockType(node)
    
    switch (blockType) {
      case 'rich-text':
        if (node.characters) {
          props.text = node.characters
        }
        break
      case 'image':
        if (node.fills && node.fills[0]?.type === 'IMAGE') {
          props.src = node.fills[0].imageHash
        }
        break
      case 'list-context.product-list':
        props.orderBy = 'OrderByTopSaleDESC'
        props.collection = node.name.split('collection-')[1] || ''
        break
      case 'slider-layout':
        // Configurações padrão para slider-layout
        props.autoplay = true
        props.infinite = true
        props.showNavigationArrows = 'desktopOnly'
        props.showPaginationDots = 'always'
        
        // Configurar número de itens por página com base no tamanho do container
        props.itemsPerPage = {
          desktop: 1,
          tablet: 1,
          phone: 1
        }
        
        // Configurações específicas baseadas no nome
        if (nodeName.includes('product')) {
          props.itemsPerPage.desktop = 4
          props.itemsPerPage.tablet = 2
          props.itemsPerPage.phone = 1
        }
        break
    }

    return Object.keys(props).length > 0 ? props : undefined
  }

  mapAxisAlignment(alignment) {
    const alignmentMap = {
      MIN: 'flex-start',
      CENTER: 'center',
      MAX: 'flex-end',
      SPACE_BETWEEN: 'space-between'
    }
    return alignmentMap[alignment] || 'flex-start'
  }
}

module.exports = { VTEXBlockMapper }