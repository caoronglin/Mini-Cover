<template>
  <div class="search-interface">
    <div class="search-header">
      <div class="logo">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        <span class="logo-text">MiniSearch</span>
      </div>
      <div class="search-stats" v-if="lastSearch">
        上次搜索: {{ formatTime(lastSearch) }}
      </div>
    </div>

    <div class="search-container">
      <div class="search-box" :class="{ 'has-suggestions': suggestions.length > 0 }">
        <input
          v-model="query"
          type="text"
          class="search-input"
          :placeholder="placeholder"
          @input="onInput"
          @keydown.enter="doSearch"
          @keydown.down="selectNext"
          @keydown.up="selectPrev"
          @focus="onFocus"
          @blur="onBlur"
          ref="inputRef"
        />
        <button class="search-btn" @click="() => doSearch()" :disabled="loading">
          <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <span v-else class="loading-spinner"></span>
        </button>
      </div>

      <transition name="slide-down">
        <div v-if="suggestions.length > 0 && showSuggestions" class="suggestions">
          <div
            v-for="(suggestion, index) in suggestions"
            :key="index"
            class="suggestion-item"
            :class="{ active: index === selectedIndex }"
            @mousedown.prevent
            @click="selectSuggestion(suggestion)"
          >
            <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span class="suggestion-text">{{ suggestion }}</span>
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
      </transition>
    </div>

    <div class="search-types">
      <button
        v-for="type in searchTypes"
        :key="type.value"
        class="type-btn"
        :class="{ active: searchType === type.value }"
        @click="setSearchType(type.value)"
      >
        <svg v-if="type.icon === 'web'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        <svg v-else-if="type.icon === 'image'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
        <svg v-else-if="type.icon === 'news'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
        </svg>
        <svg v-else-if="type.icon === 'video'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 7l-7 5 7 5V7z"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        {{ type.label }}
      </button>
    </div>

    <div v-if="results" class="results-area">
      <div class="results-header">
        <span class="results-count">
          找到约 {{ formatNumber(results.totalEstimatedMatches || 0) }} 条结果
          ({{ results.elapsedTime || 0 }} 秒)
        </span>
        <div class="results-filters" v-if="searchType === 'image'">
          <select v-model="imageFilter.size" @change="refineSearch">
            <option value="">所有尺寸</option>
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
          </select>
          <select v-model="imageFilter.type" @change="refineSearch">
            <option value="">所有类型</option>
            <option value="photo">照片</option>
            <option value="clipart">剪贴画</option>
            <option value="line">线稿</option>
            <option value="animated">动画</option>
          </select>
        </div>
      </div>

      <div v-if="searchType === 'web' && results.webPages?.value" class="web-results">
        <div
          v-for="(item, index) in results.webPages.value"
          :key="index"
          class="result-item"
        >
          <div class="result-url">
            <img v-if="item.deepLinks?.[0]?.url" :src="getFavicon(item.deepLinks[0].url)" class="favicon" />
            <span class="display-url">{{ item.displayUrl }}</span>
          </div>
          <a :href="item.url" class="result-title" target="_blank" rel="noopener">
            {{ item.name }}
          </a>
          <p class="result-snippet" v-html="item.snippet"></p>
          <div v-if="item.deepLinks" class="deep-links">
            <a
              v-for="(link, idx) in item.deepLinks.slice(0, 4)"
              :key="idx"
              :href="link.url"
              class="deep-link"
              target="_blank"
              rel="noopener"
            >
              {{ link.name }}
            </a>
          </div>
        </div>
      </div>

      <div v-if="searchType === 'image' && results.images?.value" class="image-results">
        <div
          v-for="(item, index) in results.images.value"
          :key="index"
          class="image-item"
          @click="openImage(item)"
        >
          <div class="image-wrapper">
            <img :src="item.thumbnailUrl" :alt="item.name" loading="lazy" />
          </div>
          <div class="image-info">
            <span class="image-title">{{ truncate(item.name, 30) }}</span>
            <span class="image-dimensions" v-if="item.width && item.height">
              {{ item.width }} × {{ item.height }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="hasMoreResults" class="pagination">
        <button
          class="load-more-btn"
          @click="loadMore"
          :disabled="loadingMore"
        >
          <span v-if="loadingMore" class="loading-spinner"></span>
          <span v-else>加载更多</span>
        </button>
      </div>
    </div>

    <div v-if="!results && !loading && hasSearched" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <p>未找到相关结果，请尝试其他关键词</p>
    </div>

    <transition name="fade">
      <div v-if="previewImage" class="image-preview-modal" @click="closePreview">
        <div class="preview-content" @click.stop>
          <img :src="previewImage.contentUrl" :alt="previewImage.name" />
          <div class="preview-info">
            <h3>{{ previewImage.name }}</h3>
            <p>{{ previewImage.width }} × {{ previewImage.height }}</p>
            <a :href="previewImage.hostPageUrl" target="_blank" rel="noopener" class="view-source">
              查看来源
            </a>
          </div>
          <button class="close-btn" @click="closePreview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { search, getSuggestions } from '@/api/search'

interface WebPageItem {
  url: string
  name: string
  displayUrl: string
  snippet: string
  deepLinks?: { url: string; name: string }[]
}

interface ImageItem {
  thumbnailUrl: string
  name: string
  width?: number
  height?: number
  contentUrl?: string
  hostPageUrl?: string
}

interface SearchResults {
  totalEstimatedMatches?: number
  elapsedTime?: number
  webPages?: { value: WebPageItem[] }
  images?: { value: ImageItem[] }
  news?: { value: unknown[] }
  videos?: { value: unknown[] }
}

interface Props {
  placeholder?: string
  initialQuery?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索...',
  initialQuery: ''
})

