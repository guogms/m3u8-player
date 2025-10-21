# 快速部署脚本 (PowerShell)
# 使用方法: .\deploy.ps1 [platform]
# 平台选项: vercel, cloudflare, docker, pm2

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('vercel', 'cloudflare', 'docker', 'pm2')]
    [string]$Platform
)

Write-Host "🚀 开始部署到 $Platform..." -ForegroundColor Green

switch ($Platform) {
    'vercel' {
        Write-Host "📦 使用 Vercel 部署..." -ForegroundColor Cyan
        
        # 检查是否安装了 vercel
        if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
            Write-Host "❌ 未找到 Vercel CLI，正在安装..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        Write-Host "✅ 开始部署..." -ForegroundColor Green
        vercel --prod
    }
    
    'cloudflare' {
        Write-Host "📦 使用 Cloudflare Pages 部署..." -ForegroundColor Cyan
        
        # 检查是否安装了 wrangler
        if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
            Write-Host "❌ 未找到 Wrangler CLI，正在安装..." -ForegroundColor Yellow
            npm install -g wrangler
        }
        
        Write-Host "✅ 构建项目..." -ForegroundColor Green
        pnpm run build
        
        Write-Host "✅ 部署到 Cloudflare Pages..." -ForegroundColor Green
        npx @cloudflare/next-on-pages
        wrangler pages deploy .vercel/output/static
    }
    
    'docker' {
        Write-Host "📦 使用 Docker 部署..." -ForegroundColor Cyan
        
        # 检查是否安装了 docker
        if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
            Write-Host "❌ 未找到 Docker，请先安装 Docker Desktop" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ 构建 Docker 镜像..." -ForegroundColor Green
        $env:BUILD_STANDALONE = "true"
        docker build -t m3u8-player .
        
        Write-Host "✅ 停止旧容器（如果存在）..." -ForegroundColor Green
        docker stop m3u8-player 2>$null
        docker rm m3u8-player 2>$null
        
        Write-Host "✅ 启动新容器..." -ForegroundColor Green
        docker run -d `
            --name m3u8-player `
            -p 3000:3000 `
            --restart unless-stopped `
            m3u8-player
        
        Write-Host "✅ 容器已启动！" -ForegroundColor Green
        Write-Host "🌐 访问: http://localhost:3000" -ForegroundColor Cyan
        docker ps -f name=m3u8-player
    }
    
    'pm2' {
        Write-Host "📦 使用 PM2 部署..." -ForegroundColor Cyan
        
        # 检查是否安装了 pm2
        if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
            Write-Host "❌ 未找到 PM2，正在安装..." -ForegroundColor Yellow
            npm install -g pm2
        }
        
        Write-Host "✅ 安装依赖..." -ForegroundColor Green
        pnpm install --frozen-lockfile
        
        Write-Host "✅ 构建项目..." -ForegroundColor Green
        pnpm run build
        
        Write-Host "✅ 创建日志目录..." -ForegroundColor Green
        New-Item -ItemType Directory -Force -Path logs | Out-Null
        
        Write-Host "✅ 使用 PM2 启动应用..." -ForegroundColor Green
        pm2 delete m3u8-player 2>$null
        pm2 start ecosystem.config.json
        
        Write-Host "✅ 保存 PM2 配置..." -ForegroundColor Green
        pm2 save
        
        Write-Host "✅ 应用已启动！" -ForegroundColor Green
        Write-Host "🌐 访问: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "📊 查看状态: pm2 status" -ForegroundColor Cyan
        Write-Host "📝 查看日志: pm2 logs m3u8-player" -ForegroundColor Cyan
        pm2 status
    }
}

Write-Host ""
Write-Host "✨ 部署完成！" -ForegroundColor Green
Write-Host "📚 查看完整文档: DEPLOYMENT.md" -ForegroundColor Cyan
