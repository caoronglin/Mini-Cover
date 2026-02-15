/**
 * Cloudflare Workers/Pages Functions 主入口
 * 统一处理所有API请求
 */

import searchHandler from './search.js';

/**
 * 主处理函数
 */
export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // CORS预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCORSHeaders()
    });
  }

  try {
    // 路由分发

    // 搜索API
    if (pathname.startsWith('/api/search') || pathname === '/search') {
      return await searchHandler.fetch(request, env, context);
    }

    // 建议API
    if (pathname.startsWith('/api/suggestions') || pathname === '/suggestions') {
      return await handleSuggestions(request, env);
    }

    // 健康检查
    if (pathname === '/api/health' || pathname === '/health') {
      return jsonResponse({
        status: 'healthy',
        platform: 'cloudflare-workers',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        region: request.cf?.colo || 'unknown',
        country: request.cf?.country || 'unknown'
      });
    }

    // KV存储API
    if (pathname.startsWith('/api/kv/')) {
      return await handleKV(request, env, pathname);
    }

    // 图片处理API
    if (pathname.startsWith('/api/image/')) {
      return await handleImage(request, env, pathname);
    }

    // 封面生成API
    if (pathname.startsWith('/api/cover')) {
      return await handleCover(request, env);
    }

    // 404
    return jsonResponse({
      error: 'Not Found',
      path: pathname,
      available_endpoints: [
        '/api/search',
        '/api/suggestions',
        '/api/health',
        '/api/kv/*',
        '/api/image/*',
        '/api/cover'
      ]
    }, 404);

  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
}

/**
 * 处理建议请求
 */
async function handleSuggestions(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query || query.length < 2) {
    return jsonResponse({ suggestions: [] });
  }

  try {
    // 使用Bing Autosuggest API
    const BING_API_KEY = env.BING_API_KEY;
    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/suggestions?q=${encodeURIComponent(query)}`,
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
 * 处理KV存储请求
 */
async function handleKV(request, env, pathname) {
  const key = pathname.replace('/api/kv/', '');

  if (!key) {
    return jsonResponse({ error: 'Key is required' }, 400);
  }

  switch (request.method) {
    case 'GET':
      try {
        const value = await env.MINI_COVER_KV.get(key, { type: 'json' });
        if (value === null) {
          return jsonResponse({ error: 'Key not found' }, 404);
        }
        return jsonResponse({ key, value });
      } catch (error) {
        return jsonResponse({ error: error.message }, 500);
      }

    case 'PUT':
      try {
        const body = await request.json();
        const { value, ttl } = body;

        if (value === undefined) {
          return jsonResponse({ error: 'Value is required' }, 400);
        }

        await env.MINI_COVER_KV.put(key, JSON.stringify(value), {
          expirationTtl: ttl
        });

        return jsonResponse({ success: true, key });
      } catch (error) {
        return jsonResponse({ error: error.message }, 500);
      }

    case 'DELETE':
      try {
        await env.MINI_COVER_KV.delete(key);
        return jsonResponse({ success: true, key });
      } catch (error) {
        return jsonResponse({ error: error.message }, 500);
      }

    default:
      return jsonResponse({ error: 'Method not allowed' }, 405);
  }
}

/**
 * 处理图片请求
 */
async function handleImage(request, env, pathname) {
  const path = pathname.replace('/api/image/', '');

  // 图片处理逻辑
  return jsonResponse({
    message: 'Image processing endpoint',
    path,
    available_operations: [
      'resize',
      'compress',
      'format',
      'watermark'
    ]
  });
}

/**
 * 处理封面生成请求
 */
async function handleCover(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await request.json();
    // 封面生成逻辑
    return jsonResponse({
      message: 'Cover generation endpoint',
      received_params: Object.keys(body)
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * JSON响应辅助函数
 */
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache',
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
