import { defineStore } from 'pinia'
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { defaultConfig } from '../config'

export const useCoverStore = defineStore('cover', () => {
  const bgImageUrl: Ref<string | null> = ref(null)
  const bgColor: Ref<string> = ref('#ffffff')
  const bgBlur: Ref<number> = ref(3)

  const squareImageUrl: Ref<string | null> = ref(null)
  const squareSize: Ref<number> = ref(300)
  const rotation: Ref<number> = ref(0)
  const iconColor: Ref<string> = ref('#eeeeee')
  const iconBgSize: Ref<number> = ref(0)

  const shadowColor: Ref<string> = ref('#646464')
  const shadowBlur: Ref<number> = ref(120)
  const shadowOffsetX: Ref<number> = ref(1)
  const shadowOffsetY: Ref<number> = ref(1)
  const shadowStrength: Ref<number> = ref(60)

  const text: Ref<string> = ref(defaultConfig.text)
  const subtitle: Ref<string> = ref('')
  const textColor: Ref<string> = ref('#ffffff')
  const textSize: Ref<number> = ref(200)
  const lineHeight: Ref<number> = ref(1)
  const text3D: Ref<number> = ref(0)
  const selectedFont: Ref<string> = ref(defaultConfig.fontFamily)
  const isFontMenuOpen: Ref<boolean> = ref(false)
  const textAlign: Ref<'center' | 'left' | 'right'> = ref('center')

  const overlayOpacity: Ref<number> = ref(30)

  const watermark: Ref<string> = ref(defaultConfig.watermark)
  const watermarkColor: Ref<string> = ref('#dddddd')

  const hasMultipleLines: ComputedRef<boolean> = computed(() => text.value.includes('\n'))

  // 设置相关状态
  const darkMode: Ref<boolean> = ref(false)
  const defaultFont: Ref<string> = ref(defaultConfig.fontFamily)
  const exportQuality: Ref<number> = ref(0.9)  // 0.1-1.0
  const exportFormat: Ref<'png' | 'jpeg' | 'webp'> = ref('png')
  const uploadApiUrl: Ref<string> = ref(import.meta.env.VITE_APP_UPLOAD_API_URL || '')
  const apiKey: Ref<string> = ref('')
  const themeColor: Ref<string> = ref('#3b82f6')

  function updateText(newText: string): void {
    text.value = newText || defaultConfig.text
  }

  function updateWatermarkText(newWatermark: string): void {
    watermark.value = newWatermark
  }

  function setFont(font: string): void {
    selectedFont.value = font
  }

  function toggleFontMenu(): void {
    isFontMenuOpen.value = !isFontMenuOpen.value
  }

  function setBgImage(url: string): void {
    bgImageUrl.value = url
  }

  function setSquareImage(url: string): void {
    squareImageUrl.value = url
  }

  function setBgColor(color: string): void {
    bgColor.value = color
    bgImageUrl.value = null
  }

  function resetState(): void {
    bgImageUrl.value = null
    bgColor.value = '#ffffff'
    bgBlur.value = 3

    squareImageUrl.value = null
    squareSize.value = 300
    rotation.value = 0
    iconColor.value = '#eeeeee'
    iconBgSize.value = 0

    shadowColor.value = '#646464'
    shadowBlur.value = 120
    shadowOffsetX.value = 1
    shadowOffsetY.value = 1
    shadowStrength.value = 60

    text.value = defaultConfig.text
    subtitle.value = ''
    textColor.value = '#ffffff'
    textSize.value = 200
    lineHeight.value = 1
    text3D.value = 0
    selectedFont.value = defaultConfig.fontFamily
    isFontMenuOpen.value = false
    textAlign.value = 'center'
    overlayOpacity.value = 30

    watermark.value = defaultConfig.watermark
    watermarkColor.value = '#dddddd'
  }

  function toggleDarkMode(): void {
    darkMode.value = !darkMode.value
  }

  function setDefaultFont(font: string): void {
    defaultFont.value = font
  }

  function setExportQuality(quality: number): void {
    exportQuality.value = Math.max(0.1, Math.min(1.0, quality))
  }

  function setExportFormat(format: 'png' | 'jpeg' | 'webp'): void {
    exportFormat.value = format
  }

  function setUploadApiUrl(url: string): void {
    uploadApiUrl.value = url
  }

  function setApiKey(key: string): void {
    apiKey.value = key
  }

  function setThemeColor(color: string): void {
    themeColor.value = color
  }

  function resetSettings(): void {
    darkMode.value = false
    defaultFont.value = defaultConfig.fontFamily
    exportQuality.value = 0.9
    exportFormat.value = 'png'
    uploadApiUrl.value = import.meta.env.VITE_APP_UPLOAD_API_URL || ''
    apiKey.value = ''
    themeColor.value = '#3b82f6'
  }

  function loadSettingsFromStorage(): void {
    try {
      const saved = localStorage.getItem('mini-cover-settings')
      if (saved) {
        const settings = JSON.parse(saved)
        if (typeof settings.darkMode === 'boolean') darkMode.value = settings.darkMode
        if (typeof settings.defaultFont === 'string') defaultFont.value = settings.defaultFont
        if (typeof settings.exportQuality === 'number') exportQuality.value = settings.exportQuality
        if (settings.exportFormat) exportFormat.value = settings.exportFormat
        if (typeof settings.uploadApiUrl === 'string') uploadApiUrl.value = settings.uploadApiUrl
        if (typeof settings.apiKey === 'string') apiKey.value = settings.apiKey
        if (typeof settings.themeColor === 'string') themeColor.value = settings.themeColor
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }

  function saveSettingsToStorage(): void {
    try {
      const settings = {
        darkMode: darkMode.value,
        defaultFont: defaultFont.value,
        exportQuality: exportQuality.value,
        exportFormat: exportFormat.value,
        uploadApiUrl: uploadApiUrl.value,
        apiKey: apiKey.value,
        themeColor: themeColor.value
      }
      localStorage.setItem('mini-cover-settings', JSON.stringify(settings))
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  type CoverFieldName = 
    | 'bgImageUrl' | 'squareImageUrl' | 'bgColor' | 'textColor' | 'watermarkColor'
    | 'iconColor' | 'rotation' | 'shadowColor' | 'shadowBlur' | 'shadowOffsetX'
    | 'shadowOffsetY' | 'shadowStrength' | 'watermark' | 'textSize' | 'lineHeight'
    | 'text3D' | 'squareSize' | 'text' | 'bgBlur' | 'iconBgSize' | 'selectedFont'
    | 'isFontMenuOpen'

  function setField(field: CoverFieldName, value: string | number | boolean): void {
    switch (field) {
      case 'bgImageUrl':
        bgImageUrl.value = value as string
        break
      case 'squareImageUrl':
        squareImageUrl.value = value as string
        break
      case 'bgColor':
        bgColor.value = value as string
        break
      case 'textColor':
        textColor.value = value as string
        break
      case 'watermarkColor':
        watermarkColor.value = value as string
        break
      case 'iconColor':
        iconColor.value = value as string
        break
      case 'rotation':
        rotation.value = value as number
        break
      case 'shadowColor':
        shadowColor.value = value as string
        break
      case 'shadowBlur':
        shadowBlur.value = value as number
        break
      case 'shadowOffsetX':
        shadowOffsetX.value = value as number
        break
      case 'shadowOffsetY':
        shadowOffsetY.value = value as number
        break
      case 'shadowStrength':
        shadowStrength.value = value as number
        break
      case 'watermark':
        watermark.value = value as string
        break
      case 'textSize':
        textSize.value = value as number
        break
      case 'lineHeight':
        lineHeight.value = value as number
        break
      case 'text3D':
        text3D.value = value as number
        break
      case 'squareSize':
        squareSize.value = value as number
        break
      case 'text':
        text.value = (value as string) || defaultConfig.text
        break
      case 'bgBlur':
        bgBlur.value = value as number
        break
      case 'iconBgSize':
        iconBgSize.value = Number(value)
        break
      case 'selectedFont':
        selectedFont.value = value as string
        break
      case 'isFontMenuOpen':
        isFontMenuOpen.value = value as boolean
        break
    }
  }

  return {
    bgImageUrl,
    squareImageUrl,
    bgColor,
    textColor,
    watermarkColor,
    iconColor,
    rotation,
    shadowColor,
    shadowBlur,
    shadowOffsetX,
    shadowOffsetY,
    shadowStrength,
    watermark,
    textSize,
    lineHeight,
    text3D,
    squareSize,
    text,
    subtitle,
    bgBlur,
    iconBgSize,
    selectedFont,
    isFontMenuOpen,
    textAlign,
    overlayOpacity,
    hasMultipleLines,
    // 设置相关
    darkMode,
    defaultFont,
    exportQuality,
    exportFormat,
    uploadApiUrl,
    apiKey,
    themeColor,
    updateText,
    updateWatermarkText,
    setFont,
    toggleFontMenu,
    setBgImage,
    setSquareImage,
    setBgColor,
    resetState,
    setField,
    // 设置相关函数
    toggleDarkMode,
    setDefaultFont,
    setExportQuality,
    setExportFormat,
    setUploadApiUrl,
    setApiKey,
    setThemeColor,
    resetSettings,
    loadSettingsFromStorage,
    saveSettingsToStorage
  }
})