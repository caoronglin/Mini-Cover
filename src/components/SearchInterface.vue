<template>
  <div class="search-interface">
    <!-- 搜索头部 -->
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

    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-box" :class="{ 'has-suggestions': suggestions.length > 0 }">
        <input
          v-model="query"
          type="text"
          class="search-input"
          :placeholder="placeholder"
          @input="onInput"
          @keydown.enter="search"
          @keydown.down="selectNext"
          @keydown.up="selectPrev"
          @focus="onFocus"
          @blur="onBlur"
          ref="input"
        />
        <button class="search-btn" @click="search" :disabled="loading">
          <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <span v-else class="loading-spinner"></span>
        </button>
      </div>

      <!-- 搜索建议 -->
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

    <!-- 搜索类型切换 -->
    <div class="search-types">
      <button
        v-for="type in searchTypes"
        :key="type.value"
        class="type-btn"
        :class="{ active: searchType === type.value }"
        @click="setSearchType(type.value)"
      >
        <svg v-if="type.icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="type.icon === 'web'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          <rect v-if="type.icon === 'image'" x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle v-if="type.icon === 'image'" cx="8.5" cy="8.5" r="1.5"/>
          <path v-if="type.icon === 'image'" d="M21 15l-5-5L5 21"/>
          <path v-if="type.icon === 'news'" d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
          <path v-if="type.icon === 'video'" d="M23 7l-7 5 7 5V7z"/>
          <rect v-if="type.icon === 'video'" x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        {{ type.label }}
      </button>
    </div>

    <!-- 搜索结果区域 -->
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

      <!-- 网页结果 -->
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

      <!-- 图片结果 -->
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

      <!-- 新闻结果 -->
      <div v-if="searchType === 'news' && results.news?.value" class="news-results">
        <div
          v-for="(item, index) in results.news.value"
          :key="index"
          class="news-item"
        >
          <div class="news-header">
            <img v-if="item.image?.thumbnail?.contentUrl" :src="item.image.thumbnail.contentUrl" class="news-thumb" />
            <div class="news-meta">
              <span class="news-provider">{{ item.provider?.[0]?.name }}</span>
              <span class="news-date">{{ formatDate(item.datePublished) }}</span>
            </div>
          </div>
          <a :href="item.url" class="news-title" target="_blank" rel="noopener">
            {{ item.name }}
          </a>
          <p class="news-description">{{ item.description }}</p>
          <div v-if="item.category" class="news-category">
            <span class="category-tag">{{ item.category }}</span>
          </div>
        </div>
      </div>

      <!-- 视频结果 -->
      <div v-if="searchType === 'video' && results.videos?.value" class="video-results">
        <div
          v-for="(item, index) in results.videos.value"
          :key="index"
          class="video-item"
          @click="openVideo(item)"
        >
          <div class="video-thumbnail">
            <img :src="item.thumbnailUrl" :alt="item.name" />
            <span class="video-duration">{{ formatDuration(item.duration) }}</span>
            <div class="play-overlay">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <div class="video-info">
            <h4 class="video-title">{{ item.name }}</h4>
            <div class="video-meta">
              <span class="video-creator">{{ item.creator?.name }}</span>
              <span class="video-views">{{ formatViews(item.viewCount) }}次观看</span>
              <span class="video-date">{{ formatDate(item.datePublished) }}</span>
            </div>
            <p class="video-description">{{ truncate(item.description, 100) }}</p>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="results && hasMoreResults" class="pagination">
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

    <!-- 空状态 -->
    <div v-if="!results && !loading && hasSearched" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <p>未找到相关结果，请尝试其他关键词</p>
    </div>

    <!-- 图片预览Modal -->
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

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { search, getSuggestions, SearchParams } from '@/api/search.js';

