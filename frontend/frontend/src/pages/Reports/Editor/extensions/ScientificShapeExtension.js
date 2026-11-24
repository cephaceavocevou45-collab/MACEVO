import { Node, mergeAttributes } from '@tiptap/core'

export const ScientificShapeExtension = Node.create({
  name: 'scientificShape',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      shapeType: {
        default: 'rectangle',
        parseHTML: element => element.getAttribute('data-shape-type') || 'rectangle',
        renderHTML: attributes => ({ 'data-shape-type': attributes.shapeType }),
      },
      htmlContent: {
        default: '',
        parseHTML: element => element.innerHTML,
        renderHTML: attributes => ({}),
      },
      x: {
        default: 100,
        parseHTML: element => parseInt(element.getAttribute('data-x') || 100, 10),
        renderHTML: attributes => ({ 'data-x': attributes.x }),
      },
      y: {
        default: 100,
        parseHTML: element => parseInt(element.getAttribute('data-y') || 100, 10),
        renderHTML: attributes => ({ 'data-y': attributes.y }),
      },
      width: {
        default: 180,
        parseHTML: element => parseInt(element.getAttribute('data-width') || 180, 10),
        renderHTML: attributes => ({ 'data-width': attributes.width }),
      },
      height: {
        default: 120,
        parseHTML: element => parseInt(element.getAttribute('data-height') || 120, 10),
        renderHTML: attributes => ({ 'data-height': attributes.height }),
      },
      backgroundColor: {
        default: '#ffffff',
        parseHTML: element => element.getAttribute('data-bg-color') || '#ffffff',
        renderHTML: attributes => ({ 'data-bg-color': attributes.backgroundColor }),
      },
      borderColor: {
        default: '#1e293b',
        parseHTML: element => element.getAttribute('data-border-color') || '#1e293b',
        renderHTML: attributes => ({ 'data-border-color': attributes.borderColor }),
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="scientific-shape"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const x = node.attrs.x ?? 100;
    const y = node.attrs.y ?? 100;
    const width = node.attrs.width ?? 180;
    const height = node.attrs.height ?? 120;

    return [
      'div',
      mergeAttributes({ 
        'data-type': 'scientific-shape', 
        style: `position: absolute; left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; cursor: move; user-select: none; z-index: 50;` 
      }, HTMLAttributes),
      0,
    ]
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div')
      dom.setAttribute('data-type', 'scientific-shape')
      
      const formatVisualContent = (rawHtml) => {
        if (!rawHtml) return '';

        let cleaned = rawHtml
          .replace(/\\textbackslash\{\}/g, '\\')
          .replace(/^\s*\$(.*?)\$\s*$/, '$1');

        cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
          return `
            <span style="display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; margin: 0 4px; font-size: 0.95em;">
              <span style="border-bottom: 1.5px solid currentColor; padding-bottom: 1px; padding-left: 2px; padding-right: 2px;">${num}</span>
              <span style="padding-top: 1px; padding-left: 2px; padding-right: 2px;">${den}</span>
            </span>
          `;
        });

        return cleaned;
      };

      const updateStyleAndSize = () => {
        dom.style.position = 'absolute'
        dom.style.left = `${node.attrs.x ?? 100}px`
        dom.style.top = `${node.attrs.y ?? 100}px`
        dom.style.width = `${node.attrs.width ?? 180}px`
        dom.style.height = `${node.attrs.height ?? 120}px`

        const shapeType = node.attrs.shapeType || 'rectangle'
        const bg = node.attrs.backgroundColor || '#ffffff'
        const border = node.attrs.borderColor || '#1e293b'

        contentWrapper.style.backgroundColor = bg
        contentWrapper.style.borderColor = border
        contentWrapper.style.borderWidth = '2px'
        contentWrapper.style.borderStyle = 'solid'
        contentWrapper.style.clipPath = 'none'
        contentWrapper.style.borderRadius = '0px'

        switch (shapeType) {
          case 'ellipse':
            contentWrapper.style.borderRadius = '50%'
            break
          case 'rectangle_rounded':
          case 'boite_flux':
            contentWrapper.style.borderRadius = '12px'
            break
          case 'triangle':
            contentWrapper.style.border = 'none'
            contentWrapper.style.backgroundColor = 'transparent'
            contentWrapper.innerHTML = `
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute; top:0; left:0;">
                <polygon points="50,0 100,100 0,100" fill="${bg}" stroke="${border}" stroke-width="4"/>
              </svg>
              <div style="position:relative; z-index:2; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">${formatVisualContent(node.attrs.htmlContent)}</div>
            `
            return
          case 'losange':
            contentWrapper.style.border = 'none'
            contentWrapper.style.backgroundColor = 'transparent'
            contentWrapper.innerHTML = `
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute; top:0; left:0;">
                <polygon points="50,0 100,50 50,100 0,50" fill="${bg}" stroke="${border}" stroke-width="4"/>
              </svg>
              <div style="position:relative; z-index:2; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">${formatVisualContent(node.attrs.htmlContent)}</div>
            `
            return
          case 'pentagone':
            contentWrapper.style.clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'
            break
          case 'hexagone':
            contentWrapper.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
            break
          case 'cylindre':
            contentWrapper.style.borderRadius = '20px / 10px'
            break
          case 'ligne':
            contentWrapper.style.border = 'none'
            contentWrapper.style.backgroundColor = 'transparent'
            contentWrapper.innerHTML = `
              <svg width="100%" height="100%" preserveAspectRatio="none" style="position:absolute; top:0; left:0;">
                <line x1="0" y1="100%" x2="100%" y2="0" stroke="${border}" stroke-width="4"/>
              </svg>
            `
            return
          case 'fleche_droite':
            contentWrapper.style.border = 'none'
            contentWrapper.style.backgroundColor = 'transparent'
            contentWrapper.innerHTML = `
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute; top:0; left:0;">
                <line x1="0" y1="50" x2="85" y2="50" stroke="${border}" stroke-width="6"/>
                <polygon points="80,30 100,50 80,70" fill="${border}"/>
              </svg>
            `
            return
          default:
            break
        }

        if (node.attrs.htmlContent) {
          contentWrapper.innerHTML = formatVisualContent(node.attrs.htmlContent)
        }
      }

      const contentWrapper = document.createElement('div')
      contentWrapper.style.width = '100%'
      contentWrapper.style.height = '100%'
      contentWrapper.style.boxSizing = 'border-box'
      contentWrapper.style.display = 'flex'
      contentWrapper.style.alignItems = 'center'
      contentWrapper.style.justifyContent = 'center'
      contentWrapper.style.color = '#1e293b'
      contentWrapper.style.fontSize = '12px'
      contentWrapper.style.fontWeight = '500'
      dom.appendChild(contentWrapper)

      updateStyleAndSize()

      let isSelected = false
      let toolbar = null
      let handlesContainer = null

      let isDragging = false
      let startX = 0
      let startY = 0

      dom.addEventListener('mousedown', (e) => {
        if (e.target.closest('.shape-handle') || e.target.closest('.shape-floating-toolbar')) return

        isDragging = true
        startX = e.clientX - (node.attrs.x ?? 100)
        startY = e.clientY - (node.attrs.y ?? 100)
        
        selectShape()
        e.stopPropagation()
      })

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return
        const newX = e.clientX - startX
        const newY = e.clientY - startY

        dom.style.left = `${newX}px`
        dom.style.top = `${newY}px`
      })

      window.addEventListener('mouseup', () => {
        if (!isDragging) return
        isDragging = false

        const finalX = parseInt(dom.style.left, 10)
        const finalY = parseInt(dom.style.top, 10)

        const pos = getPos()
        if (typeof pos === 'number' && editor) {
          editor.chain().setNodeSelection(pos).updateAttributes('scientificShape', { x: finalX, y: finalY }).run()
        }
      })

      const selectShape = () => {
        if (isSelected) return
        isSelected = true

        contentWrapper.style.boxShadow = '0 0 0 2px #ffffff, 0 0 0 4px #2563eb'

        toolbar = document.createElement('div')
        toolbar.className = 'shape-floating-toolbar'
        toolbar.style.position = 'absolute'
        toolbar.style.top = '-35px'
        toolbar.style.left = '0'
        toolbar.style.background = '#0f172a'
        toolbar.style.color = '#fff'
        toolbar.style.padding = '3px 8px'
        toolbar.style.borderRadius = '4px'
        toolbar.style.display = 'flex'
        toolbar.style.gap = '8px'
        toolbar.style.alignItems = 'center'
        toolbar.style.zIndex = '100'
        toolbar.style.fontSize = '11px'
        toolbar.style.whiteSpace = 'nowrap'
        toolbar.innerHTML = `
          <span>Forme : <b>${node.attrs.shapeType}</b></span>
          <button type="button" data-action="delete" style="background:none; border:none; color:#f87171; cursor:pointer; font-weight:bold;">✕ Supprimer</button>
        `
        toolbar.addEventListener('click', (e) => {
          e.stopPropagation()
          if (e.target.getAttribute('data-action') === 'delete') {
            const pos = getPos()
            if (typeof pos === 'number') {
              editor.chain().setNodeSelection(pos).deleteSelection().run()
            }
          }
        })
        dom.appendChild(toolbar)

        handlesContainer = document.createElement('div')
        handlesContainer.className = 'shape-handles-container'
        
        const positions = [
          { cursor: 'nwse-resize', top: '-4px', left: '-4px', dir: 'nw' },
          { cursor: 'ns-resize', top: '-4px', left: '50%', transform: 'translateX(-50%)', dir: 'n' },
          { cursor: 'nesw-resize', top: '-4px', right: '-4px', dir: 'ne' },
          { cursor: 'ew-resize', top: '50%', right: '-4px', transform: 'translateY(-50%)', dir: 'e' },
          { cursor: 'nwse-resize', bottom: '-4px', right: '-4px', dir: 'se' },
          { cursor: 'ns-resize', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', dir: 's' },
          { cursor: 'nesw-resize', bottom: '-4px', left: '-4px', dir: 'sw' },
          { cursor: 'ew-resize', top: '50%', left: '-4px', transform: 'translateY(-50%)', dir: 'w' },
        ]

        positions.forEach(p => {
          const handle = document.createElement('div')
          handle.className = 'shape-handle'
          handle.style.position = 'absolute'
          handle.style.width = '8px'
          handle.style.height = '8px'
          handle.style.backgroundColor = '#ffffff'
          handle.style.border = '1.5px solid #2563eb'
          handle.style.zIndex = '101'
          handle.style.cursor = p.cursor
          if (p.top) handle.style.top = p.top
          if (p.bottom) handle.style.bottom = p.bottom
          if (p.left) handle.style.left = p.left
          if (p.right) handle.style.right = p.right
          if (p.transform) handle.style.transform = p.transform

          handle.addEventListener('mousedown', (e) => {
            e.stopPropagation()
            e.preventDefault()

            const startMouseX = e.clientX
            const startMouseY = e.clientY
            const startWidth = node.attrs.width ?? 180
            const startHeight = node.attrs.height ?? 120
            const startPosX = node.attrs.x ?? 100
            const startPosY = node.attrs.y ?? 100

            const onMouseMove = (moveEvent) => {
              const dx = moveEvent.clientX - startMouseX
              const dy = moveEvent.clientY - startMouseY
              let newW = startWidth
              let newH = startHeight
              let newX = startPosX
              let newY = startPosY

              if (p.dir.includes('e')) newW = Math.max(30, startWidth + dx)
              if (p.dir.includes('s')) newH = Math.max(30, startHeight + dy)
              if (p.dir.includes('w')) {
                newW = Math.max(30, startWidth - dx)
                newX = startPosX + (startWidth - newW)
              }
              if (p.dir.includes('n')) {
                newH = Math.max(30, startHeight - dy)
                newY = startPosY + (startHeight - newH)
              }

              dom.style.width = `${newW}px`
              dom.style.height = `${newH}px`
              dom.style.left = `${newX}px`
              dom.style.top = `${newY}px`
            }

            const onMouseUp = () => {
              window.removeEventListener('mousemove', onMouseMove)
              window.removeEventListener('mouseup', onMouseUp)

              const finalW = parseInt(dom.style.width, 10)
              const finalH = parseInt(dom.style.height, 10)
              const finalX = parseInt(dom.style.left, 10)
              const finalY = parseInt(dom.style.top, 10)

              const pos = getPos()
              if (typeof pos === 'number' && editor) {
                editor.chain().setNodeSelection(pos).updateAttributes('scientificShape', {
                  width: finalW,
                  height: finalH,
                  x: finalX,
                  y: finalY
                }).run()
              }
            }

            window.addEventListener('mousemove', onMouseMove)
            window.addEventListener('mouseup', onMouseUp)
          })

          handlesContainer.appendChild(handle)
        })

        dom.appendChild(handlesContainer)
      }

      const deselectShape = () => {
        if (!isSelected) return
        isSelected = false
        contentWrapper.style.boxShadow = 'none'
        if (toolbar) { toolbar.remove(); toolbar = null; }
        if (handlesContainer) { handlesContainer.remove(); handlesContainer = null; }
      }

      document.addEventListener('click', (e) => {
        if (!dom.contains(e.target)) {
          deselectShape()
        }
      })

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== 'scientificShape') return false
          node = updatedNode
          updateStyleAndSize()
          return true
        },
        destroy() {
          deselectShape()
        }
      }
    }
  },
})