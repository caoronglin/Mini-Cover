/**
 * 阿里云ESA边缘函数 - 搜索API
 *
 * 文档参考:
 * https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/what-is-functions-and-pages/
 */

// ESA环境变量通过 ESA 全局对象访问
const BING_API_KEY = typeof ESA !== 'undefined' && ESA.env ? ESA.env.BING_API_KEY : '';
const BING_API_ENDPOINT = 'https://api.bing.microsoft.com/v7.0';

/**
 * ESA边缘函数入口
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 * @param {Object} ctx - 执行上下文
 */
export async function onRequest(request, env, ctx) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // CORS处理
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCORSHeaders()
    });
  }

  try {
    // 路由
    if (pathname === '/api/search' || pathname.endsWith('/search')) {
      return await handleSearch(url, ctx);
    }

    if (pathname === '/api/suggestions' || pathname.endsWith('/suggestions')) {
      return await handleSuggestions(url);
    }

    if (pathname === '/api/health' || pathname.endsWith('/health')) {
      return jsonResponse({
        status: 'healthy',
        platform: 'esa',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse({ error: 'Not Found' }, 404);

  } catch (error) {
    console.error('ESA Function Error:', error);
    return jsonResponse({
      error: 'Internal Server Error',
      message: error.message
    }, 500);
  }
}

/**
 * 处理搜索请求
 */
async function handleSearch(url, ctx) {
  const query = url.searchParams.get('q');

  if (!query) {
    return jsonResponse({ error: 'Missing query parameter' }, 400);
  }

  // 构建缓存键
  const cacheKey = new Request(`https://cache/search/${hashString(query + url.search)}`);

  // 尝试从ESA Cache获取
  if (typeof caches !== 'undefined') {
    const cached = await caches.match(cacheKey);
    if (cached) {
      return cached;
    }
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
    }, 200, {
      'Cache-Control': 'public, max-age=3600'
    });

    // 写入ESA Cache
    if (typeof caches !== 'undefined') {
      ctx?.waitUntil?.(
        caches.open('esa-search').then(cache => cache.put(cacheKey, response.clone()))
      );
    }

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
async function handleSuggestions(url) {
  const query = url.searchParams.get('q');

  if (!query || query.length < 2) {
    return jsonResponse({ suggestions: [] });
  }

  try {
    const response = await fetch(
      `${BING_API_ENDPOINT}/suggestions?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': BING_API_KEY,
          'Accept': 'application/json'
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
 * 调用Bing API
 */
async function fetchBingResults(query, type, searchParams) {
  let endpoint;
  const params = new URLSearchParams();
  params.append('q', query);
  params.append('count', searchParams.get('count') || '10');
  params.append('offset', searchParams.get('offset') || '0');
  params.append('mkt', searchParams.get('market') || 'zh-CN');
  params.append('safeSearch', searchParams.get('safeSearch') || 'moderate');

  switch (type) {
    case 'image':
      endpoint = '/images/search';
      break;
    case 'news':
      endpoint = '/news/search';
      break;
    case 'video':
      endpoint = '/videos/search';
      break;
    default:
      endpoint = '/search';
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
    throw new Error(`Bing API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * JSON响应
 */
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCORSHeaders(),
      ...extraHeaders
    }
  });
}

/**
 * CORS头
 */
function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

/**
 * 字符串哈希
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ESA默认导出
export default { onRequest };
