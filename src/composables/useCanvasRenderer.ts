import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { useCoverStore } from '@/stores/cover'
import { defaultConfig } from '@/config'

const loadedImages = new Map<File, string>()

interface CanvasLayer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

function createCanvas(width: number, height: number): CanvasLayer {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2d context')
  return { canvas, ctx }
}

const bgCanvasLayer = createCanvas(1000, 500)
const textCanvasLayer = createCanvas(1000, 500)
const watermarkCanvasLayer = createCanvas(1000, 500)
const squareCanvasLayer = createCanvas(1000, 500)

let mainCanvas: HTMLCanvasElement | null = null
let mainCtx: CanvasRenderingContext2D | null = null

function loadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (loadedImages.has(file)) {
      resolve(loadedImages.get(file)!)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      loadedImages.set(file, url)
      resolve(url)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getHtmlFontStyles(): { fontFamily: string } {
  const htmlElement = document.documentElement
  const computedStyle = getComputedStyle(htmlElement)
  return { fontFamily: computedStyle.fontFamily }
}

export function drawBackground(): void {
  const store = useCoverStore()
  const { ctx, canvas } = bgCanvasLayer
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (store.bgImageUrl) {
    const img = new Image()
    img.onload = () => {
      const scaleX = canvas.width / img.width
      const scaleY = canvas.height / img.height
      const scale = Math.max(scaleX, scaleY)
      const width = img.width * scale
      const height = img.height * scale
      const x = (canvas.width - width) / 2
      const y = (canvas.height - height) / 2

      ctx.filter = `blur(${store.bgBlur}px)`
      ctx.drawImage(img, x, y, width, height)
      composeCanvases()
    }
    img.src = store.bgImageUrl
  } else {
    ctx.filter = 'none'
    ctx.fillStyle = store.bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    composeCanvases()
  }
}

export function drawText(): void {
  const store = useCoverStore()
  const { ctx, canvas } = textCanvasLayer
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const { fontFamily } = getHtmlFontStyles()
  const font = store.selectedFont ? `${store.selectedFont}, ${fontFamily}` : fontFamily
  ctx.font = `600 ${store.textSize}px ${font}`
  ctx.fillStyle = store.textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (store.text3D > 0) {
    ctx.shadowColor = 'rgba(0, 0, 0, .4)'
    ctx.shadowBlur = store.text3D * 0.5
    ctx.shadowOffsetX = store.text3D
    ctx.shadowOffsetY = store.text3D
  } else {
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  const lines = store.text.split('\n')
  const lineHeightPx = store.textSize * store.lineHeight
  const totalHeight = lineHeightPx * lines.length
  const startY = (canvas.height - totalHeight) / 2 + lineHeightPx / 2

  lines.forEach((line, index) => {
    const y = startY + index * lineHeightPx
    ctx.fillText(line, canvas.width / 2, y)
  })

  composeCanvases()
}

export function drawWatermark(): void {
  const store = useCoverStore()
  const { ctx, canvas } = watermarkCanvasLayer
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const { fontFamily } = getHtmlFontStyles()
  const font = store.selectedFont ? `${store.selectedFont}, ${fontFamily}` : fontFamily
  ctx.font = `italic 14px ${font}`
  ctx.fillStyle = store.watermarkColor
  ctx.textAlign = 'right'
  ctx.fillText(store.watermark, canvas.width - 20, canvas.height - 20)
  composeCanvases()
}

export function drawSquareImage(): void {
  const store = useCoverStore()
  const { ctx, canvas } = squareCanvasLayer
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  if (store.squareImageUrl) {
    const squareImg = new Image()
    squareImg.onload = () => {
      const totalSize = store.squareSize
      const borderWidth = 20
      const size = totalSize - 2 * borderWidth
      const x = (canvas.width - totalSize) / 2
      const y = (canvas.height - totalSize) / 2
      const radius = 30

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = totalSize
      tempCanvas.height = totalSize
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return

      if (store.iconBgSize > 0) {
        const bgPadding = store.iconBgSize
        tempCtx.fillStyle = store.iconColor
        tempCtx.beginPath()
        tempCtx.moveTo(radius + borderWidth - bgPadding, borderWidth - bgPadding)
        tempCtx.arcTo(
          totalSize - borderWidth + bgPadding, 
          borderWidth - bgPadding, 
          totalSize - borderWidth + bgPadding, 
          radius + borderWidth - bgPadding, 
          radius
        )
        tempCtx.arcTo(
          totalSize - borderWidth + bgPadding, 
          totalSize - borderWidth + bgPadding, 
          totalSize - radius - borderWidth + bgPadding, 
          totalSize - borderWidth + bgPadding, 
          radius
        )
        tempCtx.arcTo(
          borderWidth - bgPadding, 
          totalSize - borderWidth + bgPadding, 
          borderWidth - bgPadding, 
          totalSize - radius - borderWidth + bgPadding, 
          radius
        )
        tempCtx.arcTo(
          borderWidth - bgPadding, 
          borderWidth - bgPadding, 
          radius + borderWidth - bgPadding, 
          borderWidth - bgPadding, 
          radius
        )
        tempCtx.closePath()
        tempCtx.fill()
      }

      tempCtx.save()
      tempCtx.beginPath()
      tempCtx.moveTo(radius + borderWidth, borderWidth)
      tempCtx.arcTo(totalSize - borderWidth, borderWidth, totalSize - borderWidth, radius + borderWidth, radius)
      tempCtx.arcTo(totalSize - borderWidth, totalSize - borderWidth, totalSize - radius - borderWidth, totalSize - borderWidth, radius)
      tempCtx.arcTo(borderWidth, totalSize - borderWidth, borderWidth, totalSize - radius - borderWidth, radius)
      tempCtx.arcTo(borderWidth, borderWidth, radius + borderWidth, borderWidth, radius)
      tempCtx.closePath()
      tempCtx.clip()

      const imgAspectRatio = squareImg.width / squareImg.height
      let scaledWidth: number, scaledHeight: number
      if (imgAspectRatio > 1) {
        scaledWidth = size
        scaledHeight = size / imgAspectRatio
      } else {
        scaledWidth = size * imgAspectRatio
        scaledHeight = size
      }

      const offsetX = (size - scaledWidth) / 2
      const offsetY = (size - scaledHeight) / 2

      tempCtx.drawImage(squareImg, borderWidth + offsetX, borderWidth + offsetY, scaledWidth, scaledHeight)
      tempCtx.restore()

      ctx.save()
      ctx.shadowColor = store.shadowColor
      ctx.shadowBlur = store.shadowBlur
      ctx.shadowOffsetX = store.shadowOffsetX
      ctx.shadowOffsetY = store.shadowOffsetY

      ctx.translate(x + totalSize / 2, y + totalSize / 2)
      ctx.rotate(store.rotation * Math.PI / 180)
      ctx.translate(-(x + totalSize / 2), -(y + totalSize / 2))

      ctx.drawImage(tempCanvas, x, y, totalSize, totalSize)
      ctx.restore()

      composeCanvases()
    }
    squareImg.src = store.squareImageUrl
  } else {
    composeCanvases()
  }
}

export function composeCanvases(): void {
  if (mainCtx && mainCanvas) {
    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height)
    mainCtx.drawImage(bgCanvasLayer.canvas, 0, 0)
    mainCtx.drawImage(textCanvasLayer.canvas, 0, 0)
    mainCtx.drawImage(squareCanvasLayer.canvas, 0, 0)
    mainCtx.drawImage(watermarkCanvasLayer.canvas, 0, 0)
  }
}

export function saveWebp(): void {
  if (mainCanvas) {
    mainCanvas.toBlob(blob => {
      if (!blob) return
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'Canvas-Ruom.webp'
      link.click()
      URL.revokeObjectURL(link.href)
    }, 'image/webp')
  }
}

export function initialize(canvasId: string): void {
  mainCanvas = document.getElementById(canvasId) as HTMLCanvasElement | null
  if (mainCanvas) {
    mainCtx = mainCanvas.getContext('2d')
    drawBackground()
    drawText()
    drawWatermark()
  } else {
    console.error('Canvas element not found')
  }
}

export function useCanvasRenderer(canvasId: string = 'canvasPreview') {
  const isInitialized: Ref<boolean> = ref(false)

  const init = (): void => {
    initialize(canvasId)
    isInitialized.value = true
  }

  const updatePreview = (type: string, event: Event): void => {
    const store = useCoverStore()
    const target = event.target as HTMLInputElement
    
    const updateFunctions: Record<string, () => void> = {
      bg: () => {
        const files = (target as HTMLInputElement).files
        if (files?.[0]) {
          loadImage(files[0]).then(url => {
            store.setBgImage(url)
            drawBackground()
          })
        }
      },
      bgColor: () => {
        store.setBgColor(target.value)
        drawBackground()
      },
      textColor: () => {
        store.setField('textColor', target.value)
        drawText()
      },
      watermarkColor: () => {
        store.setField('watermarkColor', target.value)
        drawWatermark()
      },
      square: () => {
        const files = (target as HTMLInputElement).files
        if (files?.[0]) {
          loadImage(files[0]).then(url => {
            store.setSquareImage(url)
            drawSquareImage()
          })
        }
      },
      rotation: () => {
        store.setField('rotation', Number(target.value))
        drawSquareImage()
      },
      text: () => {
        store.updateText(target.value || defaultConfig.text)
        drawText()
      },
      watermark: () => {
        store.updateWatermarkText(target.value)
        drawWatermark()
      },
      textSize: () => {
        store.setField('textSize', Number(target.value))
        drawText()
      },
      squareSize: () => {
        store.setField('squareSize', Number(target.value))
        drawSquareImage()
      },
      bgBlur: () => {
        store.setField('bgBlur', Number(target.value))
        drawBackground()
      },
      iconColor: () => {
        store.setField('iconColor', target.value)
        drawSquareImage()
      },
      iconBgSize: () => {
        store.setField('iconBgSize', Number(target.value))
        drawSquareImage()
      },
      font: () => {
        store.setFont(target.value)
        drawText()
        drawWatermark()
      },
      lineHeight: () => drawText(),
      text3D: () => {
        store.setField('text3D', Number(target.value))
        drawText()
      },
      shadowColor: () => {
        store.setField('shadowColor', target.value)
        drawSquareImage()
      },
      shadowStrength: () => {
        const strength = Number(target.value)
        store.setField('shadowStrength', strength)
        store.setField('shadowBlur', strength * 2)
        store.setField('shadowOffsetX', 0)
        store.setField('shadowOffsetY', 0)
        drawSquareImage()
      }
    }

    const fn = updateFunctions[type]
    if (fn) fn()
  }

  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    mainCanvas = null
    mainCtx = null
    isInitialized.value = false
  })

  return {
    isInitialized,
    init,
    updatePreview,
    drawBackground,
    drawText,
    drawWatermark,
    drawSquareImage,
    composeCanvases,
    saveWebp
  }
}

export default useCanvasRenderer