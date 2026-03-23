<template>
  <div class="cover-generator">
    <header class="header">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>CoverGen</span>
      </div>
      <button class="random-btn" @click="loadRandomBingImage" :disabled="loading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        <span>{{ loading ? '加载中...' : '随机Bing图片' }}</span>
      </button>
    </header>

    <main class="main">
      <div class="preview-section">
        <div class="canvas-container" :style="canvasStyle">
          <canvas
            ref="canvasRef"
            :width="canvasWidth"
            :height="canvasHeight"
            @mousedown="startDrag"
            @mousemove="onDrag"
            @mouseup="stopDrag"
            @mouseleave="stopDrag"
          />
        </div>

        <div class="size-presets">
          <button
            v-for="preset in sizePresets"
            :key="preset.name"
            class="preset-btn"
            :class="{ active: currentSize.name === preset.name }"
            @click="setSize(preset)"
          >
            {{ preset.name }}
          </button>
        </div>
      </div>

      <aside class="controls-section">
        <div class="controls-panel">
          <div class="control-group">
            <label>主标题</label>
            <input
              v-model="store.text"
              type="text"
              placeholder="输入主标题"
              @input="drawCanvas"
            />
          </div>

          <div class="control-group">
            <label>副标题</label>
            <input
              v-model="store.subtitle"
              type="text"
              placeholder="输入副标题"
              @input="drawCanvas"
            />
          </div>

          <div class="control-row">
            <div class="control-group">
              <label>文字颜色</label>
              <input
                v-model="store.textColor"
                type="color"
                @input="drawCanvas"
              />
            </div>

            <div class="control-group">
              <label>对齐方式</label>
              <select v-model="store.textAlign" @change="drawCanvas">
                <option value="center">居中</option>
                <option value="left">左对齐</option>
                <option value="right">右对齐</option>
              </select>
            </div>
          </div>

          <div class="control-group">
            <label>遮罩透明度: {{ store.overlayOpacity }}%</label>
            <input
              v-model="store.overlayOpacity"
              type="range"
              min="0"
              max="80"
              @input="drawCanvas"
            />
          </div>

          <div class="control-group">
            <label>模糊度: {{ store.bgBlur }}px</label>
            <input
              v-model="store.bgBlur"
              type="range"
              min="0"
              max="20"
              @input="drawCanvas"
            />
          </div>

          <div class="actions">
            <button class="action-btn primary" @click="downloadImage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              下载封面
            </button>
            <button class="action-btn secondary" @click="resetSettings">
              重置设置
            </button>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCoverStore } from '@/stores/cover'

const store = useCoverStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const bgImage = ref<HTMLImageElement | null>(null)
const loading = ref(false)

const canvasWidth = ref(1200)
const canvasHeight = ref(630)

interface SizePreset {
  name: string
  width: number
  height: number
}

const sizePresets: SizePreset[] = [
  { name: 'YouTube', width: 1280, height: 720 },
  { name: '小红书', width: 1242, height: 1660 },
  { name: '公众号', width: 900, height: 383 },
  { name: 'B站', width: 1146, height: 717 },
  { name: '微博', width: 560, height: 260 }
]
const currentSize = ref<SizePreset>(sizePresets[0])

const canvasStyle = computed(() => ({
  maxWidth: `${canvasWidth.value}px`
}))

const BING_API = 'https://bing.cnortles.top/api'

const loadRandomBingImage = async (): Promise<void> => {
  loading.value = true
  try {
    const randomIndex = Math.floor(Math.random() * 8)
    const response = await fetch(`${BING_API}?format=webp&index=${randomIndex}`)
    if (response.ok) {
      const data = await response.json()
      if (data.url) {
        await loadImage(data.url)
      }
    }
  } catch (error) {
    console.error('Error loading Bing image:', error)
  } finally {
    loading.value = false
  }
}

const loadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      bgImage.value = img
      store.setBgImage(url)
      drawCanvas()
      resolve()
    }
    img.onerror = reject
    img.src = url
  })
}

