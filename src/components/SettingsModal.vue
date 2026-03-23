<template>
  <Teleport to="body">
    <div v-if="mounted" 
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <Transition
        appear
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        enter-active-class="transition-opacity duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        leave-active-class="transition-opacity duration-300"
      >
        <div v-show="modelValue"
             class="absolute inset-0 bg-black/60" 
             @click="$emit('update:modelValue', false)"
        ></div>
      </Transition>
      
      <Transition
        appear
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        enter-active-class="transition-all duration-300 transform"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95"
        leave-active-class="transition-all duration-300 transform"
        @after-leave="onAfterLeave"
      >
        <div v-show="modelValue"
             class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg
                    border border-gray-200 dark:border-gray-700 overflow-hidden"
             @click.stop
        >
          <!-- Header -->
          <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">设置</h3>
            <button @click="$emit('update:modelValue', false)"
                    class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-6">
            
            <!-- 外观设置 -->
            <section>
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                </svg>
                外观设置
              </h4>
              <div class="space-y-4 pl-2">
                <!-- 暗色模式 -->
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 dark:text-gray-400">暗色模式</span>
                  <button 
                    @click="toggleDarkMode"
                    class="relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    :class="store.darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                  >
                    <span 
                      class="inline-block w-5 h-5 transform bg-white rounded-full shadow transition-transform duration-200 ease-in-out"
                      :class="store.darkMode ? 'translate-x-6' : 'translate-x-1'"
                    />
                  </button>
                </div>

                <!-- 主题色选择 -->
                <div>
                  <label class="block text-sm text-gray-600 dark:text-gray-400 mb-2">主题色</label>
                  <div class="flex gap-2 flex-wrap">
                    <button 
                      v-for="color in themeColors" 
                      :key="color"
                      @click="setThemeColor(color)"
                      class="w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      :class="store.themeColor === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'"
                      :style="{ backgroundColor: color }"
                    />
                  </div>
                </div>
              </div>
            </section>

            <!-- 字体设置 -->
            <section>
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/>
                </svg>
                字体设置
              </h4>
              <div class="space-y-4 pl-2">
                <!-- 默认字体选择 -->
                <div>
                  <label class="block text-sm text-gray-600 dark:text-gray-400 mb-2">默认字体</label>
                  <select 
                    v-model="selectedFont"
                    @change="saveFont"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option v-for="font in fontOptions" :key="font.value" :value="font.value">
                      {{ font.label }}
                    </option>
                  </select>
                </div>
              </div>
            </section>

            <!-- 导出设置 -->
            <section>
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                导出设置
              </h4>
              <div class="space-y-4 pl-2">
                <!-- 导出格式 -->
                <div>
                  <label class="block text-sm text-gray-600 dark:text-gray-400 mb-2">导出格式</label>
                  <div class="flex gap-2">
                    <button 
                      v-for="format in exportFormats" 
                      :key="format.value"
                      @click="setExportFormat(format.value as 'png' | 'jpeg' | 'webp')"
                      class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      :class="store.exportFormat === format.value ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
                    >
                      {{ format.label }}
                    </button>
                  </div>
                </div>

                <!-- 导出质量 -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-sm text-gray-600 dark:text-gray-400">导出质量</label>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ qualityPercent }}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    v-model.number="qualityPercent"
                    @input="updateQuality"
                    class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>低 ({{ estimateFileSize('low') }})</span>
                    <span>高 ({{ estimateFileSize('high') }})</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- API 配置 -->
            <section>
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                API 配置
              </h4>
              <div class="space-y-4 pl-2">
                <!-- API 地址 -->
                <div>
                  <label class="block text-sm text-gray-600 dark:text-gray-400 mb-2">图床 API 地址</label>
                  <input 
                    type="url"
                    v-model="apiUrl"
                    @blur="saveApiUrl"
                    placeholder="https://example.com/api.php"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <!-- API Key -->
                <div>
                  <label class="block text-sm text-gray-600 dark:text-gray-400 mb-2">API Key <span class="text-gray-400">(可选)</span></label>
                  <input 
                    type="password"
                    v-model="apiKeyValue"
                    @blur="saveApiKey"
                    placeholder="输入 API Key"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <!-- 测试连接 -->
                <button 
                  @click="testConnection"
                  :disabled="!apiUrl || isTesting"
                  class="w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="testResult ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
                >
                  {{ isTesting ? '测试中...' : testResult ? '✓ 连接成功' : '测试连接' }}
                </button>
              </div>
            </section>

            <!-- 重置设置 -->
            <section>
              <button 
                @click="showResetConfirm = true"
                class="w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                重置所有设置
              </button>
            </section>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div class="flex justify-end">
              <button 
                @click="saveAndClose"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                保存并关闭
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>

  <!-- 重置确认对话框 -->
  <Teleport to="body">
    <div v-if="showResetConfirm" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60" @click="showResetConfirm = false"></div>
      <Transition
        appear
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        enter-active-class="transition-all duration-300 transform"
      >
        <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700">
          <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">确认重置</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            此操作将恢复所有设置为默认值，确定要继续吗？
          </p>
          <div class="flex gap-3 justify-end">
            <button 
              @click="showResetConfirm = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              取消
            </button>
            <button 
              @click="confirmReset"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              确认重置
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCoverStore } from '../stores/cover'
import { defaultConfig } from '../config'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const store = useCoverStore()

