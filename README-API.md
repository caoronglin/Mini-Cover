# Mini-Cover 集成项目 - 完整功能说明

## 项目概述

本项目基于 Mini-Cover 封面生成器，集成了以下功能：

1. **Bing搜索API** - 集成 bing.cnortles.top 风格的搜索界面
2. **阿里云ESA** - 边缘安全加速平台适配
3. **腾讯云EdgeOne** - 边缘计算平台适配
4. **Cloudflare Workers** - 边缘计算平台支持
5. **丰富的API接口** - 完整的RESTful API设计

## 项目结构

```
Mini-Cover/
├── src/
│   ├── api/
│   │   ├── search.js          # 搜索API封装
│   │   └── edge.js            # 边缘计算API封装
│   ├── components/
│   │   └── SearchInterface.vue # 搜索界面组件
│   ├── views/
│   │   └── SearchView.vue     # 搜索页面视图
│   └── types/
│       └── env.d.ts           # 类型定义
├── functions/
│   └── api/
│       └── [[path]].js        # Cloudflare Workers主入口
│       └── search.js          # 搜索处理函数
├── edge-functions/
│   ├── esa/                   # 阿里云ESA边缘函数
│   │   └── search.js
│   └── edgeone/               # 腾讯云EO边缘函数
│       └── search.js
├── .github/
│   └── workflows/
│       ├── deploy-esa.yml     # 阿里云ESA部署
│       ├── deploy-edgeone.yml # 腾讯云EO部署
│       └── deploy-cloudflare.yml # Cloudflare部署
├── esa.config.js              # 阿里云ESA配置
├── edgeone.config.js          # 腾讯云EO配置
├── wrangler.toml              # Cloudflare配置
├── vercel.json                # Vercel配置
├── netlify.toml               # Netlify配置
├── API.md                     # 完整API文档
└── DEPLOY.md                  # 部署指南
```

## 功能特性

### 1. 智能搜索功能
- 多类型搜索：网页、图片、新闻、视频
- 自动补全/建议
- 多语言支持
- 安全搜索过滤
- 时效性筛选

### 2. 边缘计算支持
- **阿里云ESA**: Functions + Pages + KV存储
- **腾讯云EdgeOne**: 边缘函数 + Pages + 缓存
- **Cloudflare**: Workers + Pages + KV + R2 + D1

### 3. 封面生成功能
- Canvas-based封面生成
- 多种尺寸预设
- 渐变/图片背景
- 文字样式定制
- 图标/Logo添加
- 水印功能

### 4. API接口
- 完整的RESTful API设计
- 统一响应格式
- 详细的错误处理
- 缓存策略优化
- CORS跨域支持

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建
```bash
npm run build
```

## 部署

### 阿里云ESA
```bash
npm install -g @alicloud/esa-cli
esa login
esa deploy --config esa.config.js
```

### 腾讯云EdgeOne
```bash
npm install -g @tencent/edgeone-cli
eo login
eo deploy --config edgeone.config.js
```

### Cloudflare
```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

```env
# Bing搜索API
VITE_BING_API_KEY=your_bing_api_key

# 阿里云ESA
ESA_API_KEY=your_esa_key

# 腾讯云EO
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key

# Cloudflare
CLOUDFLARE_API_TOKEN=your_token
```

## API文档

详细API文档请参考 [API.md](./API.md)

## 部署文档

详细部署指南请参考 [DEPLOY.md](./DEPLOY.md)

## 技术栈

- **前端**: Vue 3 + Vite + Tailwind CSS
- **边缘计算**: Cloudflare Workers / 阿里云ESA / 腾讯云EO
- **存储**: KV Store / R2 / D1
- **API**: RESTful + Edge Functions

## 许可证

MIT
