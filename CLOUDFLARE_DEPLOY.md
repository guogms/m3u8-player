# Cloudflare Pages 部署说明

## 重要配置

### 1. Cloudflare Pages 设置

在 Cloudflare Pages 控制台中配置：

- **构建命令**: `pnpm run pages:build`
- **构建输出目录**: `.vercel/output/static`
- **Node.js 版本**: 18 或更高

### 2. 环境变量

确保在 Cloudflare Pages 设置中添加必要的环境变量（如有）。

### 3. 部署方式

#### 方法一：通过 Git 自动部署（推荐）
1. 连接你的 GitHub/GitLab 仓库到 Cloudflare Pages
2. 每次推送代码时会自动构建和部署

#### 方法二：本地命令行部署
```bash
# 安装依赖
pnpm install

# 构建项目
pnpm run pages:build

# 部署到 Cloudflare Pages
pnpm run deploy
```

### 4. 兼容性注意事项

- 某些 Node.js 模块可能在 Cloudflare Workers 运行时中不可用
- Edge Runtime 路由（如 `/api/music`, `/api/player` 等）应该可以正常工作
- 如果遇到兼容性问题，可能需要调整 API 路由的实现

### 5. wrangler.toml 配置说明

```toml
name = "m3u8-player"
compatibility_date = "2025-12-15"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"
```

- `nodejs_compat`: 启用 Node.js 兼容性
- `pages_build_output_dir`: 指定构建输出目录

## 故障排查

如果部署失败：

1. **检查 API 路由兼容性**: 确保所有 API 路由使用的模块与 Cloudflare Workers 兼容
2. **查看构建日志**: 在 Cloudflare Pages 控制台查看详细的构建日志
3. **测试本地构建**: 运行 `pnpm run preview` 在本地测试构建结果

## 参考资料

- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
