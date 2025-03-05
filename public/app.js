document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const fileKeyInput = document.getElementById('fileKey')
  const accessTokenInput = document.getElementById('accessToken')
  const pageSelect = document.getElementById('pageSelect')
  const layerSelect = document.getElementById('layerSelect')
  const loadPagesBtn = document.getElementById('loadPagesBtn')
  const convertBtn = document.getElementById('convertBtn')
  const getStylesBtn = document.getElementById('getStylesBtn')
  const componentsOutput = document.getElementById('componentsOutput')
  const stylesOutput = document.getElementById('stylesOutput')
  const copyComponentsBtn = document.getElementById('copyComponentsBtn')
  const copyStylesBtn = document.getElementById('copyStylesBtn')

  // Armazenar mapeamento de IDs para nomes de páginas
  let pageIdToNameMap = {}

  // Event Listeners
  loadPagesBtn.addEventListener('click', loadPages)
  pageSelect.addEventListener('change', loadLayers)
  convertBtn.addEventListener('click', convertToVTEX)
  getStylesBtn.addEventListener('click', getStyles)
  copyComponentsBtn.addEventListener('click', () => copyToClipboard(componentsOutput.textContent))
  copyStylesBtn.addEventListener('click', () => copyToClipboard(stylesOutput.textContent))

  // Verificar se os campos obrigatórios estão preenchidos
  function checkRequiredFields() {
    const fileKey = fileKeyInput.value.trim()
    const accessToken = accessTokenInput.value.trim()
    const pageId = pageSelect.value
    const layerId = layerSelect.value

    const hasRequiredFields = fileKey && accessToken
    const hasSelectedOptions = pageId && layerId

    loadPagesBtn.disabled = !hasRequiredFields
    convertBtn.disabled = !hasRequiredFields || !hasSelectedOptions
    getStylesBtn.disabled = !hasRequiredFields || !hasSelectedOptions

    console.log('Fields status:', { 
      hasRequiredFields, 
      hasSelectedOptions,
      fileKey: !!fileKey,
      accessToken: !!accessToken,
      pageId: !!pageId,
      layerId: !!layerId
    })
  }

  // Adicionar listeners para todos os campos
  fileKeyInput.addEventListener('input', checkRequiredFields)
  accessTokenInput.addEventListener('input', checkRequiredFields)
  pageSelect.addEventListener('change', checkRequiredFields)
  layerSelect.addEventListener('change', checkRequiredFields)

  // Carregar páginas do arquivo Figma
  async function loadPages() {
    const fileKey = fileKeyInput.value.trim()
    const accessToken = accessTokenInput.value.trim()

    if (!fileKey || !accessToken) {
      alert('Please enter both File Key and Access Token')
      return
    }

    try {
      // Limpar selects
      pageSelect.innerHTML = '<option value="">Select a page</option>'
      layerSelect.innerHTML = '<option value="">Select a layer</option>'
      pageSelect.disabled = true
      layerSelect.disabled = true
      
      // Mostrar loading
      loadPagesBtn.textContent = 'Loading...'
      loadPagesBtn.disabled = true

      // Fazer requisição para obter páginas
      const response = await fetch(`/api/pages?fileKey=${fileKey}&accessToken=${accessToken}`)
      const data = await response.json()

      if (response.ok) {
        // Preencher select de páginas
        pageIdToNameMap = {}
        data.forEach(page => {
          const option = document.createElement('option')
          option.value = page.id
          option.textContent = page.name
          pageSelect.appendChild(option)
          pageIdToNameMap[page.id] = page.name
        })

        pageSelect.disabled = false
        checkRequiredFields()
      } else {
        throw new Error(data.error || 'Failed to load pages')
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
      console.error(error)
    } finally {
      loadPagesBtn.textContent = 'Load Pages'
      loadPagesBtn.disabled = false
    }
  }

  // Carregar camadas da página selecionada
  async function loadLayers() {
    const fileKey = fileKeyInput.value.trim()
    const accessToken = accessTokenInput.value.trim()
    const pageId = pageSelect.value

    if (!pageId) {
      layerSelect.innerHTML = '<option value="">Select a layer</option>'
      layerSelect.disabled = true
      return
    }

    try {
      // Limpar select de camadas
      layerSelect.innerHTML = '<option value="">Select a layer</option>'
      layerSelect.disabled = true
      
      // Mostrar loading
      pageSelect.disabled = true

      // Fazer requisição para obter camadas
      const response = await fetch(`/api/layers?fileKey=${fileKey}&accessToken=${accessToken}&pageId=${pageId}`)
      const data = await response.json()

      if (response.ok) {
        // Preencher select de camadas
        data.forEach(layer => {
          const option = document.createElement('option')
          option.value = layer.id
          option.textContent = `${layer.name} (${layer.type})`
          layerSelect.appendChild(option)
        })
        layerSelect.disabled = false
        pageSelect.disabled = false
      } else {
        throw new Error(data.error || 'Failed to load layers')
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
      console.error(error)
    }
    
    checkRequiredFields()
  }

  // Converter para VTEX IO
  async function convertToVTEX() {
    const fileKey = fileKeyInput.value.trim()
    const accessToken = accessTokenInput.value.trim()
    const pageName = pageIdToNameMap[pageSelect.value]
    const layerId = layerSelect.value

    try {
      convertBtn.disabled = true
      convertBtn.textContent = 'Converting...'
      
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileKey,
          accessToken,
          pageName,
          layerId
        })
      })

      const data = await response.json()

      if (response.ok) {
        componentsOutput.textContent = JSON.stringify(data, null, 2)
      } else {
        throw new Error(data.error || 'Conversion failed')
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
      console.error(error)
      componentsOutput.textContent = 'Error during conversion.'
    } finally {
      convertBtn.disabled = false
      convertBtn.textContent = 'Convert'
    }
  }

  // Obter estilos CSS
  async function getStyles() {
    const fileKey = fileKeyInput.value.trim()
    const accessToken = accessTokenInput.value.trim()
    const pageName = pageIdToNameMap[pageSelect.value]
    const layerId = layerSelect.value
  
    try {
      getStylesBtn.disabled = true
      getStylesBtn.textContent = 'Getting Styles...'
      
      const response = await fetch('/api/styles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileKey,
          accessToken,
          pageName,
          layerId
        })
      })
  
      if (response.ok) {
        // Obter o texto CSS diretamente, não como JSON
        const cssText = await response.text()
        stylesOutput.textContent = cssText
      } else {
        // Se houver erro, tentar obter como JSON para extrair a mensagem de erro
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get styles')
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
      console.error(error)
      stylesOutput.textContent = 'Error getting styles.'
    } finally {
      getStylesBtn.disabled = false
      getStylesBtn.textContent = 'Get Styles'
    }
  }

  // Adicionar botão para obter CSS do Figma
  const getFigmaCSSBtn = document.getElementById('getFigmaCSSBtn')
  getFigmaCSSBtn.addEventListener('click', getFigmaCSS)

  // Função para obter CSS diretamente do Figma
  async function getFigmaCSS() {
    const fileKey = fileKeyInput.value.trim()
    const accessToken = accessTokenInput.value.trim()
    const layerId = layerSelect.value
  
    if (!fileKey || !accessToken || !layerId) {
      alert('Please select a file, provide an access token, and select a layer')
      return
    }
  
    try {
      getFigmaCSSBtn.disabled = true
      getFigmaCSSBtn.textContent = 'Getting Figma CSS...'
      
      const response = await fetch('/api/figma-css', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileKey,
          accessToken,
          nodeId: layerId
        })
      })
  
      if (response.ok) {
        // Obter o texto CSS diretamente
        const cssText = await response.text()
        stylesOutput.textContent = cssText
      } else {
        // Se houver erro, tentar obter como JSON para extrair a mensagem de erro
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get Figma CSS')
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
      console.error(error)
      stylesOutput.textContent = 'Error getting Figma CSS.'
    } finally {
      getFigmaCSSBtn.disabled = false
      getFigmaCSSBtn.textContent = 'Get Figma CSS'
    }
  }

  // Função auxiliar para copiar para a área de transferência
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy to clipboard')
    }
  }
})