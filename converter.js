const { HeaderConverter } = require('./components/Header')
const { FooterConverter } = require('./components/Footer')
const { TemplateManager } = require('./templates/templateManager')
const { VTEXComponentMapper } = require('./services/vtexComponentMapper')
const { VTEXBlockMapper } = require('./services/vtexBlockMapper')


class VTEXConverter {
  constructor() {
    // Make sure VTEXBlockMapper is properly imported and initialized
    this.blockMapper = new VTEXBlockMapper();
  }

  async convert(figmaFile, pageName, layerId) {
    // Find the page and selected layer
    const page = figmaFile.document.children.find(p => p.name === pageName)
    if (!page) {
      throw new Error(`Page "${pageName}" not found`)
    }

    // Function to find node by ID
    const findNodeById = (node, id) => {
      if (node.id === id) return node
      if (!node.children) return null
      
      for (const child of node.children) {
        const found = findNodeById(child, id)
        if (found) return found
      }
      
      return null
    }

    const layer = findNodeById(page, layerId)
    if (!layer) {
      throw new Error(`Layer with ID "${layerId}" not found in page "${pageName}"`)
    }

    // Convert layer to VTEX IO components
    const components = this.convertLayerToVTEX(layer)
    const styles = this.generateStyles(layer)

    // Format in VTEX IO standard
    return {
      components,
      cssStyles: styles // Changed from 'styles' object to 'cssStyles' string
    }
  }

  convertLayerToVTEX(layer) {
    // Determinar o tipo de bloco principal com base no nome da camada
    const pageType = this.determinePageType(layer.name.toLowerCase())
    
    // Criar blocos filhos com base nas subcamadas
    let childBlocks = this.createChildBlocks(layer)
    
    // Reorganizar blocos para garantir que o header esteja primeiro
    childBlocks = this.organizeBlocks(childBlocks)
    
    // Criar o objeto de componentes no formato VTEX IO
    const components = {
      [pageType]: {
        blocks: childBlocks.map(block => block.id)
      }
    }
    
    // Adicionar blocos específicos para cada tipo de página
    this.addPageSpecificBlocks(components, pageType)
    
    // Adicionar definições de blocos
    childBlocks.forEach(block => {
      components[block.id] = block.definition
      
      // Se for um slider, adicionar também o list-context necessário
      if (block.id.startsWith('slider-layout') && !components['list-context.image-list']) {
        const listContextId = `list-context.image-list#${this.sanitizeId(layer.name)}-images`
        
        // Adicionar o list-context antes do slider na lista de blocos
        const sliderIndex = components[pageType].blocks.indexOf(block.id)
        if (sliderIndex !== -1) {
          components[pageType].blocks[sliderIndex] = listContextId
          
          // Adicionar o slider como filho do list-context
          components[listContextId] = {
            children: [block.id],
            props: {
              images: this.extractImagesFromLayer(layer)
            }
          }
        }
      }
    })
    
    // Garantir que flex-layout.col esteja sempre dentro de flex-layout.row
    this.ensureProperFlexLayout(components)
    
    return components
  }

  // Nova função para determinar o tipo de página com base no nome da camada
  determinePageType(layerName) {
    if (layerName.includes('pdp') || layerName.includes('produto')) {
      return 'store.product'
    } else if (layerName.includes('plp') || layerName.includes('categoria')) {
      return 'store.category'
    } else if (layerName.includes('search') || layerName.includes('busca')) {
      if (layerName.includes('empty') || layerName.includes('vazia')) {
        return 'store.search#empty'
      }
      return 'store.search'
    } else if (layerName.includes('collection') || layerName.includes('colecao')) {
      return 'store.collection'
    } else if (layerName.includes('home')) {
      return 'store.home'
    } else {
      return 'store.custom'
    }
  }

