#!/bin/bash
# 快速部署脚本 (Bash)
# 使用方法: ./deploy.sh [platform]
# 平台选项: vercel, cloudflare, docker, pm2

set -e

PLATFORM=$1

if [ -z "$PLATFORM" ]; then
    echo "❌ 请指定部署平台！"
    echo "使用方法: ./deploy.sh [vercel|cloudflare|docker|pm2]"
    exit 1
fi

echo "🚀 开始部署到 $PLATFORM..."

case $PLATFORM in
    vercel)
        echo "📦 使用 Vercel 部署..."
        
        # 检查是否安装了 vercel
        if ! command -v vercel &> /dev/null; then
            echo "❌ 未找到 Vercel CLI，正在安装..."
            npm install -g vercel
        fi
        
        echo "✅ 开始部署..."
        vercel --prod
        ;;
        
    cloudflare)
        echo "📦 使用 Cloudflare Pages 部署..."
        
        # 检查是否安装了 wrangler
        if ! command -v wrangler &> /dev/null; then
            echo "❌ 未找到 Wrangler CLI，正在安装..."
            npm install -g wrangler
        fi
        
        echo "✅ 构建项目..."
        pnpm run build
        
        echo "✅ 部署到 Cloudflare Pages..."
        npx @cloudflare/next-on-pages
        wrangler pages deploy .vercel/output/static
        ;;
        
    docker)
        echo "📦 使用 Docker 部署..."
        
        # 检查是否安装了 docker
        if ! command -v docker &> /dev/null; then
            echo "❌ 未找到 Docker，请先安装 Docker"
            exit 1
        fi
        
        echo "✅ 构建 Docker 镜像..."
        export BUILD_STANDALONE=true
        docker build -t m3u8-player .
        
        echo "✅ 停止旧容器（如果存在）..."
        docker stop m3u8-player 2>/dev/null || true
        docker rm m3u8-player 2>/dev/null || true
        
        echo "✅ 启动新容器..."
        docker run -d \
            --name m3u8-player \
            -p 3000:3000 \
            --restart unless-stopped \
            m3u8-player
        
        echo "✅ 容器已启动！"
        echo "🌐 访问: http://localhost:3000"
        docker ps -f name=m3u8-player
        ;;
        
    pm2)
        echo "📦 使用 PM2 部署..."
        
        # 检查是否安装了 pm2
        if ! command -v pm2 &> /dev/null; then
            echo "❌ 未找到 PM2，正在安装..."
            npm install -g pm2
        fi
        
        echo "✅ 安装依赖..."
        pnpm install --frozen-lockfile
        
        echo "✅ 构建项目..."
        pnpm run build
        
        echo "✅ 创建日志目录..."
        mkdir -p logs
        
        echo "✅ 使用 PM2 启动应用..."
        pm2 delete m3u8-player 2>/dev/null || true
        pm2 start ecosystem.config.json
        
        echo "✅ 保存 PM2 配置..."
        pm2 save
        
        echo "✅ 应用已启动！"
        echo "🌐 访问: http://localhost:3000"
        echo "📊 查看状态: pm2 status"
        echo "📝 查看日志: pm2 logs m3u8-player"
        pm2 status
        ;;
        
    *)
        echo "❌ 不支持的平台: $PLATFORM"
        echo "支持的平台: vercel, cloudflare, docker, pm2"
        exit 1
        ;;
esac

echo ""
echo "✨ 部署完成！"
echo "📚 查看完整文档: DEPLOYMENT.md"
