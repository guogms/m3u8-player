# Docker 部署脚本 (Windows PowerShell)

Write-Host "=== M3U8 音乐播放器 Docker 部署 ===" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker 是否运行
Write-Host "检查 Docker 状态..." -ForegroundColor Yellow
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Docker 未运行或未安装。请先启动 Docker Desktop。" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker 运行正常" -ForegroundColor Green

# 检查 docker-compose 是否可用
Write-Host "检查 Docker Compose..." -ForegroundColor Yellow
docker-compose version > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Docker Compose 未找到。" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker Compose 可用" -ForegroundColor Green
Write-Host ""

# 询问用户操作
Write-Host "请选择操作:" -ForegroundColor Cyan
Write-Host "1) 构建并启动 (首次部署或更新代码后)"
Write-Host "2) 启动服务"
Write-Host "3) 停止服务"
Write-Host "4) 查看日志"
Write-Host "5) 重启服务"
Write-Host "6) 停止并删除所有容器"
Write-Host "0) 退出"
Write-Host ""

$choice = Read-Host "请输入选项 (0-6)"

switch ($choice) {
    "1" {
        Write-Host "`n开始构建并启动服务..." -ForegroundColor Yellow
        docker-compose up -d --build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✓ 服务已启动！" -ForegroundColor Green
            Write-Host "访问地址: http://localhost:3000" -ForegroundColor Cyan
            Write-Host "查看日志: docker-compose logs -f" -ForegroundColor Gray
        }
    }
    "2" {
        Write-Host "`n启动服务..." -ForegroundColor Yellow
        docker-compose up -d
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✓ 服务已启动！" -ForegroundColor Green
            Write-Host "访问地址: http://localhost:3000" -ForegroundColor Cyan
        }
    }
    "3" {
        Write-Host "`n停止服务..." -ForegroundColor Yellow
        docker-compose stop
        Write-Host "✓ 服务已停止" -ForegroundColor Green
    }
    "4" {
        Write-Host "`n显示日志 (按 Ctrl+C 退出)..." -ForegroundColor Yellow
        docker-compose logs -f --tail=100
    }
    "5" {
        Write-Host "`n重启服务..." -ForegroundColor Yellow
        docker-compose restart
        Write-Host "✓ 服务已重启" -ForegroundColor Green
    }
    "6" {
        Write-Host "`n停止并删除所有容器..." -ForegroundColor Yellow
        $confirm = Read-Host "确认删除? (y/n)"
        if ($confirm -eq "y") {
            docker-compose down
            Write-Host "✓ 容器已删除" -ForegroundColor Green
        } else {
            Write-Host "已取消" -ForegroundColor Gray
        }
    }
    "0" {
        Write-Host "退出" -ForegroundColor Gray
        exit 0
    }
    default {
        Write-Host "无效选项" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
