# 快速部署脚本 - 一键启动
# 使用方法: .\quick-deploy.ps1

Write-Host "=== 快速部署 M3U8 音乐播放器 ===" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Docker 未运行。请先启动 Docker Desktop。" -ForegroundColor Red
    exit 1
}

Write-Host "正在构建并启动服务..." -ForegroundColor Yellow
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ 部署成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "访问地址: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "常用命令:" -ForegroundColor Yellow
    Write-Host "  查看日志: docker-compose logs -f" -ForegroundColor Gray
    Write-Host "  停止服务: docker-compose stop" -ForegroundColor Gray
    Write-Host "  重启服务: docker-compose restart" -ForegroundColor Gray
    Write-Host ""
    
    # 询问是否查看日志
    $viewLogs = Read-Host "是否查看实时日志? (y/n)"
    if ($viewLogs -eq "y") {
        Write-Host "`n显示日志 (按 Ctrl+C 退出)..." -ForegroundColor Yellow
        docker-compose logs -f --tail=50
    }
} else {
    Write-Host ""
    Write-Host "部署失败，请查看错误信息" -ForegroundColor Red
    exit 1
}