  // Nova função para adicionar blocos específicos para cada tipo de página
  addPageSpecificBlocks(components, pageType) {
    const pageBlocks = components[pageType].blocks
    
    switch (pageType) {
      case 'store.product':
        // Verificar se já existe um bloco de breadcrumb
        if (!pageBlocks.some(block => block.includes('breadcrumb'))) {
          pageBlocks.unshift('breadcrumb')
          components['breadcrumb'] = {
            props: {
              showOnMobile: true
            }
          }
        }
        
        // Verificar se já existe um bloco de produto
        if (!pageBlocks.some(block => block.includes('product-'))) {
          // Adicionar blocos essenciais para página de produto
          const productDetailsId = 'flex-layout.row#product-main'
          pageBlocks.push(productDetailsId)
          
          components[productDetailsId] = {
            children: [
              'flex-layout.col#product-images',
              'flex-layout.col#product-details'
            ]
          }
          
          components['flex-layout.col#product-images'] = {
            children: ['product-images'],
            props: {
              width: '60%',
              verticalAlign: 'middle'
            }
          }
          
          components['product-images'] = {
            props: {
              displayThumbnailsArrows: true
            }
          }
          
          components['flex-layout.col#product-details'] = {
            children: [
              'product-name',
              'product-price',
              'product-description',
              'buy-button'
            ],
            props: {
              width: '40%',
              verticalAlign: 'middle'
            }
          }
        }
        break
        
      case 'store.category':
      case 'store.search':
        // Verificar se já existe um bloco de busca/categoria
        if (!pageBlocks.some(block => block.includes('search-result'))) {
          // Adicionar blocos essenciais para página de categoria/busca
          pageBlocks.push('search-result-layout')
          
          components['search-result-layout'] = {
            children: ['search-result-layout.desktop', 'search-result-layout.mobile']
          }
          
          components['search-result-layout.desktop'] = {
            children: ['search-result-layout.desktop#custom'],
            props: {
              preventRouteChange: true
            }
          }
          
          components['search-result-layout.desktop#custom'] = {
            children: [
              'flex-layout.row#searchbread',
              'flex-layout.row#searchtitle',
              'flex-layout.row#result'
            ]
          }
          
          components['flex-layout.row#searchbread'] = {
            children: ['breadcrumb.search']
          }
          
          components['flex-layout.row#searchtitle'] = {
            children: ['search-title.v2']
          }
          
          components['flex-layout.row#result'] = {
            children: [
              'flex-layout.col#filter',
              'flex-layout.col#search'
            ]
          }
          
          components['flex-layout.col#filter'] = {
            children: ['filter-navigator.v3'],
            props: {
              width: '20%'
            }
          }
          
          components['flex-layout.col#search'] = {
            children: ['search-content'],
            props: {
              width: '80%'
            }
          }
        }
        break
        
      case 'store.search#empty':
        // Verificar se já existe um bloco de busca vazia
        if (!pageBlocks.some(block => block.includes('search-result'))) {
          // Adicionar blocos essenciais para página de busca vazia
          pageBlocks.push('flex-layout.row#empty-search')
          
          components['flex-layout.row#empty-search'] = {
            children: ['flex-layout.col#empty-search']
          }
          
          components['flex-layout.col#empty-search'] = {
            children: [
              'rich-text#empty-search',
              'search-suggestions'
            ],
            props: {
              horizontalAlign: 'center',
              verticalAlign: 'middle',
              rowGap: 5
            }
          }
          
          components['rich-text#empty-search'] = {
            props: {
              text: "Não encontramos nenhum resultado para sua busca",
              textAlignment: "CENTER",
              textPosition: "CENTER",
              font: "t-heading-3"
            }
          }
        }
        break
        
      case 'store.collection':
        // Verificar se já existe um bloco de coleção
        if (!pageBlocks.some(block => block.includes('search-result'))) {
          // Adicionar blocos essenciais para página de coleção
          pageBlocks.push('search-result-layout.customQuery')
          
          components['search-result-layout.customQuery'] = {
            props: {
              querySchema: {
                orderByField: "OrderByReleaseDateDESC",
                hideUnavailableItems: true,
                maxItemsPerPage: 12,
                queryField: "Collection",
                mapField: "productClusterIds",
                skusFilter: "ALL_AVAILABLE"
              }
            },
            children: ['search-result-layout.desktop', 'search-result-layout.mobile']
          }
          
          // Reutilizar os mesmos componentes de busca/categoria
          if (!components['search-result-layout.desktop']) {
            components['search-result-layout.desktop'] = {
              children: ['search-result-layout.desktop#custom'],
              props: {
                preventRouteChange: true
              }
            }
            
            components['search-result-layout.desktop#custom'] = {
              children: [
                'flex-layout.row#searchtitle',
                'flex-layout.row#result'
              ]
            }
            
            components['flex-layout.row#searchtitle'] = {
              children: ['search-title.v2']
            }
            
            components['flex-layout.row#result'] = {
              children: ['search-content']
            }
          }
        }
        break
    }
  }

  // Nova função para organizar blocos (header primeiro)
  organizeBlocks(blocks) {
    // Encontrar o bloco de header
    const headerIndex = blocks.findIndex(block => 
      block.id.includes('header') || 
      (block.id.includes('flex-layout') && block.id.includes('header'))
    )
    
    // Se encontrou o header, mover para o início
    if (headerIndex > 0) {
      const headerBlock = blocks.splice(headerIndex, 1)[0]
      blocks.unshift(headerBlock)
    }
    
    // Encontrar o bloco de footer
    const footerIndex = blocks.findIndex(block => 
      block.id.includes('footer') || 
      (block.id.includes('flex-layout') && block.id.includes('footer'))
    )
    
    // Se encontrou o footer, mover para o final
    if (footerIndex > -1 && footerIndex < blocks.length - 1) {
      const footerBlock = blocks.splice(footerIndex, 1)[0]
      blocks.push(footerBlock)
    }
    
    return blocks
  }

