# 🎵 M3U8 Player

基于 Next.js 的 M3U8 播放器，集成多平台音乐解析 API。

## ✨ 特性

- 🎵 **多平台音乐支持**: 网易云音乐、QQ音乐、百度音乐等
- 🎬 **M3U8 播放**: 支持 M3U8 视频流播放
- 🎨 **现代化 UI**: 使用 Tailwind CSS 和 shadcn/ui
- 🚀 **高性能**: Next.js 14 App Router，服务端渲染
- 💾 **智能缓存**: 内置缓存系统，可扩展至 Redis
- 🔒 **安全可靠**: 支持 API 鉴权和访问控制
- 📱 **响应式设计**: 完美支持移动端

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
pnpm run build
pnpm run start
```

## 🎯 核心功能

### 1. 音乐 API

支持搜索、获取歌曲、歌单、歌词、封面等功能。

**API 端点**: `/api/music`

```bash
# 搜索歌曲
GET /api/music?server=netease&type=search&id=周杰伦&limit=10

# 获取歌单
GET /api/music?server=netease&type=playlist&id=2829883691

# 获取歌曲详情
GET /api/music?server=netease&type=song&id=186016

# 获取播放地址
GET /api/music?server=netease&type=url&id=186016

# 获取歌词
GET /api/music?server=netease&type=lrc&id=186016
```

📚 **完整文档**: [docs/MUSIC_API.md](docs/MUSIC_API.md)

### 2. 音乐播放器组件

React 组件，支持播放列表、歌词显示、进度控制等。

```tsx
import MusicPlayer from '@/components/MusicPlayer'

export default function Page() {
  return <MusicPlayer />
}
```

📚 **组件文档**: [docs/MUSIC_PLAYER_USAGE.md](docs/MUSIC_PLAYER_USAGE.md)

### 3. 测试页面

访问 `/music-test.html` 测试音乐 API 功能。

## 📦 部署

### 快速部署

使用部署脚本一键部署：

```powershell
# Windows PowerShell
.\deploy.ps1 vercel        # 部署到 Vercel
.\deploy.ps1 cloudflare    # 部署到 Cloudflare Pages
.\deploy.ps1 docker        # Docker 部署
.\deploy.ps1 pm2           # PM2 部署
```

```bash
# Linux/Mac
chmod +x deploy.sh
./deploy.sh vercel         # 部署到 Vercel
./deploy.sh cloudflare     # 部署到 Cloudflare Pages
./deploy.sh docker         # Docker 部署
./deploy.sh pm2            # PM2 部署
```

### 推荐部署平台

| 平台 | 难度 | 速度 | 成本 | 推荐度 |
|------|------|------|------|--------|
| **Vercel** | ⭐ 最简单 | ⭐⭐⭐⭐ | 免费 | ⭐⭐⭐⭐⭐ |
| **Cloudflare Pages** | ⭐⭐ | ⭐⭐⭐⭐⭐ | 免费 | ⭐⭐⭐⭐⭐ |
| **Docker** | ⭐⭐⭐ | 取决于配置 | 取决于服务器 | ⭐⭐⭐⭐ |
| **PM2** | ⭐⭐⭐⭐ | 取决于配置 | 取决于服务器 | ⭐⭐⭐ |

📚 **完整部署文档**: [DEPLOYMENT.md](DEPLOYMENT.md)

## 🔧 配置

### 环境变量（可选）

复制 `.env.local.example` 为 `.env.local`：

```env
# 网易云音乐 Cookie（可选，用于访问需要登录的资源）
MUSIC_NETEASE_COOKIE=your_cookie_here

# API 鉴权盐值（可选，用于 API 访问控制）
MUSIC_AUTH_SALT=your_secret_salt
```

## 📖 文档

- [API 文档](docs/MUSIC_API.md) - 完整的 API 接口说明
- [组件文档](docs/MUSIC_PLAYER_USAGE.md) - React 组件使用指南
- [快速开始](docs/QUICK_START.md) - 快速开始教程
- [部署指南](DEPLOYMENT.md) - 详细的部署说明
- [项目总览](PROJECT_SUMMARY.md) - 项目架构和文件说明

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: shadcn/ui
- **音乐解析**: Meting API (TypeScript 重写)
- **部署**: Vercel / Cloudflare Pages / Docker

## 📁 项目结构

```
m3u8-player/
├── app/                    # Next.js 应用目录
│   ├── api/               # API 路由
│   │   ├── music/        # 音乐 API
│   │   ├── player/       # 播放器 API
│   │   └── ...
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 首页
├── components/            # React 组件
│   ├── MusicPlayer.tsx   # 音乐播放器
│   └── ui/               # UI 组件库
├── lib/                   # 工具库
│   ├── meting.ts         # 音乐解析核心
│   └── music-cache.ts    # 缓存管理
├── types/                 # TypeScript 类型定义
├── docs/                  # 文档
├── public/                # 静态资源
│   └── music-test.html   # 测试页面
└── ...
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Meting](https://github.com/metowolf/Meting)
- [APlayer](https://github.com/DIYgod/APlayer)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Made with ❤️ by guogms**
