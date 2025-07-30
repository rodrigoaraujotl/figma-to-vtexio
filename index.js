const express = require('express')
const path = require('path')
const { FigmaAPI } = require('./figma')
const { VTEXConverter } = require('./converter')

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

const PORT = process.env.PORT || 3000

// Endpoint para converter Figma para VTEX IO
app.post('/api/convert', async (req, res) => {
  try {
    const { accessToken, fileKey, pageName, layerId, selectedBlocks = [] } = req.body
    
    // Inicializar a API do Figma com o token de acesso
    const figmaAPI = new FigmaAPI(accessToken)
    
    // Obter o arquivo do Figma
    const figmaFile = await figmaAPI.getFile(fileKey)
    
    // Converter para VTEX IO
    const converter = new VTEXConverter()
    const result = await converter.convert(figmaFile, pageName, layerId, selectedBlocks)
    
    res.json(result)
  } catch (error) {
    console.error('Error converting to VTEX IO:', error)
    res.status(500).json({ error: `Error converting to VTEX IO: ${error.message}` })
  }
})

// Endpoint para obter apenas os estilos CSS
app.post('/api/styles', async (req, res) => {
  try {
    const { fileKey, accessToken, pageName, layerId } = req.body
    
    const figma = new FigmaAPI(accessToken)
    const figmaFile = await figma.getFile(fileKey)
    
    const converter = new VTEXConverter()
    const result = await converter.convert(figmaFile, pageName, layerId)
    
    // Return CSS directly with the proper content type
    res.set('Content-Type', 'text/css')
    res.send(result.cssStyles || '/* No styles found */')
  } catch (error) {
    console.error('Style extraction error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Função auxiliar para extrair estilos inline dos componentes
function extractInlineStyles(components, prefix = '') {
  let styles = '';
  
  if (!components) return styles;
  
  if (Array.isArray(components)) {
    components.forEach(component => {
      styles += extractInlineStyles(component, prefix);
    });
  } else if (typeof components === 'object') {
    // Extrair style prop se existir
    if (components.props && components.props.style) {
      const selector = components.props.className || 
                      (components.props.id ? `#${components.props.id}` : null) ||
                      `.${components.type.replace(/\./g, '-').toLowerCase()}`;
      
      const cssProps = convertStyleObjectToCss(components.props.style);
      if (cssProps) {
        styles += `${prefix}${selector} {\n  ${cssProps}\n}\n\n`;
      }
      
      // Remover o estilo inline após extraí-lo
      delete components.props.style;
    }
    
    // Processar filhos recursivamente
    if (components.children) {
      const newPrefix = components.props && components.props.className ? 
                        `${prefix}.${components.props.className} ` : prefix;
      styles += extractInlineStyles(components.children, newPrefix);
    }
    
    // Processar outras propriedades que podem conter componentes
    Object.keys(components).forEach(key => {
      if (typeof components[key] === 'object' && key !== 'props') {
        styles += extractInlineStyles(components[key], prefix);
      }
    });
  }
  
  return styles;
}

function convertStyleObjectToCss(styleObj) {
  if (!styleObj || typeof styleObj !== 'object') return '';
  
  return Object.entries(styleObj)
    .map(([key, value]) => {
      // Converter camelCase para kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join('\n  ');
}

// Endpoint para obter páginas de um arquivo Figma
app.get('/api/pages', async (req, res) => {
  try {
    const { fileKey, accessToken } = req.query
    
    const figma = new FigmaAPI(accessToken)
    const pages = await figma.getPages(fileKey)
    
    res.json(pages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Endpoint para obter camadas de uma página
app.get('/api/layers', async (req, res) => {
  try {
    const { fileKey, accessToken, pageId } = req.query
    
    const figma = new FigmaAPI(accessToken)
    const layers = await figma.getLayers(fileKey, pageId)
    
    res.json(layers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Novo endpoint para obter CSS diretamente do Figma
app.post('/api/figma-css', async (req, res) => {
  try {
    const { fileKey, accessToken, nodeId } = req.body
    
    if (!fileKey || !accessToken || !nodeId) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }
    
    const figma = new FigmaAPI(accessToken)
    const result = await figma.getNodeCSS(fileKey, nodeId)
    
    if (result.error) {
      return res.status(500).json({ error: result.error })
    }
    
    // Retornar como texto CSS puro
    res.set('Content-Type', 'text/css')
    res.send(result.css)
  } catch (error) {
    console.error('Error getting Figma CSS:', error)
    res.status(500).json({ error: error.message })
  }
})

// Rota principal para a interface web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Rota para a documentação de designers
app.get('/designer-guide', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'designer-guide.html'))
})

// Adicione estas linhas no início do seu arquivo index.js, logo após as importações
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Figma-Token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.post('/api/get-child-blocks', async (req, res) => {
  try {
    const { accessToken, fileKey, pageId, layerId } = req.body;
    
    // Inicializar a API do Figma com o token de acesso
    const figmaAPI = new FigmaAPI(accessToken);
    
    // Obter o arquivo do Figma
    const figmaFile = await figmaAPI.getFile(fileKey);
    
    // Encontrar a página
    const page = figmaFile.document.children.find(p => p.id === pageId);
    if (!page) {
      throw new Error(`Page with ID "${pageId}" not found`);
    }
    
    // Função para encontrar nó por ID
    const findNodeById = (node, id) => {
      if (node.id === id) return node;
      if (!node.children) return null;
      
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
      
      return null;
    };
    
    // Encontrar a camada
    const layer = findNodeById(page, layerId);
    if (!layer) {
      throw new Error(`Layer with ID "${layerId}" not found`);
    }
    
    // Extrair informações dos blocos filhos
    const blocks = layer.children ? layer.children.map(child => ({
      id: child.id,
      name: child.name,
      type: child.type
    })) : [];
    
    res.json({ blocks });
  } catch (error) {
    console.error('Error getting child blocks:', error);
    res.status(500).json({ error: `Error getting child blocks: ${error.message}` });
  }
});

// Rota principal para a interface web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Rota para a documentação de designers
app.get('/designer-guide', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'designer-guide.html'))
})

// Adicione estas linhas no início do seu arquivo index.js, logo após as importações
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Figma-Token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})