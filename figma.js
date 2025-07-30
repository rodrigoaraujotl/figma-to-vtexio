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
    try {
      const response = await this.api.get(`/files/${fileKey}`);
      
      if (!response.data || !response.data.document || !response.data.document.children) {
        throw new Error('Invalid Figma file structure');
      }
      
      // Extrair apenas as páginas do documento
      return response.data.document.children.map(page => ({
        id: page.id,
        name: page.name
      }));
    } catch (error) {
      console.error('Error fetching Figma pages:', error);
      throw new Error(`Failed to fetch pages: ${error.message}`);
    }
  }

  async getLayers(fileKey, pageId) {
    try {
      const response = await this.api.get(`/files/${fileKey}`);
      
      if (!response.data || !response.data.document || !response.data.document.children) {
        throw new Error('Invalid Figma file structure');
      }
      
      // Encontrar a página específica
      const page = response.data.document.children.find(p => p.id === pageId);
      
      if (!page || !page.children) {
        throw new Error(`Page with ID ${pageId} not found or has no children`);
      }
      
      // Extrair camadas de primeiro nível da página
      return page.children.map(layer => ({
        id: layer.id,
        name: layer.name,
        type: layer.type
      }));
    } catch (error) {
      console.error('Error fetching Figma layers:', error);
      throw new Error(`Failed to fetch layers: ${error.message}`);
    }
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