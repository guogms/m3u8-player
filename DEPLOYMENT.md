# 🚀 部署指南

本项目是基于 Next.js 的应用，支持多种部署方式。

## 📋 部署前准备

### 1. 确保构建成功
```powershell
pnpm run build
```

### 2. 检查环境变量（可选）
创建 `.env.production` 文件：
```env
# 音乐 API 配置（可选）
MUSIC_NETEASE_COOKIE=your_cookie_here
MUSIC_AUTH_SALT=your_secret_salt
```

---

## 🌐 部署方式

### 方式 1: Vercel 部署（推荐，最简单）

#### 通过 Vercel CLI
```powershell
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 部署到生产环境
vercel --prod
```

#### 通过 Vercel 网站
1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Import Project"
3. 连接 GitHub 仓库
4. 选择项目：`guogms/m3u8-player`
5. 配置构建设置（自动检测 Next.js）
6. 点击 "Deploy"

**环境变量配置**：
- 在 Vercel 项目设置 → Environment Variables 中添加
- `MUSIC_NETEASE_COOKIE`
- `MUSIC_AUTH_SALT`

**优势**：
- ✅ 零配置，自动 CI/CD
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ Git 推送自动部署
- ✅ 免费额度充足

---

### 方式 2: Cloudflare Pages 部署

您的项目已经有 `wrangler.toml` 配置文件，非常适合 Cloudflare Pages！

#### 通过 Wrangler CLI
```powershell
# 1. 安装 Wrangler（如果还没安装）
npm i -g wrangler

# 2. 登录
wrangler login

# 3. 部署
npx @cloudflare/next-on-pages

# 4. 发布
wrangler pages publish .vercel/output/static
```

#### 通过 Cloudflare Dashboard
1. 访问 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 选择 "Pages" → "Create a project"
3. 连接 GitHub 仓库
4. 配置构建：
   - Build command: `pnpm run build`
   - Build output directory: `.next`
   - Framework preset: `Next.js`

**环境变量配置**：
- Settings → Environment Variables
- 添加 `MUSIC_NETEASE_COOKIE` 和 `MUSIC_AUTH_SALT`

**优势**：
- ✅ 全球 CDN（速度极快）
- ✅ 无限带宽（免费）
- ✅ DDoS 防护
- ✅ 中国大陆访问较好

---

### 方式 3: 自托管服务器（VPS/云服务器）

#### 使用 Node.js 运行

```powershell
# 1. 构建项目
pnpm run build

# 2. 启动生产服务器
pnpm run start
```

#### 使用 PM2 守护进程
```bash
# 1. 安装 PM2
npm i -g pm2

# 2. 启动应用
pm2 start npm --name "m3u8-player" -- start

# 3. 设置开机自启
pm2 startup
pm2 save

# 4. 查看日志
pm2 logs m3u8-player

# 5. 重启应用
pm2 restart m3u8-player
```

#### Nginx 反向代理配置
创建 `/etc/nginx/sites-available/m3u8-player`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/m3u8-player /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 配置 SSL（Let's Encrypt）
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

**适用场景**：
- ✅ 需要完全控制
- ✅ 特殊网络需求
- ✅ 私有化部署

---

### 方式 4: Docker 部署

#### 创建 Dockerfile
```dockerfile
# 生产环境 Dockerfile
FROM node:18-alpine AS base

# 依赖安装阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
RUN pnpm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 修改 next.config.mjs
在 `next.config.mjs` 中添加：
```javascript
const nextConfig = {
  output: 'standalone', // 启用独立输出
  // ...其他配置
};
```

#### 创建 docker-compose.yml
```yaml
version: '3.8'

services:
  m3u8-player:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MUSIC_NETEASE_COOKIE=${MUSIC_NETEASE_COOKIE}
      - MUSIC_AUTH_SALT=${MUSIC_AUTH_SALT}
    restart: unless-stopped
```

#### 部署命令
```bash
# 构建镜像
docker build -t m3u8-player .

# 运行容器
docker run -p 3000:3000 -d m3u8-player

# 或使用 docker-compose
docker-compose up -d
```

**适用场景**：
- ✅ 容器化部署
- ✅ Kubernetes 集群
- ✅ 易于迁移和扩展

---

### 方式 5: 其他平台

#### Netlify
```powershell
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

#### Railway
1. 访问 [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. 选择仓库 `guogms/m3u8-player`
4. 自动检测并部署

#### Render
1. 访问 [render.com](https://render.com)
2. "New Web Service"
3. 连接 GitHub 仓库
4. 配置：
   - Build Command: `pnpm install && pnpm run build`
   - Start Command: `pnpm run start`

---

## 🔍 部署后检查

### 1. 健康检查
```bash
# 检查主页
curl https://your-domain.com

# 检查 API
curl https://your-domain.com/api/music?server=netease&type=search&id=周杰伦&limit=5
```

### 2. 性能测试
- 使用 [PageSpeed Insights](https://pagespeed.web.dev/)
- 使用 [WebPageTest](https://www.webpagetest.org/)

### 3. 测试音乐功能
访问：`https://your-domain.com/music-test.html`

---

## 📊 推荐部署方案对比

| 平台 | 难度 | 速度 | 成本 | 中国访问 | 推荐度 |
|------|------|------|------|----------|--------|
| Vercel | ⭐ 最简单 | ⭐⭐⭐⭐ | 免费 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Cloudflare Pages | ⭐⭐ | ⭐⭐⭐⭐⭐ | 免费 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 自托管 VPS | ⭐⭐⭐⭐ | 看配置 | $5-20/月 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Docker | ⭐⭐⭐ | 看配置 | 看部署位置 | 看部署位置 | ⭐⭐⭐⭐ |
| Railway | ⭐⭐ | ⭐⭐⭐ | $5/月起 | ⭐⭐ | ⭐⭐⭐ |

---

## 🎯 快速决策指南

### 新手/快速部署 → Vercel
```powershell
vercel --prod
```

### 中国用户为主 → Cloudflare Pages
```powershell
npx @cloudflare/next-on-pages
wrangler pages publish
```

### 需要完全控制 → VPS + PM2
```bash
pm2 start npm --name "m3u8-player" -- start
```

### 容器化需求 → Docker
```bash
docker-compose up -d
```

---

## 🔧 常见问题

### Q: 部署后 API 返回 500 错误
**A**: 检查环境变量是否正确配置，特别是 `MUSIC_NETEASE_COOKIE`

### Q: 静态资源 404
**A**: 确保 `public` 目录被正确复制到部署环境

### Q: 音乐播放失败
**A**: 检查 CORS 设置和音乐平台的访问限制

### Q: 构建失败
**A**: 确保 Node.js 版本 >= 18，pnpm 版本正确

---

## 📞 需要帮助？

- 查看 Next.js 官方文档: https://nextjs.org/docs/deployment
- Vercel 部署文档: https://vercel.com/docs
- Cloudflare Pages 文档: https://developers.cloudflare.com/pages

---

**祝您部署顺利！** 🎉
