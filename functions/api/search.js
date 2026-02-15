/**
 * 搜索API - 边缘函数入口
 * 支持: Cloudflare Workers, 阿里云ESA, 腾讯云EO
 */

// Bing API配置
const BING_API_KEY = typeof ENV !== 'undefined' ? ENV.BING_API_KEY : '';
const BING_API_ENDPOINT = 'https://api.bing.microsoft.com/v7.0';
const CACHE_TTL = 3600; // 1小时缓存

/**
 * 处理搜索请求
 */
async function handleSearch(request, env, ctx) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query) {
    return jsonResponse({ error: 'Missing query parameter' }, 400);
  }

  // 构建缓存键
  const cacheKey = new Request(`https://cache/search/${hashCode(query + url.search)}`, request);

  // 尝试从缓存获取
  const cached = await caches.default.match(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // 调用Bing API
    const searchType = url.searchParams.get('type') || 'web';
    const results = await fetchBingResults(query, searchType, url.searchParams);

    const response = jsonResponse({
      success: true,
      query,
      type: searchType,
      results,
      timestamp: new Date().toISOString()
    });

    // 缓存响应
    ctx.waitUntil(
      caches.default.put(cacheKey, response.clone())
    );

    return response;
  } catch (error) {
    console.error('Search error:', error);
    return jsonResponse({
      error: 'Search failed',
      message: error.message
    }, 500);
  }
}

/**
 * 获取搜索建议
 */
async function handleSuggestions(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query || query.length < 2) {
    return jsonResponse({ suggestions: [] });
  }

  try {
    // 调用Bing Autosuggest API
    const response = await fetch(
      `${BING_API_ENDPOINT}/suggestions?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': BING_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Bing API error: ${response.status}`);
    }

    const data = await response.json();
    const suggestions = data.suggestionGroups?.[0]?.searchSuggestions?.map(
      s => s.displayText
    ) || [];

    return jsonResponse({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    return jsonResponse({ suggestions: [] });
  }
}

/**
 * 调用Bing API获取搜索结果
 */
async function fetchBingResults(query, type, searchParams) {
  let endpoint;
  const params = new URLSearchParams();
  params.append('q', query);
  params.append('count', searchParams.get('count') || '10');
  params.append('offset', searchParams.get('offset') || '0');

  // 市场/语言设置
  const market = searchParams.get('market') || 'zh-CN';
  params.append('mkt', market);

  // 安全搜索
  const safeSearch = searchParams.get('safeSearch') || 'moderate';
  params.append('safeSearch', safeSearch);

  switch (type) {
    case 'image':
      endpoint = '/images/search';
      if (searchParams.get('imageType')) {
        params.append('imageType', searchParams.get('imageType'));
      }
      if (searchParams.get('size')) {
        params.append('size', searchParams.get('size'));
      }
      break;
    case 'news':
      endpoint = '/news/search';
      if (searchParams.get('freshness')) {
        params.append('freshness', searchParams.get('freshness'));
      }
      break;
    case 'video':
      endpoint = '/videos/search';
      if (searchParams.get('videoLength')) {
        params.append('videoLength', searchParams.get('videoLength'));
      }
      break;
    default:
      endpoint = '/search';
      // 网页搜索额外参数
      if (searchParams.get('responseFilter')) {
        params.append('responseFilter', searchParams.get('responseFilter'));
      }
  }

  const response = await fetch(
    `${BING_API_ENDPOINT}${endpoint}?${params}`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': BING_API_KEY,
        'Accept': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Bing API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * JSON响应辅助函数
 */
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': status === 200 ? `public, max-age=${CACHE_TTL}` : 'no-cache',
      ...headers
    }
  });
}

/**
 * 计算字符串哈希
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * 主请求处理器
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    try {
      // 路由分发
      if (pathname === '/api/search' || pathname === '/search') {
        return await handleSearch(request, env, ctx);
      }

      if (pathname === '/api/suggestions' || pathname === '/suggestions') {
        return await handleSuggestions(request);
      }

      if (pathname === '/api/health' || pathname === '/health') {
        return jsonResponse({
          status: 'healthy',
          platform: detectEdgePlatform() || 'unknown',
          timestamp: new Date().toISOString()
        });
      }

      // 404
      return jsonResponse({ error: 'Not Found' }, 404);

    } catch (error) {
      console.error('Handler error:', error);
      return jsonResponse({
        error: 'Internal Server Error',
        message: error.message
      }, 500);
    }
  }
};

// 导出所有功能
export {
  handleSearch,
  handleSuggestions,
  jsonResponse,
  hashCode
};
