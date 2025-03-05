class VTEXComponentMapper {
  mapComponent(node) {
    switch (node.type) {
      case 'FRAME':
        return this.mapFrame(node)
      case 'TEXT':
        return this.mapText(node)
      case 'RECTANGLE':
        return this.mapRectangle(node)
      case 'GROUP':
        return this.mapGroup(node)
      default:
        return this.mapDefault(node)
    }
  }

  mapFrame(node) {
    if (node.name.toLowerCase().includes('header')) {
      return {
        type: 'header-row',
        props: {
          blockClass: 'main-header',
          sticky: true
        },
        children: ['logo', 'search-bar', 'minicart']
      }
    }

    return {
      type: 'flex-layout.row',
      props: {
        blockClass: node.name.toLowerCase().replace(/\s+/g, '-'),
        preventHorizontalStretch: true,
        fullWidth: true,
        ...this.extractLayoutProps(node)
      }
    }
  }

  mapText(node) {
    return {
      type: 'rich-text',
      props: {
        text: node.characters,
        blockClass: node.name.toLowerCase().replace(/\s+/g, '-'),
        textAlignment: node.style?.textAlignHorizontal?.toLowerCase() || 'left',
        textPosition: 'LEFT',
        ...this.extractTextStyles(node)
      }
    }
  }

  mapRectangle(node) {
    if (node.fills?.[0]?.type === 'IMAGE') {
      return {
        type: 'image',
        props: {
          src: node.fills[0].imageHash,
          blockClass: node.name.toLowerCase().replace(/\s+/g, '-'),
          maxWidth: node.absoluteBoundingBox?.width || 'auto',
          ...this.extractImageProps(node)
        }
      }
    }

    return {
      type: 'flex-layout.col',
      props: {
        blockClass: node.name.toLowerCase().replace(/\s+/g, '-'),
        ...this.extractLayoutProps(node)
      }
    }
  }

  extractLayoutProps(node) {
    return {
      paddingTop: this.convertToRem(node.paddingTop),
      paddingBottom: this.convertToRem(node.paddingBottom),
      paddingLeft: this.convertToRem(node.paddingLeft),
      paddingRight: this.convertToRem(node.paddingRight),
      backgroundColor: this.convertColor(node.fills?.[0]?.color)
    }
  }

  extractTextStyles(node) {
    return {
      font: node.style?.fontFamily,
      fontSize: this.convertToRem(node.style?.fontSize),
      fontWeight: node.style?.fontWeight,
      color: this.convertColor(node.fills?.[0]?.color)
    }
  }

  extractImageProps(node) {
    return {
      width: node.absoluteBoundingBox?.width,
      height: node.absoluteBoundingBox?.height,
      alt: node.name
    }
  }

  convertToRem(value) {
    return value ? `${value / 16}rem` : undefined
  }

  convertColor(color) {
    if (!color) return undefined
    const { r, g, b, a } = color
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
  }

  mapDefault(node) {
    return {
      type: 'flex-layout.row',
      props: {
        blockClass: node.name?.toLowerCase().replace(/\s+/g, '-') || 'default-block',
        preventHorizontalStretch: true,
        ...this.extractLayoutProps(node)
      }
    }
  }

  mapGroup(node) {
    return {
      type: 'flex-layout.col',
      props: {
        blockClass: node.name?.toLowerCase().replace(/\s+/g, '-') || 'group-block',
        preventVerticalStretch: true,
        ...this.extractLayoutProps(node)
      }
    }
  }

  generateBlockStyles(props) {
    const styles = {}
    
    if (props.backgroundColor) styles.backgroundColor = props.backgroundColor
    if (props.paddingTop) styles.paddingTop = props.paddingTop
    if (props.paddingBottom) styles.paddingBottom = props.paddingBottom
    if (props.paddingLeft) styles.paddingLeft = props.paddingLeft
    if (props.paddingRight) styles.paddingRight = props.paddingRight
    if (props.fontSize) styles.fontSize = props.fontSize
    if (props.fontWeight) styles.fontWeight = props.fontWeight
    if (props.color) styles.color = props.color

    return styles
  }
}

module.exports = { VTEXComponentMapper }