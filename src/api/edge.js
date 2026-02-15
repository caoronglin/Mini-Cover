/**
 * 边缘计算平台API封装
 * 支持阿里云ESA、腾讯云EO、Cloudflare Workers
 */

/**
 * 边缘平台类型
 */
export const EdgePlatform = {
  ALIYUN_ESA: 'aliyun-esa',
  TENCENT_EO: 'tencent-eo',
  CLOUDFLARE: 'cloudflare'
};

/**
 * 获取当前运行的边缘平台
 * @returns {string|null}
 */
export function detectEdgePlatform() {
  // 阿里云ESA环境变量
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.esa) {
    return EdgePlatform.ALIYUN_ESA;
  }

  // 腾讯云EO环境变量
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.eo) {
    return EdgePlatform.TENCENT_EO;
  }

  // Cloudflare Workers
  if (typeof WebSocketPair !== 'undefined' ||
      (typeof globalThis !== 'undefined' && globalThis.CloudflareWorkers)) {
    return EdgePlatform.CLOUDFLARE;
  }

  return null;
}

/**
 * 边缘存储/KV操作封装
 */
export class EdgeStorage {
  constructor(platform = null) {
    this.platform = platform || detectEdgePlatform();
    this.kv = null;
    this.cache = null;
    this.init();
  }

  init() {
    switch (this.platform) {
      case EdgePlatform.ALIYUN_ESA:
        this.initAliyunESA();
        break;
      case EdgePlatform.TENCENT_EO:
        this.initTencentEO();
        break;
      case EdgePlatform.CLOUDFLARE:
        this.initCloudflare();
        break;
      default:
        // 浏览器本地存储作为fallback
        this.initBrowserStorage();
    }
  }

  initAliyunESA() {
    // 阿里云ESA KV存储
    if (typeof ESA !== 'undefined' && ESA.KV) {
      this.kv = ESA.KV;
    }
    // 阿里云ESA Cache API
    if (typeof caches !== 'undefined') {
      this.cache = caches.default || caches.open('mini-cover');
    }
  }

  initTencentEO() {
    // 腾讯云EO边缘存储
    if (typeof EO !== 'undefined' && EO.KV) {
      this.kv = EO.KV;
    }
    // EO Cache API
    if (typeof caches !== 'undefined') {
      this.cache = caches.default || caches.open('mini-cover');
    }
  }

  initCloudflare() {
    // Cloudflare Workers KV
    if (typeof CF_KV !== 'undefined') {
      this.kv = CF_KV;
    }
    // Cloudflare Cache API
    if (typeof caches !== 'undefined') {
      this.cache = caches.default;
    }
  }

  initBrowserStorage() {
    // 浏览器环境使用localStorage作为fallback
    this.kv = {
      get: async (key) => {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      },
      put: async (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      delete: async (key) => {
        localStorage.removeItem(key);
      }
    };
  }

  /**
   * 获取KV值
   */
  async get(key, options = {}) {
    if (!this.kv) return null;

    try {
      // 先检查缓存
      if (this.cache && !options.skipCache) {
        const cacheKey = new Request(`https://cache/${key}`);
        const cached = await this.cache.match(cacheKey);
        if (cached) {
          return await cached.json();
        }
      }

      // 从KV获取
      const value = await this.kv.get(key, options);

      // 写入缓存
      if (this.cache && value && options.cacheTtl) {
        const cacheKey = new Request(`https://cache/${key}`);
        const response = new Response(JSON.stringify(value), {
          headers: {
            'Cache-Control': `max-age=${options.cacheTtl}`,
            'Content-Type': 'application/json'
          }
        });
        await this.cache.put(cacheKey, response);
      }

      return value;
    } catch (error) {
      console.error('EdgeStorage get error:', error);
      return null;
    }
  }

  /**
   * 设置KV值
   */
  async put(key, value, options = {}) {
    if (!this.kv) return false;

    try {
      await this.kv.put(key, value, options);

      // 更新缓存
      if (this.cache && options.cacheTtl) {
        const cacheKey = new Request(`https://cache/${key}`);
        const response = new Response(JSON.stringify(value), {
          headers: {
            'Cache-Control': `max-age=${options.cacheTtl}`,
            'Content-Type': 'application/json'
          }
        });
        await this.cache.put(cacheKey, response);
      }

      return true;
    } catch (error) {
      console.error('EdgeStorage put error:', error);
      return false;
    }
  }

  /**
   * 删除KV值
   */
  async delete(key) {
    if (!this.kv) return false;

    try {
      await this.kv.delete(key);

      // 清除缓存
      if (this.cache) {
        const cacheKey = new Request(`https://cache/${key}`);
        await this.cache.delete(cacheKey);
      }

      return true;
    } catch (error) {
      console.error('EdgeStorage delete error:', error);
      return false;
    }
  }

  /**
   * 列表查询（如果平台支持）
   */
  async list(options = {}) {
    if (!this.kv || !this.kv.list) return { keys: [] };

    try {
      return await this.kv.list(options);
    } catch (error) {
      console.error('EdgeStorage list error:', error);
      return { keys: [] };
    }
  }
}

/**
 * 边缘AI服务封装
 */
export class EdgeAI {
  constructor(platform = null) {
    this.platform = platform || detectEdgePlatform();
    this.models = new Map();
  }

