import { generateCover, coverAPI } from './autoGenerate'

interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  message: string
  timestamp: string
}

interface GenerateParams {
  title?: string
  image?: string | null
  style?: string
  watermark?: string
}

interface BatchGenerateParams {
  titles: string[]
  [key: string]: unknown
}

interface ExportParams {
  format?: string
  quality?: number
}

interface ColorScheme {
  id: string
  name: string
  colors: {
    bg: string
    text: string
  }
}

interface TitleAnalysis {
  category: string
  length: number
  hasMultipleLines: boolean
  complexity: Record<string, number>
  recommendedStyle: string
}

const createResponse = <T = unknown>(success: boolean, data: T | null = null, message = ''): ApiResponse<T> => ({
  success,
  data,
  message,
  timestamp: new Date().toISOString()
})

export const apiEndpoints = {
  async generate(params: GenerateParams): Promise<ApiResponse> {
    try {
      const {
        title = '',
        image = null,
        style = 'auto',
        watermark = ''
      } = params

      if (!title) {
        return createResponse(false, null, '标题不能为空')
      }

      const result = await generateCover({
        title,
        image,
        style,
        watermark
      })

      return createResponse(true, result, '封面生成成功')
    } catch (error) {
      console.error('API Error:', error)
      return createResponse(false, null, error instanceof Error ? error.message : '生成失败')
    }
  },

  async batchGenerate(params: BatchGenerateParams): Promise<ApiResponse> {
    try {
      const { titles = [], ...options } = params

      if (!Array.isArray(titles) || titles.length === 0) {
        return createResponse(false, null, '标题列表不能为空')
      }

      const results = await coverAPI.batchGenerate(titles, options)
      return createResponse(true, results, `成功生成 ${results.length} 个封面`)
    } catch (error) {
      console.error('Batch API Error:', error)
      return createResponse(false, null, error instanceof Error ? error.message : '批量生成失败')
    }
  },

  async export(params: ExportParams): Promise<ApiResponse> {
    try {
      const { format = 'webp', quality = 0.9 } = params
      const result = await coverAPI.export(format, quality)
      return createResponse(true, result, '导出成功')
    } catch (error) {
      console.error('Export Error:', error)
      return createResponse(false, null, error instanceof Error ? error.message : '导出失败')
    }
  },

  getColorSchemes(): ApiResponse<ColorScheme[]> {
    const schemes: ColorScheme[] = [
      { id: 'tech', name: '科技蓝', colors: { bg: '#1a1a2e', text: '#ffffff' } },
      { id: 'vibrant', name: '活力橙', colors: { bg: '#ff6b35', text: '#ffffff' } },
      { id: 'fresh', name: '清新绿', colors: { bg: '#10b981', text: '#ffffff' } },
      { id: 'elegant', name: '优雅紫', colors: { bg: '#7c3aed', text: '#ffffff' } },
      { id: 'minimal', name: '极简白', colors: { bg: '#fafafa', text: '#1f2937' } },
      { id: 'dark', name: '暗夜黑', colors: { bg: '#0f0f0f', text: '#f5f5f5' } }
    ]
    return createResponse(true, schemes, '获取配色方案成功')
  },

  analyzeTitle(params: { title?: string }): ApiResponse<TitleAnalysis | null> {
    const { title = '' } = params
    if (!title) {
      return createResponse<TitleAnalysis | null>(false, null, '标题不能为空')
    }

    const keywords: Record<string, string[]> = {
      tech: ['科技', '技术', '编程', '代码', 'AI', '人工智能', '算法'],
      design: ['设计', 'UI', 'UX', '界面', '视觉', '创意'],
      life: ['生活', '日常', '随笔', '感悟', '心情'],
      business: ['商业', '创业', '产品', '运营', '营销']
    }

    const scores: Record<string, number> = {}
    for (const [category, words] of Object.entries(keywords)) {
      scores[category] = words.reduce((score, word) => {
        return score + (title.toLowerCase().includes(word.toLowerCase()) ? 1 : 0)
      }, 0)
    }

    const dominantCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'tech'

    const analysis: TitleAnalysis = {
      category: dominantCategory,
      length: title.length,
      hasMultipleLines: title.includes('\n'),
      complexity: scores,
      recommendedStyle: dominantCategory === 'tech' ? '科技蓝' :
                       dominantCategory === 'design' ? '优雅紫' :
                       dominantCategory === 'life' ? '清新绿' : '活力橙'
    }

    return createResponse(true, analysis, '分析成功')
  }
}

export async function callAPI(endpoint: keyof typeof apiEndpoints, params: Record<string, unknown> = {}): Promise<ApiResponse> {
  const handler = apiEndpoints[endpoint]
  if (!handler) {
    return createResponse(false, null, `未知的 API 端点: ${endpoint}`)
  }

  if (typeof handler === 'function') {
    return await (handler as (params: Record<string, unknown>) => Promise<ApiResponse>)(params)
  }

  return handler as ApiResponse
}

export default { callAPI, apiEndpoints, createResponse }