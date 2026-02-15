/**
 * Bing Search API Integration
 * 集成 bing.cnortles.top 搜索服务
 */

const BING_API_BASE = import.meta.env.VITE_BING_API_URL || 'https://bing.cnortles.top';

/**
 * 搜索参数配置
 */
export const SearchParams = {
  // 搜索类型
  type: {
    WEB: 'web',
    IMAGE: 'image',
    NEWS: 'news',
    VIDEO: 'video'
  },
  // 语言
  language: {
    ZH: 'zh-CN',
    EN: 'en-US',
    JA: 'ja-JP',
    KO: 'ko-KR'
  },
  // 安全搜索
  safeSearch: {
    OFF: 'off',
    MODERATE: 'moderate',
    STRICT: 'strict'
  }
};

/**
 * 执行搜索请求
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Promise<Object>} 搜索结果
 */
export async function search(query, options = {}) {
  const {
    type = SearchParams.type.WEB,
    count = 10,
    offset = 0,
    language = SearchParams.language.ZH,
    safeSearch = SearchParams.safeSearch.MODERATE,
    freshness = '', // day, week, month
    site = ''
  } = options;

  const params = new URLSearchParams({
    q: query,
    type,
    count: String(count),
    offset: String(offset),
    language,
    safeSearch
  });

  if (freshness) params.append('freshness', freshness);
  if (site) params.append('site', site);

  try {
    const response = await fetch(`${BING_API_BASE}/api/search?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

/**
 * 自动建议/补全
 * @param {string} query - 部分输入
 * @returns {Promise<string[]>} 建议列表
 */
export async function getSuggestions(query) {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(`${BING_API_BASE}/api/suggestions?q=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Suggestions failed:', error);
    return [];
  }
}

/**
 * 图片搜索
 * @param {string} query - 搜索关键词
 * @param {Object} options - 选项
 */
export async function searchImages(query, options = {}) {
  return search(query, { ...options, type: SearchParams.type.IMAGE });
}

/**
 * 新闻搜索
 * @param {string} query - 搜索关键词
 * @param {Object} options - 选项
 */
export async function searchNews(query, options = {}) {
  return search(query, { ...options, type: SearchParams.type.NEWS });
}

/**
 * 视频搜索
 * @param {string} query - 搜索关键词
 * @param {Object} options - 选项
 */
export async function searchVideos(query, options = {}) {
  return search(query, { ...options, type: SearchParams.type.VIDEO });
}

export default {
  search,
  getSuggestions,
  searchImages,
  searchNews,
  searchVideos,
  SearchParams
};