const emit = defineEmits<{
  search: [payload: { query: string; results: SearchResults | null }]
  result: [results: SearchResults | null]
}>()

const query = ref(props.initialQuery)
const loading = ref(false)
const loadingMore = ref(false)
const suggestions = ref<string[]>([])
const showSuggestions = ref(false)
const selectedIndex = ref(-1)
const results = ref<SearchResults | null>(null)
const searchType = ref('web')
const hasSearched = ref(false)
const lastSearch = ref<Date | null>(null)
const previewImage = ref<ImageItem | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const imageFilter = ref({
  size: '',
  type: ''
})

interface SearchTypeOption {
  value: string
  label: string
  icon: string
}

const searchTypes: SearchTypeOption[] = [
  { value: 'web', label: '网页', icon: 'web' },
  { value: 'image', label: '图片', icon: 'image' },
  { value: 'news', label: '新闻', icon: 'news' },
  { value: 'video', label: '视频', icon: 'video' }
]

const hasMoreResults = computed(() => {
  if (!results.value) return false
  const total = results.value.totalEstimatedMatches || 0
  const current = (results.value.webPages?.value?.length || 0) +
                  (results.value.images?.value?.length || 0)
  return current < total
})

let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const onInput = (): void => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(async () => {
    if (query.value.length < 2) {
      suggestions.value = []
      return
    }
    try {
      suggestions.value = await getSuggestions(query.value)
      showSuggestions.value = true
      selectedIndex.value = -1
    } catch (error) {
      console.error('获取建议失败:', error)
    }
  }, 200)
}

