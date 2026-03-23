import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    VITE_APP_FONT_FAMILY: 'HarmonyOS Sans',
    VITE_APP_UPLOAD_API_URL: ''
  }
})

// Configure Vue Test Utils
config.global.stubs = {}