const drawCanvas = (): void => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const width = canvasWidth.value
  const height = canvasHeight.value

  ctx.clearRect(0, 0, width, height)

  if (bgImage.value) {
    drawBackgroundImage(ctx, bgImage.value, width, height)
  } else {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#667eea')
    gradient.addColorStop(1, '#764ba2')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  if (store.bgBlur > 0) {
    ctx.filter = `blur(${store.bgBlur}px)`
  }

  if (store.overlayOpacity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${store.overlayOpacity / 100})`
    ctx.fillRect(0, 0, width, height)
  }

  ctx.filter = 'none'
  drawTextToCanvas(ctx, width, height)
}

const drawBackgroundImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number): void => {
  const scale = Math.max(width / img.width, height / img.height)
  const x = (width / 2) - (img.width / 2) * scale
  const y = (height / 2) - (img.height / 2) * scale
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
}

const drawTextToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  const padding = 60
  const maxWidth = width - padding * 2

  ctx.textAlign = store.textAlign

  let x: number
  switch (store.textAlign) {
    case 'left':
      x = padding
      break
    case 'right':
      x = width - padding
      break
    default:
      x = width / 2
  }

  if (store.text) {
    ctx.fillStyle = store.textColor
    ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    wrapText(ctx, store.text, x, height / 2 - 30, maxWidth, 80)
  }

  if (store.subtitle) {
    ctx.fillStyle = store.textColor
    ctx.globalAlpha = 0.8
    ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    wrapText(ctx, store.subtitle, x, height / 2 + 70, maxWidth, 40)
    ctx.globalAlpha = 1
  }
}

const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeightPx: number): void => {
  const chars = text.split('')
  let line = ''
  const lines: string[] = []

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      lines.push(line)
      line = chars[i]
    } else {
      line = testLine
    }
  }
  lines.push(line)

  const startY = y - ((lines.length - 1) * lineHeightPx) / 2
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeightPx)
  }
}

const startDrag = (): void => {}
const onDrag = (): void => {}
const stopDrag = (): void => {}

const setSize = (preset: SizePreset): void => {
  currentSize.value = preset
  canvasWidth.value = preset.width
  canvasHeight.value = preset.height
  drawCanvas()
}

const downloadImage = (): void => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const link = document.createElement('a')
  link.download = `cover-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

const resetSettings = (): void => {
  store.resetState()
  bgImage.value = null
  drawCanvas()
}

onMounted(() => {
  loadRandomBingImage()
})
</script>

<style scoped>
.cover-generator {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #0a0a0a;
  border-bottom: 1px solid #1a1a1a;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.logo svg {
  width: 28px;
  height: 28px;
  color: #667eea;
}

.random-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.random-btn:hover {
  background: #2a2a2a;
  border-color: #3a3a3a;
}

.random-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.random-btn svg {
  width: 18px;
  height: 18px;
}

.main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 0;
}

.preview-section {
  background: #0f0f0f;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.canvas-container {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.canvas-container canvas {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.size-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.preset-btn {
  padding: 8px 16px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #2a2a2a;
  color: #fff;
}

.preset-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: #fff;
}

.controls-section {
  background: #0a0a0a;
  border-left: 1px solid #1a1a1a;
  padding: 24px;
  overflow-y: auto;
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-size: 13px;
  font-weight: 500;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.control-group input[type="text"],
.control-group select {
  padding: 10px 12px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
}

.control-group input[type="text"]:focus,
.control-group select:focus {
  outline: none;
  border-color: #667eea;
}

.control-group input[type="color"] {
  width: 100%;
  height: 40px;
  background: none;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  cursor: pointer;
}

.control-group input[type="range"] {
  width: 100%;
  height: 6px;
  background: #1a1a1a;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.control-group input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
}

.control-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #1a1a1a;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn.primary {
  background: #667eea;
  color: #fff;
}

.action-btn.primary:hover {
  background: #5a6fd6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.action-btn.secondary {
  background: #1a1a1a;
  color: #888;
  border: 1px solid #2a2a2a;
}

.action-btn.secondary:hover {
  background: #2a2a2a;
  color: #fff;
}

@media (max-width: 1024px) {
  .main {
    grid-template-columns: 1fr;
  }

  .controls-section {
    border-left: none;
    border-top: 1px solid #1a1a1a;
  }
}

@media (max-width: 640px) {
  .preview-section {
    padding: 20px;
  }

  .header {
    padding: 0 16px;
  }

  .logo span {
    display: none;
  }
}
</style>