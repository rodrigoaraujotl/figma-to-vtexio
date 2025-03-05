const { HeaderConverter } = require('./components/Header')
const { FooterConverter } = require('./components/Footer')
const { TemplateManager } = require('./templates/templateManager')
const { VTEXComponentMapper } = require('./services/vtexComponentMapper')
const { VTEXBlockMapper } = require('./services/vtexBlockMapper')


class VTEXConverter {
  constructor() {
    // Initialize the block mapper
    this.blockMapper = new VTEXBlockMapper();
  }

  async convert(figmaFile, pageName, layerId) {
    // Encontrar a página e a camada selecionada
    const page = figmaFile.document.children.find(p => p.name === pageName)
    if (!page) {
      throw new Error(`Page "${pageName}" not found`)
    }

    // Função para encontrar o nó com o ID especificado
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

    // Converter a camada para componentes VTEX IO
    const components = this.convertLayerToVTEX(layer)
    const styles = this.generateStyles(layer)

    // Formatar no padrão VTEX IO
    return {
      components,
      styles
    }
  }

  convertLayerToVTEX(layer) {
    // Determinar o tipo de bloco principal com base no tipo de camada
    const storePage = layer.name.toLowerCase().includes('home') ? 'store.home' : 'store.custom'
    
    // Criar blocos filhos com base nas subcamadas
    const childBlocks = this.createChildBlocks(layer)
    
    // Criar o objeto de componentes no formato VTEX IO
    const components = {
      [storePage]: {
        blocks: childBlocks.map(block => block.id)
      }
    }
    
    // Adicionar definições de blocos
    childBlocks.forEach(block => {
      components[block.id] = block.definition
      
      // Se for um slider, adicionar também o list-context necessário
      if (block.id.startsWith('slider-layout') && !components['list-context.image-list']) {
        const listContextId = `list-context.image-list#${this.sanitizeId(layer.name)}-images`
        
        // Adicionar o list-context antes do slider na lista de blocos
        const sliderIndex = components[storePage].blocks.indexOf(block.id)
        if (sliderIndex !== -1) {
          components[storePage].blocks[sliderIndex] = listContextId
          
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
    
    return components
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
    // Gerar estilos CSS com base nas propriedades visuais
    const styles = {
      'vtex.store-components': {
        'styles.css': this.generateCSSFromLayer(layer)
      }
    }
    
    return styles
  }

  generateCSSFromLayer(layer, selector = '') {
    let css = ''
    
    // Gerar seletor CSS com base no nome da camada
    const currentSelector = selector || `.${this.sanitizeId(layer.name)}`
    
    // Extrair propriedades de estilo
    const styleProps = this.extractStyleProps(layer)
    
    if (Object.keys(styleProps).length > 0) {
      css += `${currentSelector} {\n`
      for (const [prop, value] of Object.entries(styleProps)) {
        css += `  ${prop}: ${value};\n`
      }
      css += '}\n\n'
    }
    
    // Processar estilos de camadas filhas
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