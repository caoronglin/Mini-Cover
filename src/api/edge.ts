declare const EdgeRuntime: { esa?: boolean; eo?: boolean } | undefined
declare const WebSocketPair: unknown
declare const caches: CacheStorage & { default?: Cache }

export const EdgePlatform = {
  ALIYUN_ESA: 'aliyun-esa',
  TENCENT_EO: 'tencent-eo',
  CLOUDFLARE: 'cloudflare'
} as const

type EdgePlatformType = typeof EdgePlatform[keyof typeof EdgePlatform]

export function detectEdgePlatform(): EdgePlatformType | null {
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.esa) {
    return EdgePlatform.ALIYUN_ESA
  }

  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.eo) {
    return EdgePlatform.TENCENT_EO
  }

  if (typeof WebSocketPair !== 'undefined' ||
      (typeof globalThis !== 'undefined' && (globalThis as { CloudflareWorkers?: boolean }).CloudflareWorkers)) {
    return EdgePlatform.CLOUDFLARE
  }

  return null
}

interface KVStorage {
  get: (key: string, options?: Record<string, unknown>) => Promise<unknown>
  put: (key: string, value: unknown, options?: Record<string, unknown>) => Promise<void>
  delete: (key: string) => Promise<void>
  list?: (options?: Record<string, unknown>) => Promise<{ keys: unknown[] }>
}

export class EdgeStorage {
  private platform: EdgePlatformType | null
  private kv: KVStorage | null = null
  private cache: Cache | null = null

  constructor(platform: EdgePlatformType | null = null) {
    this.platform = platform || detectEdgePlatform()
    this.init()
  }

  private init(): void {
    switch (this.platform) {
      case EdgePlatform.ALIYUN_ESA:
        this.initAliyunESA()
        break
      case EdgePlatform.TENCENT_EO:
        this.initTencentEO()
        break
      case EdgePlatform.CLOUDFLARE:
        this.initCloudflare()
        break
      default:
        this.initBrowserStorage()
    }
  }

  private initAliyunESA(): void {
    const ESA = (globalThis as { ESA?: { KV?: KVStorage } }).ESA
    if (ESA?.KV) {
      this.kv = ESA.KV
    }
    if (typeof caches !== 'undefined') {
      this.cache = caches.default || null
      if (!this.cache) {
        caches.open('mini-cover').then(c => { this.cache = c })
      }
    }
  }

  private initTencentEO(): void {
    const EO = (globalThis as { EO?: { KV?: KVStorage } }).EO
    if (EO?.KV) {
      this.kv = EO.KV
    }
    if (typeof caches !== 'undefined') {
      this.cache = caches.default || null
      if (!this.cache) {
        caches.open('mini-cover').then(c => { this.cache = c })
      }
    }
  }

  private initCloudflare(): void {
    const CF_KV = (globalThis as { CF_KV?: KVStorage }).CF_KV
    if (CF_KV) {
      this.kv = CF_KV
    }
    if (typeof caches !== 'undefined') {
      this.cache = caches.default || null
    }
  }

  private initBrowserStorage(): void {
    this.kv = {
      get: async (key: string) => {
        const value = localStorage.getItem(key)
        return value ? JSON.parse(value) : null
      },
      put: async (key: string, value: unknown) => {
        localStorage.setItem(key, JSON.stringify(value))
      },
      delete: async (key: string) => {
        localStorage.removeItem(key)
      }
    }
  }

  async get(key: string, options: { skipCache?: boolean; cacheTtl?: number } = {}): Promise<unknown> {
    if (!this.kv) return null

    try {
      if (this.cache && !options.skipCache) {
        const cacheKey = new Request(`https://cache/${key}`)
        const cached = await this.cache.match(cacheKey)
        if (cached) {
          return await cached.json()
        }
      }

      const value = await this.kv.get(key, options)

      if (this.cache && value && options.cacheTtl) {
        const cacheKey = new Request(`https://cache/${key}`)
        const response = new Response(JSON.stringify(value), {
          headers: {
            'Cache-Control': `max-age=${options.cacheTtl}`,
            'Content-Type': 'application/json'
          }
        })
        await this.cache.put(cacheKey, response)
      }

      return value
    } catch (error) {
      console.error('EdgeStorage get error:', error)
      return null
    }
  }

  async put(key: string, value: unknown, options: { cacheTtl?: number } = {}): Promise<boolean> {
    if (!this.kv) return false

    try {
      await this.kv.put(key, value, options)

      if (this.cache && options.cacheTtl) {
        const cacheKey = new Request(`https://cache/${key}`)
        const response = new Response(JSON.stringify(value), {
          headers: {
            'Cache-Control': `max-age=${options.cacheTtl}`,
            'Content-Type': 'application/json'
          }
        })
        await this.cache.put(cacheKey, response)
      }

      return true
    } catch (error) {
      console.error('EdgeStorage put error:', error)
      return false
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.kv) return false

    try {
      await this.kv.delete(key)

      if (this.cache) {
        const cacheKey = new Request(`https://cache/${key}`)
        await this.cache.delete(cacheKey)
      }

      return true
    } catch (error) {
      console.error('EdgeStorage delete error:', error)
      return false
    }
  }

  async list(options: Record<string, unknown> = {}): Promise<{ keys: unknown[] }> {
    if (!this.kv?.list) return { keys: [] }

    try {
      return await this.kv.list(options)
    } catch (error) {
      console.error('EdgeStorage list error:', error)
      return { keys: [] }
    }
  }
}

export class EdgeCache {
  private cacheName: string
  private cache: Cache | null = null

  constructor(cacheName = 'mini-cover') {
    this.cacheName = cacheName
  }

  async init(): Promise<void> {
    if (typeof caches !== 'undefined') {
      this.cache = await caches.open(this.cacheName)
    }
  }

  async match(request: RequestInfo, options: CacheQueryOptions = {}): Promise<Response | null> {
    if (!this.cache) return null
    return (await this.cache.match(request, options)) || null
  }

  async put(request: RequestInfo, response: Response): Promise<void> {
    if (!this.cache) return
    await this.cache.put(request, response)
  }

  async delete(request: RequestInfo, options: CacheQueryOptions = {}): Promise<boolean> {
    if (!this.cache) return false
    return await this.cache.delete(request, options)
  }

  async cacheFirst(request: RequestInfo, fetchOptions: RequestInit = {}): Promise<Response> {
    const cached = await this.match(request)
    if (cached) return cached

    const response = await fetch(request, fetchOptions)

    if (response.status === 200) {
      const responseToCache = response.clone()
      await this.put(request, responseToCache)
    }

    return response
  }

  async networkFirst(request: RequestInfo, fetchOptions: RequestInit = {}): Promise<Response> {
    try {
      const networkResponse = await fetch(request, fetchOptions)

      if (networkResponse.status === 200) {
        const responseToCache = networkResponse.clone()
        await this.put(request, responseToCache)
      }

      return networkResponse
    } catch (error) {
      const cached = await this.match(request)
      if (cached) return cached
      throw error
    }
  }
}

export default {
  EdgePlatform,
  detectEdgePlatform,
  EdgeStorage,
  EdgeCache
}