const mounted = ref(false)
const showResetConfirm = ref(false)
const isTesting = ref(false)
const testResult = ref(false)

// 本地状态
const qualityPercent = ref(Math.round(store.exportQuality * 100))
const apiUrl = ref(store.uploadApiUrl)
const apiKeyValue = ref(store.apiKey)
const selectedFont = ref(store.defaultFont)

// 预设主题色
const themeColors = [
  '#3b82f6', // 蓝色
  '#10b981', // 绿色
  '#f59e0b', // 琥珀色
  '#ef4444', // 红色
  '#8b5cf6', // 紫色
  '#ec4899', // 粉色
]

// 导出格式选项
const exportFormats = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'WEBP', value: 'webp' },
]

// 字体选项
const fontOptions = defaultConfig.fontOptions

watch(() => props.modelValue, (val) => {
  if (val) {
    mounted.value = true
    // 加载本地状态
    qualityPercent.value = Math.round(store.exportQuality * 100)
    apiUrl.value = store.uploadApiUrl
    apiKeyValue.value = store.apiKey
    selectedFont.value = store.defaultFont
  }
})

const onAfterLeave = (): void => {
  mounted.value = false
}

// 切换暗色模式
const toggleDarkMode = (): void => {
  store.toggleDarkMode()
  applyDarkMode()
  store.saveSettingsToStorage()
}

// 应用暗色模式
const applyDarkMode = (): void => {
  if (store.darkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 设置主题色
const setThemeColor = (color: string): void => {
  store.setThemeColor(color)
  store.saveSettingsToStorage()
}

// 保存字体设置
const saveFont = (): void => {
  store.setDefaultFont(selectedFont.value)
  store.saveSettingsToStorage()
}

// 更新导出质量
const updateQuality = (): void => {
  store.setExportQuality(qualityPercent.value / 100)
}

// 设置导出格式
const setExportFormat = (format: 'png' | 'jpeg' | 'webp'): void => {
  store.setExportFormat(format)
  store.saveSettingsToStorage()
}

// 估算文件大小
const estimateFileSize = (level: 'low' | 'high'): string => {
  const baseSize = 800 * 600 * 4 // 假设分辨率
  const quality = level === 'low' ? 0.3 : 0.9
  const size = (baseSize * quality) / 1024
  return `${Math.round(size)} KB`
}

// 保存 API 地址
const saveApiUrl = (): void => {
  store.setUploadApiUrl(apiUrl.value)
  store.saveSettingsToStorage()
}

// 保存 API Key
const saveApiKey = (): void => {
  store.setApiKey(apiKeyValue.value)
  store.saveSettingsToStorage()
}

// 测试连接
const testConnection = async (): Promise<void> => {
  if (!apiUrl.value) return
  
  isTesting.value = true
  testResult.value = false
  
  try {
    // 简单的连通性测试
    const response = await fetch(apiUrl.value, {
      method: 'OPTIONS',
      mode: 'cors',
    })
    
    if (response.ok || response.status === 405) {
      testResult.value = true
    } else {
      testResult.value = false
    }
  } catch (e) {
    testResult.value = false
  } finally {
    isTesting.value = false
  }
}

// 重置所有设置
const confirmReset = (): void => {
  store.resetSettings()
  store.saveSettingsToStorage()
  
  // 更新本地状态
  qualityPercent.value = Math.round(store.exportQuality * 100)
  apiUrl.value = store.uploadApiUrl
  apiKeyValue.value = store.apiKey
  selectedFont.value = store.defaultFont
  
  showResetConfirm.value = false
  applyDarkMode()
}

// 保存并关闭
const saveAndClose = (): void => {
  store.saveSettingsToStorage()
  emit('update:modelValue', false)
}

// 初始化：应用暗色模式
applyDarkMode()
</script>

<style scoped>
/* 自定义滑块样式 */
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease-in-out;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease-in-out;
}

input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.1);
}

/* 暗色模式滚动条 */
.dark ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.dark ::-webkit-scrollbar-track {
  background: #1f2937;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
