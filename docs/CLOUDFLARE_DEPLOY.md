# 🚀 Cloudflare Pages 部署指南

本指南介绍如何使用 [@opennextjs/cloudflare](https://opennext.js.org/cloudflare) 将 Next.js 应用部署到 Cloudflare Pages。

## ⚠️ Windows 用户重要提示

**OpenNext 在 Windows 上有兼容性问题**，需要使用符号链接权限。推荐以下方法：

### 方式一：使用 WSL (Windows Subsystem for Linux) - 推荐

1. 安装 WSL：
   ```powershell
   wsl --install
   ```

2. 在 WSL 中进入项目目录：
   ```bash
   cd /mnt/d/bak/projects/m3u8-player
   ```

3. 在 WSL 中执行构建和部署命令

### 方式二：使用 GitHub Actions 自动部署 - 最简单

使用 GitHub Actions 自动部署，无需在本地构建。参见下文的 "GitHub Actions 自动部署" 部分。

### 方式三：使用管理员权限（不推荐）

以管理员身份运行 PowerShell，但可能仍会遇到问题。

## 📋 前置要求

1. **Cloudflare 账号**：在 [Cloudflare](https://dash.cloudflare.com/) 注册账号
2. **Node.js 环境**：确保已安装 Node.js (推荐 18.x 或更高版本)
3. **pnpm 包管理器**：本项目使用 pnpm

## 🔧 环境准备

### 1. 安装依赖

项目已经包含所需依赖，如果是首次使用，运行：

```powershell
pnpm install
```

### 2. 登录 Cloudflare

首次部署需要登录 Cloudflare 账号：

```powershell
pnpm wrangler login
```

这将打开浏览器，授权 Wrangler CLI 访问你的 Cloudflare 账号。

## 🚢 部署流程

### 方式一：命令行部署（推荐）

#### 1. 构建应用

```powershell
pnpm run pages:build
```

这将：
- 运行 `next build` 构建 Next.js 应用
- 使用 `@opennextjs/cloudflare` 转换输出为 Cloudflare Workers 兼容格式
- 生成 `.open-next/worker` 目录

#### 2. 部署到 Cloudflare Pages

```powershell
pnpm run pages:deploy
```

首次部署时，Wrangler 会提示你创建新项目，按照提示操作即可。

#### 3. 访问应用

部署成功后，控制台会显示应用的 URL，通常格式为：
```
https://m3u8-player.pages.dev
```

### 方式二：本地预览

在部署前，可以在本地预览 Cloudflare 环境：

```powershell
# 先构建
pnpm run pages:build

# 本地预览
pnpm run pages:dev
```

访问 `http://localhost:8788` 即可预览。

## 🤖 GitHub Actions 自动部署

推荐使用 GitHub Actions 自动部署到 Cloudflare Pages，无需在本地构建。

### 1. 获取 Cloudflare API Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **My Profile** → **API Tokens**
3. 点击 **Create Token**
4. 选择 **Edit Cloudflare Workers** 模板或创建自定义 token
5. 权限设置：
   - Account: Cloudflare Pages - Edit
   - Zone: Workers Scripts - Edit (如果使用 Workers)
6. 复制生成的 API Token

### 2. 配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets：

1. 进入仓库的 **Settings** → **Secrets and variables** → **Actions**
2. 添加以下 Secrets：
   - `CLOUDFLARE_API_TOKEN`: 上一步获取的 API Token
   - `CLOUDFLARE_ACCOUNT_ID`: 你的 Cloudflare Account ID（在 Dashboard 主页可以找到）

### 3. 创建 GitHub Actions Workflow

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy to Cloudflare Pages
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build for Cloudflare
        run: pnpm run pages:build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy .open-next/worker --project-name=m3u8-player
```

### 4. 推送代码触发部署

```bash
git add .
git commit -m "Add Cloudflare deployment"
git push origin main
```

GitHub Actions 会自动构建并部署到 Cloudflare Pages。

## 🌐 自定义域名

### 1. 在 Cloudflare Dashboard 中配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** → 选择你的项目
3. 进入 **自定义域** 选项卡
4. 添加你的域名

### 2. DNS 配置

Cloudflare 会自动为你配置 DNS 记录（如果域名托管在 Cloudflare）。

## ⚙️ 环境变量配置

如果应用需要环境变量（如 Cookie、API 密钥等）：

### 方式一：通过 Dashboard 配置

1. 进入 Cloudflare Dashboard → Pages → 你的项目
2. 进入 **设置** → **环境变量**
3. 添加需要的环境变量

### 方式二：通过 wrangler.toml 配置

编辑 `wrangler.toml`：

```toml
name = "m3u8-player"
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2024-12-16"
pages_build_output_dir = ".open-next/worker"

[vars]
MUSIC_API_SALT = "your_salt_here"
```

⚠️ **注意**：敏感信息（如 Cookie）应该使用 **Secrets**，而不是环境变量。

### 配置 Secrets

```powershell
# 添加 Secret
pnpm wrangler pages secret put NETEASE_COOKIE
# 按提示输入 Cookie 值

pnpm wrangler pages secret put TENCENT_COOKIE
# 按提示输入 Cookie 值
```

## 🔄 更新部署

应用代码更新后，重新构建并部署：

```powershell
# 构建新版本
pnpm run pages:build

# 部署更新
pnpm run pages:deploy
```

## 🐛 常见问题

### 1. 构建失败

**问题**：`pnpm run pages:build` 失败

**解决方案**：
- 确保 Next.js 构建成功：`pnpm build`
- 检查是否有语法错误或类型错误
- 查看构建日志了解具体错误

### 2. 部署后 API 不工作

**问题**：部署后 API 路由返回错误

**解决方案**：
- 检查环境变量是否正确配置
- 确认 Cookie 和 API 密钥已添加为 Secrets
- 查看 Cloudflare Dashboard 中的实时日志

### 3. 图片或静态资源无法加载

**问题**：部署后图片显示失败

**解决方案**：
- 确保 `next.config.mjs` 中设置了 `images: { unoptimized: true }`
- 检查静态资源路径是否正确

### 4. Next.js 版本不兼容

**问题**：警告 `unmet peer next@...`

**解决方案**：
- 当前使用 Next.js 14.2.16，已经过测试可以工作
- 如果遇到问题，可以考虑升级 Next.js 版本
- 或等待 `@opennextjs/cloudflare` 支持更多版本

## 📊 监控和日志

### 查看实时日志

在 Cloudflare Dashboard 中：
1. 进入你的 Pages 项目
2. 进入 **日志** 或 **实时日志** 选项卡
3. 查看应用运行日志

### 使用 Wrangler 查看日志

```powershell
pnpm wrangler pages deployment tail
```

## 🔧 高级配置

### 配置自定义构建命令

如果需要修改构建流程，可以编辑 `package.json` 中的脚本：

```json
{
  "scripts": {
    "pages:build": "npx @opennextjs/cloudflare",
    "pages:deploy": "wrangler pages deploy .open-next/worker --project-name=m3u8-player",
    "pages:dev": "wrangler pages dev .open-next/worker --compatibility-flags=nodejs_compat"
  }
}
```

### 配置 Cloudflare Workers 选项

在 `wrangler.toml` 中可以配置更多选项：

```toml
name = "m3u8-player"
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2024-12-16"
pages_build_output_dir = ".open-next/worker"

# 配置 Workers 的兼容性
[build]
command = "pnpm run pages:build"
```

## 📚 相关资源

- [OpenNext.js Cloudflare 文档](https://opennext.js.org/cloudflare)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)

## 💡 最佳实践

1. **使用 Git 集成**：推荐连接 GitHub 仓库，实现自动部署
2. **环境隔离**：为开发和生产环境使用不同的 Cloudflare Pages 项目
3. **监控日志**：定期查看日志，及时发现问题
4. **性能优化**：利用 Cloudflare CDN 加速静态资源
5. **安全性**：敏感信息使用 Secrets 管理，不要提交到代码仓库

## 🎯 下一步

- 配置自定义域名
- 设置 CI/CD 自动部署
- 启用 Cloudflare Analytics
- 配置缓存策略优化性能

---

如有问题，请查阅 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/) 或提交 Issue。
