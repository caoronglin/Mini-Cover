/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_BING_API_URL: string
  readonly VITE_PLATFORM: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 声明 Vue 单文件组件
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 声明其他模块
declare module '@/api/search.js' {
  export function search(query: string, options?: any): Promise<any>
  export function getSuggestions(query: string): Promise<string[]>
  export const SearchParams: {
    type: { WEB: string; IMAGE: string; NEWS: string; VIDEO: string }
    language: { ZH: string; EN: string; JA: string; KO: string }
    safeSearch: { OFF: string; MODERATE: string; STRICT: string }
  }
}

declare module '@/api/edge.js' {
  export const EdgePlatform: {
    ALIYUN_ESA: string
    TENCENT_EO: string
    CLOUDFLARE: string
  }
  export function detectEdgePlatform(): string | null
  export class EdgeStorage {
    constructor(platform?: string)
    get(key: string, options?: any): Promise<any>
    put(key: string, value: any, options?: any): Promise<boolean>
    delete(key: string): Promise<boolean>
  }
}
