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
  layerSelect.addEventListener('change', function() {
    loadChildBlocks(this.value)
  })
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
      const response = await fetch(`/api/pages?fileKey=${encodeURIComponent(fileKey)}&accessToken=${encodeURIComponent(accessToken)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed with status: ${response.status}`)
      }
      
      const data = await response.json()

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
      const response = await fetch(`/api/layers?fileKey=${encodeURIComponent(fileKey)}&accessToken=${encodeURIComponent(accessToken)}&pageId=${encodeURIComponent(pageId)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed with status: ${response.status}`)
      }
      
      const data = await response.json()
  
      // Preencher select de camadas
      data.forEach(layer => {
        const option = document.createElement('option')
        option.value = layer.id
        option.textContent = `${layer.name} (${layer.type})`
        layerSelect.appendChild(option)
      })
      layerSelect.disabled = false
      pageSelect.disabled = false
    } catch (error) {
      alert(`Error: ${error.message}`)
      console.error(error)
    }
    
    checkRequiredFields()
    // REMOVER ESTAS LINHAS QUE ESTÃO CAUSANDO O ERRO
    // const layerSelect = document.getElementById('layerSelect');
    // layerSelect.addEventListener('change', function() {
    // loadChildBlocks(this.value);
    // });
  }

  async function loadChildBlocks(layerId) {
    const accessToken = document.getElementById('accessToken').value;
    const fileKey = document.getElementById('fileKey').value;
    const pageId = document.getElementById('pageSelect').value;
    
    if (!accessToken || !fileKey || !pageId || !layerId) {
      return;
    }
    
    try {
      // Fazer uma requisição para obter os blocos filhos da camada selecionada
      const response = await fetch('/api/get-child-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accessToken, fileKey, pageId, layerId })
      });
      
      const data = await response.json();
      
      // Criar a interface para seleção de blocos
      const blockSelectionContainer = document.getElementById('blockSelectionContainer') || 
                                     createBlockSelectionContainer();
      
      blockSelectionContainer.innerHTML = '<h4>Select blocks to export:</h4>';
      
      // Adicionar checkbox para cada bloco
      data.blocks.forEach(block => {
        const blockDiv = document.createElement('div');
        blockDiv.className = 'form-check';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input block-checkbox';
        checkbox.id = `block-${block.id}`;
        checkbox.value = block.name;
        checkbox.checked = true; // Por padrão, todos os blocos são selecionados
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `block-${block.id}`;
        label.textContent = block.name;
        
        blockDiv.appendChild(checkbox);
        blockDiv.appendChild(label);
        blockSelectionContainer.appendChild(blockDiv);
      });
      
      // Adicionar botões para selecionar/desselecionar todos
      const buttonGroup = document.createElement('div');
      buttonGroup.className = 'btn-group mt-2 mb-3';
      
      const selectAllBtn = document.createElement('button');
      selectAllBtn.className = 'btn btn-sm btn-outline-primary';
      selectAllBtn.textContent = 'Select All';
      selectAllBtn.onclick = () => {
        document.querySelectorAll('.block-checkbox').forEach(cb => cb.checked = true);
      };
      
      const deselectAllBtn = document.createElement('button');
      deselectAllBtn.className = 'btn btn-sm btn-outline-secondary';
      deselectAllBtn.textContent = 'Deselect All';
      deselectAllBtn.onclick = () => {
        document.querySelectorAll('.block-checkbox').forEach(cb => cb.checked = false);
      };
      
      buttonGroup.appendChild(selectAllBtn);
      buttonGroup.appendChild(deselectAllBtn);
      blockSelectionContainer.insertBefore(buttonGroup, blockSelectionContainer.firstChild);
      
    } catch (error) {
      console.error('Error loading child blocks:', error);
    }
  }

  function createBlockSelectionContainer() {
    const container = document.createElement('div');
    container.id = 'blockSelectionContainer';
    container.className = 'mt-3 mb-3 p-3 border rounded';
    
    // Inserir após o seletor de camadas
    const layerSelectGroup = document.getElementById('layerSelect').closest('.form-group');
    
    // Verificar se o elemento foi encontrado antes de acessar parentNode
    if (layerSelectGroup) {
      layerSelectGroup.parentNode.insertBefore(container, layerSelectGroup.nextSibling);
    } else {
      // Fallback: adicionar ao formulário ou a outro container existente
      const form = document.querySelector('form') || document.body;
      form.appendChild(container);
    }
    
    return container;
  }

  // Converter para VTEX IO
  // Update the convertToVTEX function to handle the separate cssStyles property
  // Update the convertToVTEX function to handle errors better
  async function convertToVTEX() {
    const accessToken = document.getElementById('accessToken').value;
    const fileKey = document.getElementById('fileKey').value;
    const pageId = document.getElementById('pageSelect').value;
    const layerId = document.getElementById('layerSelect').value;
    
    // Get the page name from our map
    const pageName = pageIdToNameMap[pageId];
    
    // Obter os blocos selecionados
    const selectedBlocks = Array.from(document.querySelectorAll('.block-checkbox:checked'))
      .map(checkbox => checkbox.value);
    
    if (!accessToken || !fileKey || !pageName || !layerId) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken,
          fileKey,
          pageName,
          layerId,
          selectedBlocks
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Display components in the components output area
      const componentsOutput = document.getElementById('componentsOutput');
      componentsOutput.textContent = JSON.stringify(result.components, null, 2);
      
      // Display CSS styles in the styles output area if available
      const stylesOutput = document.getElementById('stylesOutput');
      if (result.cssStyles) {
        stylesOutput.textContent = result.cssStyles;
      } else {
        stylesOutput.textContent = '/* No styles generated */';
      }
      
      // Enable copy buttons
      document.getElementById('copyComponentsBtn').disabled = false;
      document.getElementById('copyStylesBtn').disabled = false;
    } catch (error) {
      console.error('Conversion error:', error);
      alert(`Error converting to VTEX IO: ${error.message}`);
      
      // Clear outputs and disable copy buttons
      document.getElementById('componentsOutput').textContent = 'Error: ' + error.message;
      document.getElementById('stylesOutput').textContent = '/* Error occurred during conversion */';
      document.getElementById('copyComponentsBtn').disabled = true;
      document.getElementById('copyStylesBtn').disabled = true;
    }
  }

  // Update the getStyles function to handle CSS text directly
  async function getStyles() {
    const accessToken = document.getElementById('accessToken').value;
    const fileKey = document.getElementById('fileKey').value;
    const pageName = document.getElementById('pageSelect').value;
    const layerId = document.getElementById('layerSelect').value;
    
    if (!accessToken || !fileKey || !pageName || !layerId) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      const response = await fetch('/api/styles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accessToken, fileKey, pageName, layerId })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Get the CSS text directly from the response
      const cssText = await response.text();
      
      // Display CSS in the styles output area
      const stylesOutput = document.getElementById('stylesOutput');
      stylesOutput.textContent = cssText || '/* No styles generated */';
      
      // Enable copy button
      document.getElementById('copyStylesBtn').disabled = false;
    } catch (error) {
      console.error('Style extraction error:', error);
      alert(`Error getting styles: ${error.message}`);
    }
  }

  // Add event listener for the Get Figma CSS button
  document.getElementById('getFigmaCSSBtn').addEventListener('click', async () => {
    const accessToken = document.getElementById('accessToken').value;
    const fileKey = document.getElementById('fileKey').value;
    const layerId = document.getElementById('layerSelect').value;
    
    if (!accessToken || !fileKey || !layerId) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await fetch('/api/figma-css', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accessToken, fileKey, nodeId: layerId })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Get the CSS text directly from the response
      const cssText = await response.text();
      
      // Display CSS in the styles output area
      const stylesOutput = document.getElementById('stylesOutput');
      stylesOutput.textContent = cssText || '/* No CSS found */';
      
      // Enable copy button
      document.getElementById('copyStylesBtn').disabled = false;
    } catch (error) {
      console.error('Figma CSS error:', error);
      alert(`Error getting Figma CSS: ${error.message}`);
    }
  });

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