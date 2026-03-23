/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_BING_API_URL: string
  readonly VITE_PLATFORM: string
  readonly VITE_APP_ICP_NUMBER: string
  readonly VITE_APP_UPLOAD_API_URL: string
  readonly VITE_APP_FONT_FAMILY: string
  readonly VITE_APP_FONT_CSS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}