  // Nova função para garantir que flex-layout.col esteja dentro de flex-layout.row
  ensureProperFlexLayout(components) {
    // Encontrar todos os flex-layout.col que estão no nível principal
    const mainBlocks = components['store.home']?.blocks || components['store.custom']?.blocks || []
    
    const colBlocks = mainBlocks.filter(blockId => 
      blockId.startsWith('flex-layout.col#')
    )
    
    if (colBlocks.length > 0) {
      // Criar um novo flex-layout.row para conter esses col
      const rowId = `flex-layout.row#auto-generated-${Date.now()}`
      
      // Substituir os col pelo row no array principal
      const firstColIndex = mainBlocks.indexOf(colBlocks[0])
      mainBlocks.splice(firstColIndex, colBlocks.length, rowId)
      
      // Adicionar o row com os col como filhos
      components[rowId] = {
        children: colBlocks,
        props: {
          blockClass: 'auto-generated-row',
          preventHorizontalStretch: true
        }
      }
    }
    
    // Verificar recursivamente em todos os componentes
    Object.keys(components).forEach(key => {
      if (components[key] && components[key].children) {
        const children = components[key].children
        
        // Verificar se há flex-layout.col sem um flex-layout.row pai
        if (!key.startsWith('flex-layout.row#')) {
          const nestedColBlocks = children.filter(blockId => 
            blockId.startsWith('flex-layout.col#')
          )
          
          if (nestedColBlocks.length > 0) {
            // Criar um novo flex-layout.row para conter esses col
            const rowId = `flex-layout.row#nested-${this.sanitizeId(key)}-${Date.now()}`
            
            // Substituir os col pelo row no array de filhos
            const firstColIndex = children.indexOf(nestedColBlocks[0])
            children.splice(firstColIndex, nestedColBlocks.length, rowId)
            
            // Adicionar o row com os col como filhos
            components[rowId] = {
              children: nestedColBlocks,
              props: {
                blockClass: 'nested-auto-row',
                preventHorizontalStretch: true
              }
            }
          }
        }
      }
    })
  }

  // Nova função para extrair imagens de uma camada
  extractImagesFromLayer(layer) {
    const images = []
    
    // Função recursiva para encontrar nós de imagem
    const findImages = (node) => {
      if (!node) return
      
      // Verificar se o nó atual é uma imagem
      if (this.isImage(node)) {
        images.push({
          image: `assets/${this.sanitizeId(node.name)}.png`,
          mobileImage: `assets/${this.sanitizeId(node.name)}.png`,
          description: node.name
        })
      }
      
      // Verificar filhos recursivamente
      if (node.children) {
        node.children.forEach(child => findImages(child))
      }
    }
    
    findImages(layer)
    
    // Se não encontrou imagens, adicionar pelo menos uma imagem padrão
    if (images.length === 0) {
      images.push({
        image: "assets/banner-principal-home.png",
        mobileImage: "assets/banner-principal-home.png",
        description: "Banner principal"
      })
    }
    
    return images
  }

  createChildBlocks(layer) {
    if (!layer.children || layer.children.length === 0) {
      return []
    }
    
    return layer.children.map(child => {
      // Determinar o tipo de bloco com base no tipo de camada
      const blockType = this.getBlockType(child)
      const blockId = `${blockType}#${this.sanitizeId(child.name)}`
      
      // Criar propriedades do bloco
      const props = this.extractProps(child)
      
      // Criar filhos recursivamente
      const children = this.createChildBlocks(child)
      
      return {
        id: blockId,
        definition: {
          props,
          children: children.length > 0 ? children.map(c => c.id) : undefined
        }
      }
    })
  }

  getBlockType(node) {
    return this.blockMapper.getBlockType(node);
  }

  extractProps(node) {
    return this.blockMapper.getBlockProps(node);
  }

  isImage(node) {
    // Verificar se o nó tem preenchimento de imagem
    return node.fills && node.fills.some(fill => fill.type === 'IMAGE');
  }

  // Remove this duplicate method
  // extractProps(node) {
  //   const props = {}
  //   
  //   // Extrair propriedades com base no tipo de nó
  //   if (node.name.includes('--')) {
  //     const blockClass = node.name.split('--')[1]
  //     props.blockClass = blockClass
  //   }
  //   
  //   // Adicionar propriedades de layout
  //   if (node.layoutMode === 'HORIZONTAL') {
  //     props.horizontalAlign = 'center'
  //   } else if (node.layoutMode === 'VERTICAL') {
  //     props.verticalAlign = 'middle'
  //   }
  //   
  //   // Adicionar propriedades específicas para tipos
  //   if (node.type === 'TEXT' && node.characters) {
  //     props.text = node.characters
  //   }
  //   
  //   // Adicionar propriedades de estilo
  //   if (node.style) {
  //     if (node.style.fontFamily) {
  //       props.font = node.style.fontFamily
  //     }
  //     if (node.style.fontSize) {
  //       props.fontSize = node.style.fontSize
  //     }
  //   }
  //   
  //   return Object.keys(props).length > 0 ? props : undefined
  // }

