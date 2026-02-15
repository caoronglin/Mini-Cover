/**
 * 阿里云ESA (Edge Security Acceleration) 配置
 *
 * 文档: https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/what-is-functions-and-pages/
 */

export default {
  // 项目名称
  name: 'mini-cover',

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
      path: './edge-functions/esa/search.js',
      // 内存限制(MB)
      memory: 128,
      // 超时时间(ms)
      timeout: 30000,
      // 环境变量
      env: {
        BING_API_KEY: '${BING_API_KEY}',
        CACHE_TTL: '3600'
      }
    },

    // 图片处理
    'api/image': {
      path: './edge-functions/esa/image.js',
      memory: 256,
      timeout: 60000
    },

    // 封面生成
    'api/cover': {
      path: './edge-functions/esa/cover.js',
      memory: 512,
      timeout: 60000
    }
  },

  // KV存储配置
  kv: {
    namespace: 'mini-cover-kv',
    // 绑定ID
    id: '${KV_NAMESPACE_ID}'
  },

  // 缓存规则
  cache: {
    // 静态资源缓存
    static: {
      regex: '.*\\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$',
      ttl: 86400 // 24小时
    },
    // API缓存
    api: {
      regex: '/api/',
      ttl: 3600 // 1小时
    }
  },

  // 路由规则
  routes: [
    {
      // API路由
      pattern: '/api/*',
      function: true
    },
    {
      // 静态资源
      pattern: '/assets/*',
      cache: true
    },
    {
      // 首页
      pattern: '/',
      static: true
    }
  ],

  // 环境变量
  env: {
    NODE_ENV: 'production',
    VITE_APP_TITLE: 'Mini Cover - 封面生成器',
    VITE_BING_API_URL: '/api'
  },

  // 构建时环境变量
  buildEnv: {
    VITE_BUILD_TIME: new Date().toISOString()
  }
};