export default {
  name: 'SearchInterface',
  props: {
    placeholder: {
      type: String,
      default: '搜索...'
    },
    initialQuery: {
      type: String,
      default: ''
    }
  },
  emits: ['search', 'result'],
  setup(props, { emit }) {
    // 状态
    const query = ref(props.initialQuery);
    const loading = ref(false);
    const loadingMore = ref(false);
    const suggestions = ref([]);
    const showSuggestions = ref(false);
    const selectedIndex = ref(-1);
    const results = ref(null);
    const searchType = ref('web');
    const hasSearched = ref(false);
    const lastSearch = ref(null);
    const previewImage = ref(null);
    const input = ref(null);

    // 图片筛选
    const imageFilter = ref({
      size: '',
      type: ''
    });

    // 搜索类型
    const searchTypes = [
      { value: 'web', label: '网页', icon: 'web' },
      { value: 'image', label: '图片', icon: 'image' },
      { value: 'news', label: '新闻', icon: 'news' },
      { value: 'video', label: '视频', icon: 'video' }
    ];

    // 计算属性
    const hasMoreResults = computed(() => {
      if (!results.value) return false;
      const total = results.value.totalEstimatedMatches || 0;
      const current = (results.value.webPages?.value?.length || 0) +
                     (results.value.images?.value?.length || 0) +
                     (results.value.news?.value?.length || 0) +
                     (results.value.videos?.value?.length || 0);
      return current < total;
    });

    // 方法
    const onInput = debounce(async () => {
      if (query.value.length < 2) {
        suggestions.value = [];
        return;
      }

      try {
        suggestions.value = await getSuggestions(query.value);
        showSuggestions.value = true;
        selectedIndex.value = -1;
      } catch (error) {
        console.error('获取建议失败:', error);
      }
    }, 200);

    const search = async (loadMore = false) => {
      if (!query.value.trim()) return;

      loading.value = !loadMore;
      loadingMore.value = loadMore;
      showSuggestions.value = false;
      hasSearched.value = true;

      try {
        const options = {
          type: searchType.value,
          count: 10,
          offset: loadMore ? (results.value?.webPages?.value?.length || 0) : 0,
          ...imageFilter.value
        };

        const data = await search(query.value, options);

        if (loadMore && results.value) {
          // 合并结果
          mergeResults(data.results);
        } else {
          results.value = data.results;
        }

        lastSearch.value = new Date();
        emit('search', { query: query.value, results: data.results });
        emit('result', data.results);
      } catch (error) {
        console.error('搜索失败:', error);
        results.value = null;
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };

    const loadMore = () => {
      search(true);
    };

    const setSearchType = (type) => {
      searchType.value = type;
      if (query.value) {
        search();
      }
    };

    const selectSuggestion = (suggestion) => {
      query.value = suggestion;
      suggestions.value = [];
      showSuggestions.value = false;
      search();
    };

    const selectNext = () => {
      if (suggestions.value.length === 0) return;
      selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length;
      query.value = suggestions.value[selectedIndex.value];
    };

    const selectPrev = () => {
      if (suggestions.value.length === 0) return;
      selectedIndex.value = selectedIndex.value <= 0
        ? suggestions.value.length - 1
        : selectedIndex.value - 1;
      query.value = suggestions.value[selectedIndex.value];
    };

    const onFocus = () => {
      if (suggestions.value.length > 0) {
        showSuggestions.value = true;
      }
    };

    const onBlur = () => {
      setTimeout(() => {
        showSuggestions.value = false;
      }, 200);
    };

    const openImage = (image) => {
      previewImage.value = image;
    };

    const closePreview = () => {
      previewImage.value = null;
    };

    const refineSearch = () => {
      search();
    };

    // 辅助方法
    const mergeResults = (newResults) => {
      if (!results.value) return;

      ['webPages', 'images', 'news', 'videos'].forEach(type => {
        if (newResults[type]?.value && results.value[type]?.value) {
          results.value[type].value.push(...newResults[type].value);
        }
      });
    };

    const getFavicon = (url) => {
      try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      } catch {
        return '';
      }
    };

    const formatNumber = (num) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    };

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now - date;

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 60) return `${minutes}分钟前`;
      if (hours < 24) return `${hours}小时前`;
      if (days < 7) return `${days}天前`;

      return date.toLocaleDateString('zh-CN');
    };

    const formatDuration = (duration) => {
      if (!duration) return '';
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return '';

      const hours = match[1] || 0;
      const minutes = match[2] || 0;
      const seconds = match[3] || 0;

      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    };

    const formatViews = (views) => {
      if (!views) return '0';
      return formatNumber(parseInt(views));
    };

    const truncate = (text, length) => {
      if (!text || text.length <= length) return text;
      return text.substring(0, length) + '...';
    };

    const formatTime = (date) => {
      if (!date) return '';
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // 防抖函数
    function debounce(fn, delay) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    }

    // 监听initialQuery变化
    watch(() => props.initialQuery, (newQuery) => {
      if (newQuery && newQuery !== query.value) {
        query.value = newQuery;
        search();
      }
    });

    // 生命周期
    onMounted(() => {
      if (props.initialQuery) {
        query.value = props.initialQuery;
        search();
      }
      input.value?.focus();
    });

    return {
      query,
      loading,
      loadingMore,
      suggestions,
      showSuggestions,
      selectedIndex,
      results,
      searchType,
      hasSearched,
      lastSearch,
      previewImage,
      input,
      imageFilter,
      searchTypes,
      hasMoreResults,
      onInput,
      search,
      loadMore,
      setSearchType,
      selectSuggestion,
      selectNext,
      selectPrev,
      onFocus,
      onBlur,
      openImage,
      closePreview,
      refineSearch,
      getFavicon,
      formatNumber,
      formatDate,
      formatDuration,
      formatViews,
      truncate,
      formatTime
    };
  }
};
</script>

<style scoped>
.search-interface {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

/* 头部 */
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

/* 搜索框 */
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

/* 搜索建议 */
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

/* 搜索类型切换 */
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

/* 结果区域 */
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

/* 网页结果 */
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

/* 图片结果 */
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

/* 新闻结果 */
.news-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.news-item {
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.news-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.news-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.news-thumb {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}

.news-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.news-provider {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
}

.news-date {
  font-size: 12px;
  color: #6b7280;
}

.news-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1d4ed8;
  text-decoration: none;
  margin-bottom: 8px;
  line-height: 1.4;
}

.news-title:hover {
  text-decoration: underline;
}

.news-description {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 12px;
}

.news-category {
  display: flex;
  gap: 8px;
}

.category-tag {
  font-size: 11px;
  padding: 4px 8px;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 4px;
}

/* 视频结果 */
.video-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.video-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.video-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.video-thumbnail {
  position: relative;
  width: 240px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
}

.video-thumbnail img {
  width: 100%;
  height: 135px;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 2px 6px;
  background: rgba(0,0,0,0.8);
  color: white;
  font-size: 12px;
  border-radius: 4px;
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
  opacity: 0;
  transition: opacity 0.2s;
}

.video-item:hover .play-overlay {
  opacity: 1;
}

.play-overlay svg {
  width: 48px;
  height: 48px;
  color: white;
}

.video-info {
  flex: 1;
  min-width: 0;
}

.video-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.video-creator,
.video-views,
.video-date {
  font-size: 13px;
  color: #6b7280;
}

.video-description {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 分页 */
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

/* 空状态 */
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

/* 图片预览Modal */
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

/* 过渡动画 */
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

/* 响应式 */
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

  .video-item {
    flex-direction: column;
  }

  .video-thumbnail {
    width: 100%;
  }

  .video-thumbnail img {
    height: auto;
    aspect-ratio: 16/9;
  }

  .image-results {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