  sanitizeId(name) {
    // Converter o nome para um ID válido
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  generateStyles(layer) {
    // Generate CSS directly instead of a JSON structure
    return this.generateCSSFromLayer(layer);
  }

  generateCSSFromLayer(layer, selector = '') {
    let css = ''
    
    // Generate CSS selector based on layer name
    const currentSelector = selector || `.${this.sanitizeId(layer.name)}`
    
    // Extract style properties
    const styleProps = this.extractStyleProps(layer)
    
    if (Object.keys(styleProps).length > 0) {
      css += `${currentSelector} {\n`
      for (const [prop, value] of Object.entries(styleProps)) {
        css += `  ${prop}: ${value};\n`
      }
      css += '}\n\n'
    }
    
    // Process styles for child layers
    if (layer.children) {
      for (const child of layer.children) {
        const childSelector = `${currentSelector} .${this.sanitizeId(child.name)}`
        css += this.generateCSSFromLayer(child, childSelector)
      }
    }
    
    return css
  }

  extractStyleProps(node) {
    const props = {}
    
    // Extrair propriedades de estilo com base no tipo de nó
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0]
      if (fill.type === 'SOLID') {
        const { r, g, b, a } = fill.color
        props['background-color'] = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
      }
    }
    
    // Extrair propriedades de borda
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0]
      if (stroke.type === 'SOLID') {
        const { r, g, b, a } = stroke.color
        props['border-color'] = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
        props['border-width'] = `${node.strokeWeight}px`
        props['border-style'] = 'solid'
      }
    }
    
    // Extrair propriedades de texto
    if (node.type === 'TEXT' && node.style) {
      if (node.style.fontFamily) {
        props['font-family'] = node.style.fontFamily
      }
      if (node.style.fontSize) {
        props['font-size'] = `${node.style.fontSize}px`
      }
      if (node.style.fontWeight) {
        props['font-weight'] = node.style.fontWeight
      }
      if (node.style.textAlignHorizontal) {
        props['text-align'] = node.style.textAlignHorizontal.toLowerCase()
      }
      if (node.style.lineHeightPx) {
        props['line-height'] = `${node.style.lineHeightPx}px`
      }
    }
    
    // Extrair propriedades de layout
    if (node.absoluteBoundingBox) {
      props['width'] = `${node.absoluteBoundingBox.width}px`
      props['height'] = `${node.absoluteBoundingBox.height}px`
    }
    
    return props
  }

  // Nova função para extrair CSS diretamente da API do Figma
  async extractFigmaCSS(figmaAPI, fileKey, nodeId) {
    try {
      // Endpoint para obter CSS de um nó específico
      const response = await figmaAPI.api.get(`/files/${fileKey}/nodes?ids=${nodeId}&plugin_data=shared`)
      
      if (!response.data || !response.data.nodes || !response.data.nodes[nodeId]) {
        throw new Error('Failed to fetch node data from Figma API')
      }
      
      const node = response.data.nodes[nodeId]
      
      // Extrair CSS do nó e seus filhos recursivamente
      return this.extractNodeCSS(node, fileKey, figmaAPI)
    } catch (error) {
      console.error('Error extracting CSS from Figma:', error)
      return ''
    }
  }
  
  async extractNodeCSS(node, fileKey, figmaAPI) {
    let css = ''
    
    // Obter CSS do nó atual
    if (node.document) {
      css += this.generateNodeCSS(node.document)
      
      // Processar filhos recursivamente
      if (node.document.children && node.document.children.length > 0) {
        for (const child of node.document.children) {
          // Obter CSS para cada filho
          const childCSS = await this.extractFigmaCSS(figmaAPI, fileKey, child.id)
          css += childCSS
        }
      }
    }
    
    return css
  }
  
  generateNodeCSS(node) {
    let css = ''
    const selector = `.${this.sanitizeId(node.name)}`
    
    // Extrair propriedades de estilo
    const styleProps = this.extractStyleProps(node)
    
    if (Object.keys(styleProps).length > 0) {
      css += `${selector} {\n`
      for (const [prop, value] of Object.entries(styleProps)) {
        css += `  ${prop}: ${value};\n`
      }
      css += '}\n\n'
    }
    
    return css
  }
}

module.exports = { VTEXConverter }