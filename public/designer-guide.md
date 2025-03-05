# Guia de Nomenclatura para Designers Figma

Este guia explica como nomear corretamente as camadas no Figma para que sejam convertidas adequadamente para componentes VTEX IO usando nossa ferramenta de conversão.

## Princípios Básicos

1. **Nomes descritivos**: Use nomes que descrevam claramente a função do elemento
2. **Classes CSS**: Para adicionar classes CSS, use o formato `nome--classe`
3. **Hierarquia**: Mantenha uma hierarquia lógica de camadas que reflita a estrutura da página

## Nomenclatura por Tipo de Componente

### Páginas

- `home` - Página inicial da loja
- `pdp` - Página de produto
- `plp` - Página de listagem de produtos
- `institucional` - Páginas institucionais

### Layouts

- `header` - Cabeçalho do site
- `footer` - Rodapé do site
- `container` - Container principal
- `section-[nome]` - Seções da página (ex: `section-about`, `section-products`)

### Componentes de Navegação

- `menu` - Menu de navegação principal
- `menu-mobile` - Menu para dispositivos móveis
- `submenu` - Submenu de categorias
- `breadcrumb` - Navegação breadcrumb
- `search-bar` - Barra de busca

### Carrosséis e Banners

- `slider-principal` - Slider principal da home (será convertido para `slider-layout`)
- `slider-produtos` - Slider de produtos (será convertido para `slider-layout` com produtos)
- `banner-[posição]` - Banners estáticos (ex: `banner-topo`, `banner-meio`)
- `carousel-[nome]` - Outros carrosséis (ex: `carousel-marcas`)

### Produtos

- `shelf-[tipo]` - Prateleira de produtos (ex: `shelf-lancamentos`, `shelf-ofertas`)
- `product-summary` - Resumo de produto (card)
- `product-info` - Informações do produto
- `product-images` - Imagens do produto

### Elementos de Texto

- `title-[seção]` - Títulos (ex: `title-section`)
- `subtitle-[seção]` - Subtítulos
- `paragraph-[seção]` - Parágrafos
- `rich-text-[nome]` - Textos formatados

### Elementos de Formulário

- `form-[tipo]` - Formulários (ex: `form-newsletter`, `form-contato`)
- `input-[tipo]` - Campos de entrada (ex: `input-email`, `input-search`)
- `button-[ação]` - Botões (ex: `button-submit`, `button-comprar`)

## Convenções Especiais

### Classes CSS

Para adicionar classes CSS a um elemento, use o formato `nome--classe`:

- `banner--destaque` - Banner com classe CSS "destaque"
- `title--large` - Título com classe CSS "large"
- `section--dark` - Seção com classe CSS "dark"

### Responsividade

Para indicar variações responsivas:

- `[elemento]-desktop` - Versão para desktop
- `[elemento]-mobile` - Versão para mobile
- `[elemento]-tablet` - Versão para tablet

## Exemplos Práticos

### Estrutura de Home

home
├── header
├── slider-principal
│   ├── banner-slide-1
│   ├── banner-slide-2
│   └── banner-slide-3
├── section-categorias
│   ├── title-categorias
│   └── flex-categorias
│       ├── categoria-1
│       ├── categoria-2
│       └── categoria-3
├── shelf-lancamentos
├── banner-meio--destaque
├── shelf-ofertas
└── footer


### Estrutura de PDP

pdp
├── header
├── breadcrumb
├── section-produto
│   ├── product-images
│   └── product-info
│       ├── title-produto
│       ├── price
│       └── button-comprar
├── section-descricao
│   ├── title-descricao
│   └── rich-text-descricao
├── shelf-relacionados
└── footer


## Dicas para Conversão Eficiente

1. **Agrupe elementos relacionados**: Mantenha elementos relacionados dentro do mesmo frame ou grupo
2. **Nomeie todas as camadas**: Evite deixar camadas com nomes padrão como "Frame 1"
3. **Use cores e estilos consistentes**: Defina e use estilos de cores e textos consistentes
4. **Mantenha a hierarquia lógica**: A estrutura de camadas deve refletir a estrutura HTML desejada
5. **Teste a conversão**: Use nossa ferramenta para testar a conversão e ajustar conforme necessário

---

Para mais informações ou dúvidas, entre em contato com a equipe de desenvolvimento.