const doSearch = async (loadMore = false): Promise<void> => {
  if (!query.value.trim()) return

  loading.value = !loadMore
  loadingMore.value = loadMore
  showSuggestions.value = false
  hasSearched.value = true

  try {
    const options = {
      count: 10,
      offset: loadMore ? (results.value?.webPages?.value?.length || 0) : 0,
      ...imageFilter.value,
      type: searchType.value
    }

    const data = await search(query.value, options)
    const searchResults = data.results as SearchResults

    if (loadMore && results.value) {
      mergeResults(searchResults)
    } else {
      results.value = searchResults
    }

    lastSearch.value = new Date()
    emit('search', { query: query.value, results: searchResults })
    emit('result', searchResults)
  } catch (error) {
    console.error('搜索失败:', error)
    results.value = null
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = (): void => {
  doSearch(true)
}

const setSearchType = (type: string): void => {
  searchType.value = type
  if (query.value) {
    doSearch()
  }
}

const selectSuggestion = (suggestion: string): void => {
  query.value = suggestion
  suggestions.value = []
  showSuggestions.value = false
  doSearch()
}

const selectNext = (): void => {
  if (suggestions.value.length === 0) return
  selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length
  query.value = suggestions.value[selectedIndex.value]
}

const selectPrev = (): void => {
  if (suggestions.value.length === 0) return
  selectedIndex.value = selectedIndex.value <= 0
    ? suggestions.value.length - 1
    : selectedIndex.value - 1
  query.value = suggestions.value[selectedIndex.value]
}

const onFocus = (): void => {
  if (suggestions.value.length > 0) {
    showSuggestions.value = true
  }
}

const onBlur = (): void => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const openImage = (image: ImageItem): void => {
  previewImage.value = image
}

const closePreview = (): void => {
  previewImage.value = null
}

const refineSearch = (): void => {
  doSearch()
}

const mergeResults = (newResults: SearchResults): void => {
  if (!results.value) return
  const types = ['webPages', 'images', 'news', 'videos'] as const
  types.forEach(type => {
    const newType = newResults[type]
    const existingType = results.value![type]
    if (newType?.value && existingType?.value) {
      (existingType.value as unknown[]).push(...newType.value)
    }
  })
}

const getFavicon = (url: string): string => {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const truncate = (text: string, length: number): string => {
  if (!text || text.length <= length) return text
  return text.substring(0, length) + '...'
}

const formatTime = (date: Date): string => {
  if (!date) return ''
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch(() => props.initialQuery, (newQuery) => {
  if (newQuery && newQuery !== query.value) {
    query.value = newQuery
    doSearch()
  }
})

onMounted(() => {
  if (props.initialQuery) {
    query.value = props.initialQuery
    doSearch()
  }
  inputRef.value?.focus()
})
</script>

<style scoped>
.search-interface {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  color: #2563eb;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.search-stats {
  font-size: 12px;
  color: #6b7280;
}

.search-container {
  position: relative;
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 4px;
  transition: all 0.2s;
}

.search-box:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.search-box.has-suggestions {
  border-radius: 12px 12px 0 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 16px;
  font-size: 16px;
  outline: none;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  border: none;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.search-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.search-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.search-btn svg {
  width: 20px;
  height: 20px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #2563eb;
  border-top: none;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  z-index: 100;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: #f3f4f6;
}

.suggestion-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

.suggestion-text {
  flex: 1;
  color: #111827;
  font-size: 14px;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  opacity: 0;
  transition: opacity 0.15s;
}

.suggestion-item:hover .arrow-icon {
  opacity: 1;
}

.search-types {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.type-btn.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}

.type-btn svg {
  width: 16px;
  height: 16px;
}

.results-area {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.results-count {
  font-size: 13px;
  color: #6b7280;
}

.results-filters {
  display: flex;
  gap: 8px;
}

.results-filters select {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

.web-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-item {
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.result-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border-color: #d1d5db;
}

.result-url {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.favicon {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.display-url {
  font-size: 12px;
  color: #059669;
}

.result-title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1d4ed8;
  text-decoration: none;
  margin-bottom: 8px;
  line-height: 1.4;
}

.result-title:hover {
  text-decoration: underline;
}

.result-snippet {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

.deep-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.deep-link {
  font-size: 13px;
  color: #1d4ed8;
  text-decoration: none;
}

.deep-link:hover {
  text-decoration: underline;
}

.image-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.image-item {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
  transition: all 0.2s;
}

.image-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.image-wrapper {
  aspect-ratio: 1;
  overflow: hidden;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.image-item:hover .image-wrapper img {
  transform: scale(1.05);
}

.image-info {
  padding: 12px;
}

.image-title {
  display: block;
  font-size: 13px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-dimensions {
  font-size: 11px;
  color: #6b7280;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.load-more-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.image-preview-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.9);
  z-index: 1000;
  padding: 20px;
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.preview-content img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-info {
  padding: 16px;
}

.preview-info h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #111827;
}

.preview-info p {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}

.view-source {
  display: inline-block;
  padding: 8px 16px;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 13px;
}

.view-source:hover {
  background: #1d4ed8;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(0,0,0,0.7);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .search-interface {
    padding: 12px;
  }

  .logo-text {
    font-size: 18px;
  }

  .search-types {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .type-btn {
    white-space: nowrap;
  }

  .image-results {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>