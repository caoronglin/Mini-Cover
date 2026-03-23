import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCoverStore } from './cover'

// Mock import.meta.env for config
vi.stubGlobal('import.meta', {
  env: {
    VITE_APP_FONT_FAMILY: 'HarmonyOS Sans',
    VITE_APP_UPLOAD_API_URL: ''
  }
})

describe('useCoverStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('初始化', () => {
    it('初始化时具有默认值', () => {
      const store = useCoverStore()
      expect(store.bgColor).toBe('#ffffff')
      expect(store.textColor).toBe('#ffffff')
      expect(store.text).toBe('梦爱吃鱼')
      expect(store.watermark).toBe('@梦爱吃鱼')
    })

    it('初始化时背景图片为 null', () => {
      const store = useCoverStore()
      expect(store.bgImageUrl).toBeNull()
      expect(store.squareImageUrl).toBeNull()
    })

    it('初始化时阴影具有默认值', () => {
      const store = useCoverStore()
      expect(store.shadowColor).toBe('#646464')
      expect(store.shadowBlur).toBe(120)
      expect(store.shadowStrength).toBe(60)
    })
  })

  describe('updateText', () => {
    it('正确更新文本', () => {
      const store = useCoverStore()
      store.updateText('新标题')
      expect(store.text).toBe('新标题')
    })

    it('传入空字符串时使用默认文本', () => {
      const store = useCoverStore()
      store.updateText('')
      expect(store.text).toBe('梦爱吃鱼')
    })
  })

  describe('updateWatermarkText', () => {
    it('正确更新水印文本', () => {
      const store = useCoverStore()
      store.updateWatermarkText('@新水印')
      expect(store.watermark).toBe('@新水印')
    })
  })

  describe('setFont', () => {
    it('正确设置字体', () => {
      const store = useCoverStore()
      store.setFont('Microsoft YaHei')
      expect(store.selectedFont).toBe('Microsoft YaHei')
    })
  })

  describe('toggleFontMenu', () => {
    it('切换字体菜单状态', () => {
      const store = useCoverStore()
      expect(store.isFontMenuOpen).toBe(false)
      store.toggleFontMenu()
      expect(store.isFontMenuOpen).toBe(true)
      store.toggleFontMenu()
      expect(store.isFontMenuOpen).toBe(false)
    })
  })

  describe('setBgImage', () => {
    it('设置背景图片 URL', () => {
      const store = useCoverStore()
      store.setBgImage('https://example.com/image.jpg')
      expect(store.bgImageUrl).toBe('https://example.com/image.jpg')
    })
  })

  describe('setSquareImage', () => {
    it('设置方形图片 URL', () => {
      const store = useCoverStore()
      store.setSquareImage('https://example.com/icon.png')
      expect(store.squareImageUrl).toBe('https://example.com/icon.png')
    })
  })

  describe('setBgColor', () => {
    it('设置背景颜色并清除背景图片', () => {
      const store = useCoverStore()
      store.setBgImage('https://example.com/image.jpg')
      store.setBgColor('#ff0000')
      expect(store.bgColor).toBe('#ff0000')
      expect(store.bgImageUrl).toBeNull()
    })
  })

  describe('resetState', () => {
    it('重置所有状态到默认值', () => {
      const store = useCoverStore()
      
      // 修改状态
      store.bgColor = '#ff0000'
      store.text = '修改的文本'
      store.textColor = '#000000'
      store.watermark = '@修改的水印'
      store.shadowBlur = 50
      store.squareSize = 500
      store.rotation = 45
      
      // 重置
      store.resetState()
      
      // 验证重置后的值
      expect(store.bgColor).toBe('#ffffff')
      expect(store.bgImageUrl).toBeNull()
      expect(store.text).toBe('梦爱吃鱼')
      expect(store.textColor).toBe('#ffffff')
      expect(store.watermark).toBe('@梦爱吃鱼')
      expect(store.shadowBlur).toBe(120)
      expect(store.squareSize).toBe(300)
      expect(store.rotation).toBe(0)
    })
  })

  describe('setField', () => {
    it('设置 bgColor 字段', () => {
      const store = useCoverStore()
      store.setField('bgColor', '#00ff00')
      expect(store.bgColor).toBe('#00ff00')
    })

    it('设置 textColor 字段', () => {
      const store = useCoverStore()
      store.setField('textColor', '#ff00ff')
      expect(store.textColor).toBe('#ff00ff')
    })

    it('设置 rotation 字段', () => {
      const store = useCoverStore()
      store.setField('rotation', 90)
      expect(store.rotation).toBe(90)
    })

    it('设置 text 字段', () => {
      const store = useCoverStore()
      store.setField('text', '通过 setField 设置')
      expect(store.text).toBe('通过 setField 设置')
    })

    it('设置 text 为空字符串时使用默认值', () => {
      const store = useCoverStore()
      store.setField('text', '')
      expect(store.text).toBe('梦爱吃鱼')
    })

    it('设置 shadowBlur 字段', () => {
      const store = useCoverStore()
      store.setField('shadowBlur', 80)
      expect(store.shadowBlur).toBe(80)
    })
  })

  describe('设置相关功能', () => {
    it('toggleDarkMode 切换暗色模式', () => {
      const store = useCoverStore()
      expect(store.darkMode).toBe(false)
      store.toggleDarkMode()
      expect(store.darkMode).toBe(true)
    })

    it('setExportQuality 设置导出质量', () => {
      const store = useCoverStore()
      store.setExportQuality(0.5)
      expect(store.exportQuality).toBe(0.5)
    })

    it('setExportQuality 限制最小值为 0.1', () => {
      const store = useCoverStore()
      store.setExportQuality(0.01)
      expect(store.exportQuality).toBe(0.1)
    })

    it('setExportQuality 限制最大值为 1.0', () => {
      const store = useCoverStore()
      store.setExportQuality(2.0)
      expect(store.exportQuality).toBe(1.0)
    })

    it('setExportFormat 设置导出格式', () => {
      const store = useCoverStore()
      store.setExportFormat('jpeg')
      expect(store.exportFormat).toBe('jpeg')
    })

    it('resetSettings 重置设置', () => {
      const store = useCoverStore()
      
      // 修改设置
      store.darkMode = true
      store.exportQuality = 0.5
      store.exportFormat = 'webp'
      store.themeColor = '#ff0000'
      
      // 重置
      store.resetSettings()
      
      expect(store.darkMode).toBe(false)
      expect(store.exportQuality).toBe(0.9)
      expect(store.exportFormat).toBe('png')
      expect(store.themeColor).toBe('#3b82f6')
    })
  })

  describe('computed 属性', () => {
    it('hasMultipleLines 返回 false 当文本没有换行', () => {
      const store = useCoverStore()
      store.updateText('单行文本')
      expect(store.hasMultipleLines).toBe(false)
    })

    it('hasMultipleLines 返回 true 当文本有换行', () => {
      const store = useCoverStore()
      store.updateText('第一行\n第二行')
      expect(store.hasMultipleLines).toBe(true)
    })
  })
})