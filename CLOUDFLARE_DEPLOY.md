# Cloudflare Pages 部署说明

## ⚠️ 重要提示

**兼容性问题**: 项目中的某些 API 路由使用了 Node.js 特定功能，不完全兼容 Cloudflare Workers。

### 兼容性状态

- ✅ **完全兼容**: `/api/player`, `/api/forward`, `/api/files`, 主页面
- ⚠️ **部分兼容**: `/api/music` (使用 Node.js crypto 模块)
- ❌ **不兼容**: `/api/send-email` (使用 nodemailer, 需要 Node.js)

**详细分析**: 查看 [CLOUDFLARE_COMPATIBILITY_REPORT.md](CLOUDFLARE_COMPATIBILITY_REPORT.md)

---

## 🚀 快速部署（方案一：移除不兼容路由）

### 步骤 1: 临时禁用不兼容的路由

将 `/api/send-email/route.ts` 重命名为 `/api/send-email/route.ts.bak` 或删除

```bash
# PowerShell
Move-Item app/api/send-email/route.ts app/api/send-email/route.ts.bak
```

### 步骤 2: 修改 `/api/music` 为 Edge Runtime

**重要**: `/api/music` 目前使用 `nodejs` runtime 和 crypto 模块。
有两个选择：

**选择 A (推荐)**: 保持 nodejs runtime，依赖 Cloudflare 的 nodejs_compat
- 在 Cloudflare Pages 上可能工作，但有限制
- 不需要修改代码

**选择 B**: 改写为 Web Crypto API
- 需要重写 crypto 加密逻辑
- 更好的性能和兼容性

目前我们先使用**选择 A**，如果部署失败再考虑选择 B。

### 步骤 3: 提交代码

```bash
git add .
git commit -m "Prepare for Cloudflare Pages deployment"
git push
```

### 步骤 4: 在 Cloudflare Pages 配置

访问 [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages)

#### 构建设置
- **框架预设**: Next.js (Static HTML Export)
- **构建命令**: `npx @cloudflare/next-on-pages@1`
- **构建输出目录**: `.vercel/output/static`
- **Root 目录**: `/`（留空）

#### 环境变量
- **Node.js 版本**: 添加环境变量 `NODE_VERSION=18`

#### 构建配置
添加以下环境变量（如果需要）:
- `MUSIC_API_SALT`: 音乐 API 加密盐值
- `MUSIC_USE_SERVER_COOKIE`: `true` 或 `false`

---

## 🔧 完整兼容方案（方案二：修复所有路由）

如果你需要保留所有功能并确保完全兼容，按照以下步骤操作：

### 修复 `/api/send-email`

有两个选择：

#### 选择 1: 使用 Cloudflare Email Workers (推荐)

需要配置 Cloudflare Email Routing:
https://developers.cloudflare.com/email-routing/email-workers/

#### 选择 2: 使用外部邮件 API

推荐使用 [Resend](https://resend.com/):

```typescript
// app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json();
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@yourdomain.com',
        to,
        subject,
        html,
      }),
    });
    
    const result = await response.json();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

---

## 📝 部署前检查清单

- [ ] 已阅读兼容性报告
- [ ] `/api/send-email` 已禁用或重写
- [ ] 确认 `nodejs_compat` 在 wrangler.toml 中已启用
- [ ] 本地构建成功: `pnpm run build`
- [ ] pnpm-lock.yaml 已更新并提交
- [ ] 环境变量已在 Cloudflare Pages 中配置

---

## 🔍 故障排查

### 构建失败: "Cannot install with frozen-lockfile"

```bash
# 本地更新 lockfile
pnpm install

# 提交更新
git add pnpm-lock.yaml
git commit -m "Update pnpm-lock.yaml"
git push
```

### 构建失败: "Missing entry-point"

确保 Cloudflare Pages 的构建命令是:
```
npx @cloudflare/next-on-pages@1
```

而不是:
```
pnpm run pages:build  # ❌ 在 Windows 上不工作
```

### 运行时错误: "crypto is not defined"

`/api/music` 路由使用了 Node.js crypto。解决方案:

1. 确保 wrangler.toml 有: `compatibility_flags = ["nodejs_compat"]`
2. 或者改写 crypto 逻辑使用 Web Crypto API

### API 路由返回 500 错误

检查 Cloudflare Pages 日志:
1. 进入项目控制台
2. 点击 "Functions" 选项卡
3. 查看实时日志

常见问题:
- 环境变量未设置
- 使用了不兼容的 Node.js API
- 超时（Cloudflare Workers 有 CPU 时间限制）

---

## 🌐 部署到其他平台（备选方案）

如果 Cloudflare Workers 的限制太多，考虑:

### Vercel (最佳 Next.js 支持)
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Netlify
```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

---

## 📚 参考资料

- [兼容性详细报告](CLOUDFLARE_COMPATIBILITY_REPORT.md)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare Workers Runtime](https://developers.cloudflare.com/workers/runtime-apis/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)

