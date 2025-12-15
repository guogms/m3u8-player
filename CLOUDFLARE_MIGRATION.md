# Cloudflare 部署迁移说明

## 变更内容

本次更新将项目的 Cloudflare 部署方式从旧的错误方式迁移到官方推荐的 [@opennextjs/cloudflare](https://opennext.js.org/cloudflare) 方案。

## 主要变更

### 1. 依赖更新

- ✅ 添加 `@opennextjs/cloudflare` - 官方 OpenNext Cloudflare 适配器
- ✅ 更新 `wrangler` 到最新版本
- ❌ 移除 `@cloudflare/next-on-pages` - 旧的部署方式
- ❌ 移除 `vercel` CLI

### 2. 构建脚本更新

新增以下 npm 脚本：

```json
{
  "pages:build": "npx @opennextjs/cloudflare build",
  "pages:deploy": "npx @opennextjs/cloudflare deploy",
  "pages:dev": "npx @opennextjs/cloudflare preview"
}
```

### 3. 配置文件

- **wrangler.toml**: 更新为 Cloudflare Pages 配置
- **next.config.mjs**: 移除 Docker standalone 相关注释
- **open-next.config.ts**: 自动生成的 OpenNext 配置文件

### 4. 部署方式

#### 推荐方式：GitHub Actions

- 自动部署，无需本地构建
- 避免 Windows 兼容性问题
- 配置文件：`.github/workflows/deploy.yml`

#### 手动部署

- **Windows 用户**: 使用 WSL 或 GitHub Actions
- **Linux/Mac 用户**: 直接使用命令行

### 5. 文档更新

- ✅ 新增 `docs/CLOUDFLARE_DEPLOY.md` - 完整的 Cloudflare 部署指南
- ✅ 更新 `README.md` - 更新部署说明，添加 Windows 兼容性警告

### 6. Git 忽略

添加 `.open-next/` 到 `.gitignore`，这是构建输出目录。

## 部署流程对比

### 旧方式（已移除）

```bash
pnpm build
wrangler pages deploy .next
```

❌ 不兼容 Next.js App Router
❌ 不支持服务端渲染
❌ 功能受限

### 新方式（当前）

```bash
pnpm run pages:build
pnpm run pages:deploy
```

✅ 完整支持 Next.js 14/15 特性
✅ 支持 App Router
✅ 支持服务端渲染 (SSR)
✅ 支持 API Routes
✅ 官方推荐方案

## Windows 用户注意事项

OpenNext 在 Windows 上构建时会遇到符号链接权限问题（EPERM 错误）。解决方案：

1. **推荐**: 使用 GitHub Actions 自动部署
2. 使用 WSL (Windows Subsystem for Linux)
3. 使用 Docker 构建环境

## 下一步

1. 配置 GitHub Secrets（如果使用 GitHub Actions）
2. 推送代码触发自动部署
3. 或在 WSL/Linux 环境中手动部署

详细说明请参阅：[docs/CLOUDFLARE_DEPLOY.md](./docs/CLOUDFLARE_DEPLOY.md)
