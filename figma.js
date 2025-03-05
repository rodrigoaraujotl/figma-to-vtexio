const axios = require('axios')

class FigmaAPI {
  constructor(accessToken) {
    this.api = axios.create({
      baseURL: 'https://api.figma.com/v1',
      headers: {
        'X-Figma-Token': accessToken
      }
    })
  }

  async getFile(fileKey) {
    const response = await this.api.get(`/files/${fileKey}`)
    return response.data
  }

  async getImageFills(fileKey, nodeIds) {
    const response = await this.api.get(`/images/${fileKey}`, {
      params: { ids: nodeIds.join(',') }
    })
    return response.data
  }

  // Novo método para obter as páginas de um arquivo
  async getPages(fileKey) {
    const file = await this.getFile(fileKey)
    return file.document.children.map(page => ({
      id: page.id,
      name: page.name
    }))
  }

  // Método modificado para obter apenas as camadas principais
  async getLayers(fileKey, pageId) {
    const file = await this.getFile(fileKey)
    const page = file.document.children.find(p => p.id === pageId)
    
    if (!page) return []
    
    // Retornar apenas as camadas de primeiro nível
    return page.children.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type
    }))
  }

  // Novo método para obter CSS diretamente do Figma
  async getNodeCSS(fileKey, nodeId) {
    try {
      // Obter informações do nó
      const response = await this.api.get(`/files/${fileKey}/nodes?ids=${nodeId}`)
      
      if (!response.data || !response.data.nodes || !response.data.nodes[nodeId]) {
        throw new Error('Failed to fetch node data')
      }
      
      // Obter CSS do nó usando a API do Figma
      const cssResponse = await this.api.get(`/files/${fileKey}/styles`, {
        params: { ids: nodeId }
      })
      
      if (!cssResponse.data || !cssResponse.data.meta || !cssResponse.data.meta.styles) {
        return { css: '', error: 'No styles found for this node' }
      }
      
      return { css: cssResponse.data.meta.styles, error: null }
    } catch (error) {
      console.error('Error fetching CSS from Figma:', error)
      return { css: '', error: error.message }
    }
  }
}

module.exports = { FigmaAPI }