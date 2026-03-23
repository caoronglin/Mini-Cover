<template>
  <div class="home">
    <header class="header">
      <nav class="nav">
        <router-link to="/" class="logo">MiniCover</router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link active">Bing每日壁纸</router-link>
          <router-link to="/cover" class="nav-link">封面生成</router-link>
        </div>
      </nav>
    </header>

    <main class="main">
      <div class="hero" :style="{ backgroundImage: `url(${currentImage})` }">
        <div class="hero-overlay">
          <div class="hero-content">
            <h1 class="hero-title">Bing 每日美图</h1>
            <p class="hero-subtitle">来自 bing.cnortles.top 的高清壁纸</p>

            <div class="hero-actions">
              <button class="btn btn-primary" @click="refreshImage">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                换一张
              </button>
              <button class="btn btn-secondary" @click="downloadImage">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                下载壁纸
              </button>
            </div>

            <div class="image-info" v-if="imageInfo">
              <p class="info-text">{{ imageInfo.title }}</p>
              <p class="info-date">{{ imageInfo.date }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="gallery-section">
        <div class="container">
          <h2 class="section-title">历史壁纸</h2>
          <p class="section-subtitle">最近7天的 Bing 每日壁纸</p>

          <div class="gallery-grid">
            <div
              v-for="(img, index) in galleryImages"
              :key="index"
              class="gallery-item"
              @click="setCurrentImage(img.url, img.info)"
            >
              <img :src="img.url" :alt="img.info?.title || 'Bing壁纸'" loading="lazy">
              <div class="gallery-overlay">
                <p class="gallery-title">{{ img.info?.title || 'Bing每日壁纸' }}</p>
                <p class="gallery-date">{{ img.info?.date || '' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="container">
        <p class="footer-text">数据来源: bing.cnortles.top | 使用 WebP 格式提供高清壁纸</p>
        <p class="footer-copyright">© 2024 MiniCover - 简洁的封面生成与壁纸工具</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ImageInfo {
  title: string
  date: string
}

interface GalleryImage {
  url: string
  info: ImageInfo
}

const currentImage = ref('')
const imageInfo = ref<ImageInfo | null>(null)
const galleryImages = ref<GalleryImage[]>([])

const BING_API_BASE = 'https://bing.cnortles.top/api'

const fetchTodayImage = async (): Promise<void> => {
  try {
    const response = await fetch(`${BING_API_BASE}?format=webp&index=0`)
    if (response.ok) {
      const data = await response.json()
      if (data.url) {
        currentImage.value = data.url
        imageInfo.value = {
          title: data.title || 'Bing 每日壁纸',
          date: new Date().toLocaleDateString('zh-CN')
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Bing image:', error)
    currentImage.value = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80'
    imageInfo.value = { title: '自然风光', date: new Date().toLocaleDateString('zh-CN') }
  }
}

const fetchGalleryImages = async (): Promise<void> => {
  try {
    const images: GalleryImage[] = []
    for (let i = 0; i < 7; i++) {
      const response = await fetch(`${BING_API_BASE}?format=webp&index=${i}`)
      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          images.push({
            url: data.url,
            info: {
              title: data.title || `Bing 壁纸 ${i + 1}`,
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')
            }
          })
        }
      }
    }
    galleryImages.value = images
  } catch (error) {
    console.error('Error fetching gallery:', error)
  }
}

const refreshImage = (): void => {
  fetchTodayImage()
}

const downloadImage = (): void => {
  if (currentImage.value) {
    const link = document.createElement('a')
    link.href = currentImage.value
    link.download = `bing-wallpaper-${Date.now()}.webp`
    link.click()
  }
}

const setCurrentImage = (url: string, info: ImageInfo): void => {
  currentImage.value = url
  imageInfo.value = info
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  fetchTodayImage()
  fetchGalleryImages()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f8f9fa;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 40px;
}

.nav {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.logo {
  font-size: 26px;
  font-weight: 700;
  color: #667eea;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 10px;
}

.nav-link {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.3s;
}

.nav-link:hover,
.nav-link.active {
  color: #667eea;
  background: #f3f4f6;
}

.hero {
  height: 70vh;
  min-height: 600px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.hero-content {
  text-align: center;
  max-width: 800px;
}

.hero-title {
  font-size: 56px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.hero-subtitle {
  font-size: 20px;
  color: rgba(255,255,255,0.9);
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 40px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn svg {
  width: 20px;
  height: 20px;
}

.btn-primary {
  background: #fff;
  color: #667eea;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.btn-secondary {
  background: rgba(255,255,255,0.2);
  color: #fff;
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.3);
}

.image-info {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 12px;
  display: inline-block;
}

.info-text {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.info-date {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}

.gallery-section {
  padding: 80px 40px;
  background: #fff;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.section-title {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin-bottom: 8px;
}

.section-subtitle {
  font-size: 16px;
  color: #6b7280;
  text-align: center;
  margin-bottom: 48px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.gallery-item {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 16/10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: all 0.3s;
}

.gallery-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.15);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.gallery-item:hover img {
  transform: scale(1.05);
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px;
  opacity: 0;
  transition: opacity 0.3s;
}

.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

.gallery-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
  line-height: 1.4;
}

.gallery-date {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}

.footer {
  background: #1f2937;
  padding: 40px;
  text-align: center;
}

.footer-text {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.footer-copyright {
  font-size: 13px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .header {
    padding: 0 20px;
  }

  .nav {
    height: 60px;
  }

  .logo {
    font-size: 22px;
  }

  .nav-link {
    padding: 8px 14px;
    font-size: 14px;
  }

  .hero {
    height: 60vh;
    min-height: 500px;
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .hero-actions {
    flex-direction: column;
    gap: 12px;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .gallery-section {
    padding: 60px 20px;
  }

  .section-title {
    font-size: 28px;
  }

  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>