  /**
   * 调用边缘AI模型
   */
  async run(model, input, options = {}) {
    switch (this.platform) {
      case EdgePlatform.ALIYUN_ESA:
        return this.runAliyunAI(model, input, options);
      case EdgePlatform.TENCENT_EO:
        return this.runTencentAI(model, input, options);
      case EdgePlatform.CLOUDFLARE:
        return this.runCloudflareAI(model, input, options);
      default:
        throw new Error('No AI runtime available');
    }
  }

  async runAliyunAI(model, input, options) {
    // 阿里云ESA AI调用
    if (typeof ESA !== 'undefined' && ESA.AI) {
      return await ESA.AI.run(model, input, options);
    }
    throw new Error('ESA AI not available');
  }

  async runTencentAI(model, input, options) {
    // 腾讯云EO AI调用
    if (typeof EO !== 'undefined' && EO.AI) {
      return await EO.AI.run(model, input, options);
    }
    throw new Error('EO AI not available');
  }

  async runCloudflareAI(model, input, options) {
    // Cloudflare AI调用
    if (typeof ai !== 'undefined') {
      return await ai.run(model, input, options);
    }
    throw new Error('Cloudflare AI not available');
  }
}

/**
 * 边缘缓存工具
 */
export class EdgeCache {
  constructor(cacheName = 'mini-cover') {
    this.cacheName = cacheName;
    this.cache = null;
  }

  async init() {
    if (typeof caches !== 'undefined') {
      this.cache = await caches.open(this.cacheName);
    }
  }

  /**
   * 缓存匹配
   */
  async match(request, options = {}) {
    if (!this.cache) return null;
    return await this.cache.match(request, options);
  }

  /**
   * 添加缓存
   */
  async put(request, response) {
    if (!this.cache) return;
    await this.cache.put(request, response);
  }

  /**
   * 删除缓存
   */
  async delete(request, options = {}) {
    if (!this.cache) return false;
    return await this.cache.delete(request, options);
  }

  /**
   * 缓存并返回响应
   */
  async cacheFirst(request, fetchOptions = {}, cacheOptions = {}) {
    // 尝试从缓存获取
    const cached = await this.match(request);
    if (cached) {
      return cached;
    }

    // 获取网络响应
    const response = await fetch(request, fetchOptions);

    // 只缓存成功响应
    if (response.status === 200) {
      const responseToCache = response.clone();
      await this.put(request, responseToCache);
    }

    return response;
  }

  /**
   * 网络优先，失败时回退缓存
   */
  async networkFirst(request, fetchOptions = {}) {
    try {
      const networkResponse = await fetch(request, fetchOptions);

      // 更新缓存
      if (networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        await this.put(request, responseToCache);
      }

      return networkResponse;
    } catch (error) {
      // 网络失败，尝试缓存
      const cached = await this.match(request);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }
}

// 默认导出
export default {
  EdgePlatform,
  detectEdgePlatform,
  EdgeStorage,
  EdgeAI,
  EdgeCache
};
