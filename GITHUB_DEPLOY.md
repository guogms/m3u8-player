# GitHub Pages 部署指南

## 部署方式

### 方式一：GitHub Actions 自动部署（推荐）

1. **启用 GitHub Pages**
   - 进入你的 GitHub 仓库
   - 点击 Settings → Pages
   - Source 选择 "GitHub Actions"

2. **推送代码**
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   git push origin main
   ```

3. **自动部署**
   - 代码推送后会自动触发 GitHub Actions
   - 等待几分钟构建完成
   - 访问 `https://<你的用户名>.github.io/<仓库名>/`

### 方式二：手动部署

使用命令行手动部署：

```bash
# 本地部署
pnpm run deploy:github
```

## 配置说明

### Base Path 配置

如果需要自定义 base path，可以在构建时设置环境变量：

```bash
NEXT_PUBLIC_BASE_PATH=/my-app pnpm run build:github
```

### 自定义域名

1. 在仓库根目录创建 `public/CNAME` 文件
2. 添加你的域名，例如：`example.com`
3. 在域名 DNS 设置中添加 CNAME 记录指向 `<你的用户名>.github.io`

## 注意事项

1. **静态导出限制**
   - GitHub Pages 仅支持静态网站
   - API Routes 不会工作（`/api/*` 路由）
   - 动态路由需要使用 `generateStaticParams`
   - 无法使用服务器端渲染（SSR）

2. **API 替代方案**
   - 使用外部 API 服务
   - 部署 API 到其他平台（Vercel、Cloudflare Workers 等）
   - 使用客户端数据获取

3. **图片优化**
   - 已配置 `images.unoptimized: true`
   - GitHub Pages 不支持 Next.js 图片优化

## 故障排除

### 页面显示 404
- 检查 GitHub Pages 设置是否正确
- 确认 base path 配置正确
- 查看 GitHub Actions 构建日志

### 资源加载失败
- 确认 `NEXT_PUBLIC_BASE_PATH` 环境变量设置正确
- 检查资源路径是否包含正确的 base path

### Actions 构建失败
- 查看 Actions 日志中的错误信息
- 确认 `pnpm` 版本配置正确
- 检查依赖是否安装成功

## 相关链接

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions](https://docs.github.com/en/actions)
