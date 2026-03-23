/**
 * 封面生成API服务
 * 接收参数生成封面图片，支持缓存
 */

// 使用动态导入canvas，如果不存在则使用备用方案

// 简单的内存缓存
const cache = new Map()
const CACHE_MAX_SIZE = 100 // 最大缓存数量
const CACHE_TTL = 3600000 // 1小时过期

/**
 * 生成缓存key
 */
function generateCacheKey(params) {
  const keyString = JSON.stringify({
    title: params.title,
    subtitle: params.subtitle,
    bgImage: params.bgImage,
    width: params.width,
    height: params.height,
    textColor: params.textColor,
    align: params.align
  })
  // 简单的hash
  let hash = 0
  for (let i = 0; i < keyString.length; i++) {
    const char = keyString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

/**
 * 清理过期缓存
 */
function cleanupCache() {
  const now = Date.now()
  for (const [key, item] of cache.entries()) {
    if (now - item.timestamp > CACHE_TTL) {
      cache.delete(key)
    }
  }

  // 如果缓存太大，删除最旧的
  if (cache.size > CACHE_MAX_SIZE) {
    const sortedEntries = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)

    const toDelete = sortedEntries.slice(0, cache.size - CACHE_MAX_SIZE)
    for (const [key] of toDelete) {
      cache.delete(key)
    }
  }
}

/**
 * 绘制文字自动换行
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, align) {
  const chars = text.split('')
  let line = ''
  const lines = []

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      lines.push(line)
      line = chars[i]
    } else {
      line = testLine
    }
  }
  lines.push(line)

  // 根据对齐方式调整Y坐标
  const totalHeight = lines.length * lineHeight
  let startY = y

  if (align === 'center') {
    startY = y - totalHeight / 2 + lineHeight / 2
  }

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight)
  }
}

/**
 * 生成封面图片
 */
async function generateCover(params) {
  const {
    width = 1200,
    height = 630,
    title = '',
    subtitle = '',
    bgImage = null,
    textColor = '#ffffff',
    align = 'center',
    overlayOpacity = 30,
    blur = 0
  } = params

  // 创建canvas
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // 绘制背景
  if (bgImage) {
    try {
      const img = await loadImage(bgImage)
      // 计算cover填充
      const scale = Math.max(width / img.width, height / img.height)
      const x = (width / 2) - (img.width / 2) * scale
      const y = (height / 2) - (img.height / 2) * scale
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
    } catch (e) {
      // 加载失败使用渐变背景
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }
  } else {
    // 默认渐变背景
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#667eea')
    gradient.addColorStop(1, '#764ba2')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  // 应用模糊
  if (blur > 0) {
    ctx.filter = `blur(${blur}px)`
  }

  // 绘制遮罩
  if (overlayOpacity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayOpacity / 100})`
    ctx.fillRect(0, 0, width, height)
  }

  // 重置滤镜
  ctx.filter = 'none'

  // 绘制文字
  const padding = 60
  const maxWidth = width - padding * 2

  ctx.textAlign = align

  let x
  switch (align) {
    case 'left':
      x = padding
      break
    case 'right':
      x = width - padding
      break
    default:
      x = width / 2
  }

  // 主标题
  if (title) {
    ctx.fillStyle = textColor
    ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    wrapText(ctx, title, x, height / 2 - 30, maxWidth, 80, align)
  }

  // 副标题
  if (subtitle) {
    ctx.fillStyle = textColor
    ctx.globalAlpha = 0.8
    ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    wrapText(ctx, subtitle, x, height / 2 + 70, maxWidth, 40, align)
    ctx.globalAlpha = 1
  }

  return canvas
}

/**
 * 主处理函数
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // CORS处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    // 只处理POST请求
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    try {
      // 获取参数
      const params = await request.json()

      // 生成缓存key
      const cacheKey = generateCacheKey(params)

      // 检查缓存
      const cached = cache.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return new Response(cached.image, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'HIT'
          }
        })
      }

      // 生成封面
      const canvas = await generateCover(params)

      // 转换为PNG buffer
      const buffer = canvas.toBuffer('image/png')

      // 存入缓存
      cache.set(cacheKey, {
        image: buffer,
        timestamp: Date.now()
      })

      // 清理过期缓存
      cleanupCache()

      // 返回图片
      return new Response(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'MISS'
        }
      })

    } catch (error) {
      console.error('Error generating cover:', error)
      return new Response(JSON.stringify({
        error: 'Failed to generate cover',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }
}
