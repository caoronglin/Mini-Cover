/**
 * 腾讯云EdgeOne (EO) 配置
 *
 * 文档: https://cloud.tencent.com/document/product/1552/127366
 */

export default {
  // 项目名称
  name: 'mini-cover',

  // 框架预设
  framework: 'vite',

  // 构建配置
  build: {
    // 构建命令
    command: 'npm run build',
    // 输出目录
    output: 'dist',
    // Node版本
    nodeVersion: '18'
  },

  // 边缘函数配置
  edgeFunctions: {
    // 搜索API
    'api/search': {
      // 函数入口
      entry: './edge-functions/edgeone/search.js',
      // 处理的路径模式
      path: '/api/search',
      // 执行环境
      runtime: 'node18',
      // 内存限制(MB)
      memory: 128,
      // 超时时间(秒)
      timeout: 30,
      // 环境变量
      env: {
        BING_API_KEY: '{{BING_API_KEY}}',
        CACHE_TTL: '3600'
      }
    },

    // 图片处理
    'api/image': {
      entry: './edge-functions/edgeone/image.js',
      path: '/api/image',
      memory: 256,
      timeout: 60
    },

    // 封面生成
    'api/cover': {
      entry: './edge-functions/edgeone/cover.js',
      path: '/api/cover',
      memory: 512,
      timeout: 60
    },

    // 健康检查
    'api/health': {
      entry: './edge-functions/edgeone/health.js',
      path: '/api/health',
      memory: 64,
      timeout: 5
    }
  },

  // KV命名空间配置
  kvNamespaces: [
    {
      // 绑定名称
      binding: 'MINI_COVER_KV',
      // 命名空间ID
      id: '{{KV_NAMESPACE_ID}}'
    }
  ],

  // 缓存规则
  cacheRules: [
    {
      // 静态资源缓存
      name: 'static-assets',
      pattern: '.*\\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$',
      ttl: {
        // 浏览器缓存
        browser: 86400, // 24小时
        // 边缘缓存
        edge: 86400
      },
      // 缓存键
      key: {
        // 包含查询参数
        query: true
      }
    },
    {
      // API缓存
      name: 'api-cache',
      pattern: '/api/.*',
      ttl: {
        browser: 0, // 不缓存到浏览器
        edge: 3600 // 边缘缓存1小时
      },
      // 按查询参数缓存
      key: {
        query: true
      }
    }
  ],

  // 路由配置
  routes: [
    {
      // API路由 - 由边缘函数处理
      pattern: '/api/*',
      edgeFunction: true,
      priority: 100
    },
    {
      // 静态资源
      pattern: '/assets/*',
      static: true,
      cache: 'static-assets',
      priority: 90
    },
    {
      // 首页和其他路由
      pattern: '/*',
      static: true,
      fallback: '/index.html',
      priority: 10
    }
  ],

  // 环境变量
  env: {
    NODE_ENV: 'production',
    VITE_APP_TITLE: 'Mini Cover - 封面生成器',
    VITE_BING_API_URL: '/api',
    VITE_PLATFORM: 'edgeone'
  },

  // 构建时环境变量
  buildEnv: {
    VITE_BUILD_TIME: new Date().toISOString(),
    VITE_BUILD_PLATFORM: 'edgeone'
  },

  // 功能特性开关
  features: {
    // 边缘AI
    ai: false,
    // KV存储
    kv: true,
    // 缓存API
    cache: true,
    // 图像处理
    image: true
  }
};
