# 🎵 M3U8 音乐播放器

一个基于 Next.js 14 开发的音乐播放器，支持多平台音乐解析（网易云、QQ音乐等）。

## ✨ 功能特性

- 🎵 支持多平台音乐搜索和播放
- 🎨 精美的 UI 界面（基于 Radix UI + Tailwind CSS）
- 📱 响应式设计，支持移动端
- 🔄 智能缓存机制
- 🎭 音乐歌词显示
- 🖼️ 封面图片展示

## 🚀 快速部署

### 方案一：Docker 部署（推荐）

#### Windows 用户

1. **确保 Docker Desktop 已启动**

2. **一键部署**
   ```powershell
   .\quick-deploy.ps1
   ```

   或使用完整脚本：
   ```powershell
   .\deploy.ps1
   ```

3. **访问应用**
   
   打开浏览器访问：http://localhost:3000

#### Linux/Mac 用户

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f
```

### 方案二：本地开发

1. **安装依赖**
   ```powershell
   pnpm install
   ```

2. **开发模式**
   ```powershell
   pnpm dev
   ```

3. **生产构建**
   ```powershell
   pnpm build
   pnpm start
   ```

## 📦 部署到云平台

### Vercel 部署

1. Fork 本仓库
2. 在 [Vercel](https://vercel.com) 导入项目
3. 一键部署

### Cloudflare Pages

```powershell
pnpm build
wrangler pages deploy .next
```

## 🔧 环境变量配置

复制 `.env.example` 为 `.env.local`：

```bash
# 可选：网易云音乐 Cookie
NETEASE_COOKIE=your_cookie_here

# 可选：QQ音乐 Cookie
TENCENT_COOKIE=your_cookie_here

# 可选：API 安全密钥
MUSIC_API_SALT=your_salt_here
```

## 📖 API 使用文档

详见：
- [API 文档](./docs/MUSIC_API.md)
- [音乐播放器使用说明](./docs/MUSIC_PLAYER_USAGE.md)
- [快速开始指南](./docs/QUICK_START.md)

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: Radix UI
- **包管理**: pnpm
- **部署**: Docker / Vercel / Cloudflare Pages

## 📁 项目结构

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── music/        # 音乐解析 API
│   │   ├── player/       # 播放器 API
│   │   └── ...
│   ├── layout.tsx        # 全局布局
│   └── page.tsx          # 首页
├── components/            # React 组件
│   ├── MusicPlayer.tsx   # 音乐播放器组件
│   └── ui/               # UI 组件库
├── lib/                   # 工具库
│   ├── meting.ts         # 音乐解析核心
│   └── music-cache.ts    # 缓存管理
├── docs/                  # 文档
├── public/                # 静态资源
├── Dockerfile            # Docker 镜像配置
├── docker-compose.yml    # Docker Compose 配置
└── deploy.ps1            # 部署脚本 (Windows)
```

## 🎯 常用命令

```powershell
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm lint             # 代码检查

# Docker
docker-compose up -d --build   # 构建并启动
docker-compose logs -f         # 查看日志
docker-compose stop            # 停止服务
docker-compose down            # 停止并删除容器
```

## 🐛 故障排查

### Windows 构建问题

如果遇到 `EPERM: operation not permitted, symlink` 错误：

- ✅ **推荐**：使用 Docker 部署（已配置好）
- 或：在 WSL2 环境中构建
- 或：以管理员身份运行 PowerShell

### API 路由问题

如果 API 无法访问，检查：

1. 环境变量是否正确配置
2. Cookie 是否有效（如需要）
3. 网络连接是否正常

## 📝 更新日志

### v0.1.0 (2025-10-22)

- ✅ 初始版本发布
- ✅ 支持网易云、QQ音乐等多平台
- ✅ Docker 部署支持
- ✅ 完整的 API 文档

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

- GitHub: [@guogms](https://github.com/guogms)
- 项目地址: [m3u8-player](https://github.com/guogms/m3u8-player)

---

Made with ❤️ by guogms
