const BING_API_BASE = import.meta.env.VITE_BING_API_URL || 'https://bing.cnortles.top'

export const SearchParams = {
  type: {
    WEB: 'web',
    IMAGE: 'image',
    NEWS: 'news',
    VIDEO: 'video'
  },
  language: {
    ZH: 'zh-CN',
    EN: 'en-US',
    JA: 'ja-JP',
    KO: 'ko-KR'
  },
  safeSearch: {
    OFF: 'off',
    MODERATE: 'moderate',
    STRICT: 'strict'
  }
} as const

interface SearchOptions {
  type?: string
  count?: number
  offset?: number
  language?: string
  safeSearch?: string
  freshness?: string
  site?: string
}

interface SearchResult {
  results?: {
    webPages?: { value: unknown[] }
    images?: { value: unknown[] }
    news?: { value: unknown[] }
    videos?: { value: unknown[] }
    totalEstimatedMatches?: number
    elapsedTime?: number
  }
}

export async function search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
  const {
    type = SearchParams.type.WEB,
    count = 10,
    offset = 0,
    language = SearchParams.language.ZH,
    safeSearch = SearchParams.safeSearch.MODERATE,
    freshness = '',
    site = ''
  } = options

  const params = new URLSearchParams({
    q: query,
    type,
    count: String(count),
    offset: String(offset),
    language,
    safeSearch
  })

  if (freshness) params.append('freshness', freshness)
  if (site) params.append('site', site)

  try {
    const response = await fetch(`${BING_API_BASE}/api/search?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Search failed:', error)
    throw error
  }
}

export async function getSuggestions(query: string): Promise<string[]> {
  if (!query || query.length < 2) return []

  try {
    const response = await fetch(`${BING_API_BASE}/api/suggestions?q=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.suggestions || []
  } catch (error) {
    console.error('Suggestions failed:', error)
    return []
  }
}

export async function searchImages(query: string, options: SearchOptions = {}): Promise<SearchResult> {
  return search(query, { ...options, type: SearchParams.type.IMAGE })
}

export async function searchNews(query: string, options: SearchOptions = {}): Promise<SearchResult> {
  return search(query, { ...options, type: SearchParams.type.NEWS })
}

export async function searchVideos(query: string, options: SearchOptions = {}): Promise<SearchResult> {
  return search(query, { ...options, type: SearchParams.type.VIDEO })
}

export default {
  search,
  getSuggestions,
  searchImages,
  searchNews,
  searchVideos,
  SearchParams
}