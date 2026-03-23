import { defaultConfig } from '../config'

interface ColorScheme {
  name: string
  bg: string
  text: string
  accent: string
  watermark: string
}

interface TitleAnalysis {
  category: string
  length: number
  hasMultipleLines: boolean
  complexity: Record<string, number>
}

interface GenerateOptions {
  title?: string
  image?: string | null
  style?: string
  watermark?: string
}

interface GenerateResult {
  success: boolean
  analysis: TitleAnalysis
  colorScheme: ColorScheme
  settings: {
    title: string
    fontSize: number
    colors: ColorScheme
  }
}

const colorSchemes: ColorScheme[] = [
  { name: '科技蓝', bg: '#1a1a2e', text: '#ffffff', accent: '#16213e', watermark: '#94a3b8' },
  { name: '活力橙', bg: '#ff6b35', text: '#ffffff', accent: '#f7931e', watermark: '#ffd9c4' },
  { name: '清新绿', bg: '#10b981', text: '#ffffff', accent: '#34d399', watermark: '#a7f3d0' },
  { name: '优雅紫', bg: '#7c3aed', text: '#ffffff', accent: '#a78bfa', watermark: '#ddd6fe' },
  { name: '极简白', bg: '#fafafa', text: '#1f2937', accent: '#e5e7eb', watermark: '#9ca3af' },
  { name: '暗夜黑', bg: '#0f0f0f', text: '#f5f5f5', accent: '#262626', watermark: '#737373' },
  { name: '暖阳黄', bg: '#f59e0b', text: '#ffffff', accent: '#fbbf24', watermark: '#fef3c7' },
  { name: '薄荷青', bg: '#14b8a6', text: '#ffffff', accent: '#2dd4bf', watermark: '#ccfbf1' },
  { name: '玫瑰粉', bg: '#ec4899', text: '#ffffff', accent: '#f472b6', watermark: '#fce7f3' },
  { name: '深海蓝', bg: '#0369a1', text: '#ffffff', accent: '#0ea5e9', watermark: '#bae6fd' }
]

function analyzeTitle(title: string): TitleAnalysis {
  const keywords: Record<string, string[]> = {
    tech: ['科技', '技术', '编程', '代码', 'AI', '人工智能', '算法', '数据', '开发', '软件', '前端', '后端', '全栈'],
    design: ['设计', 'UI', 'UX', '界面', '视觉', '创意', '艺术', '美学', '配色', '排版'],
    life: ['生活', '日常', '随笔', '感悟', '心情', '成长', '读书', '旅行', '美食', '摄影'],
    business: ['商业', '创业', '产品', '运营', '营销', '管理', '职场', '投资', '经济', '市场'],
    education: ['学习', '教程', '笔记', '知识', '课程', '教学', '培训', '考试', '认证', '技能']
  }

  const scores: Record<string, number> = {}
  for (const [category, words] of Object.entries(keywords)) {
    scores[category] = words.reduce((score, word) => {
      return score + (title.toLowerCase().includes(word.toLowerCase()) ? 1 : 0)
    }, 0)
  }

  const dominantCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'tech'

  return {
    category: dominantCategory,
    length: title.length,
    hasMultipleLines: title.includes('\n'),
    complexity: scores
  }
}

function selectColorScheme(analysis: TitleAnalysis): ColorScheme {
  const categoryMap: Record<string, number[]> = {
    tech: [0, 9],
    design: [3, 7],
    life: [2, 8],
    business: [1, 4],
    education: [5, 6]
  }

  const indices = categoryMap[analysis.category] || [0]
  const randomIndex = indices[Math.floor(Math.random() * indices.length)]
  return colorSchemes[randomIndex]
}

function calculateOptimalFontSize(title: string, baseSize = 200): number {
  const length = title.length
  if (length <= 4) return baseSize
  if (length <= 8) return baseSize * 0.8
  if (length <= 12) return baseSize * 0.65
  if (length <= 20) return baseSize * 0.5
  return baseSize * 0.4
}

export async function generateCover(options: GenerateOptions = {}): Promise<GenerateResult> {
  const {
    title = defaultConfig.text,
    style = 'auto'
  } = options

  const analysis = analyzeTitle(title)

  const colorScheme = style === 'auto' 
    ? selectColorScheme(analysis) 
    : colorSchemes.find(c => c.name === style) || colorSchemes[0]

  const optimalFontSize = calculateOptimalFontSize(title)

  return {
    success: true,
    analysis,
    colorScheme,
    settings: {
      title,
      fontSize: optimalFontSize,
      colors: colorScheme
    }
  }
}

export const coverAPI = {
  async autoGenerate(title: string, options: Omit<GenerateOptions, 'title'> = {}): Promise<GenerateResult> {
    return generateCover({ title, ...options })
  },

  async generateByTheme(title: string, theme: string, options: Omit<GenerateOptions, 'title' | 'style'> = {}): Promise<GenerateResult> {
    const themeMap: Record<string, ColorScheme> = {
      tech: colorSchemes[0],
      business: colorSchemes[1],
      creative: colorSchemes[3],
      minimal: colorSchemes[4],
      dark: colorSchemes[5]
    }
    const scheme = themeMap[theme] || colorSchemes[0]
    return generateCover({ title, style: scheme.name, ...options })
  },

  async batchGenerate(titles: string[], options: Omit<GenerateOptions, 'title'> = {}): Promise<GenerateResult[]> {
    const results: GenerateResult[] = []
    for (const title of titles) {
      const result = await generateCover({ title, ...options })
      results.push(result)
    }
    return results
  },

  async export(format = 'webp', quality = 0.9): Promise<{ blob: Blob; url: string; size: number; type: string }> {
    const canvas = document.getElementById('canvasPreview') as HTMLCanvasElement | null
    if (!canvas) throw new Error('Canvas not found')

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve({
              blob,
              url: URL.createObjectURL(blob),
              size: blob.size,
              type: blob.type
            })
          } else {
            reject(new Error('Export failed'))
          }
        },
        `image/${format}`,
        quality
      )
    })
  }
}

export default coverAPI