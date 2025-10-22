# M3U8 音乐播放器 - Docker 部署指南

## 📋 前置要求

- Docker (版本 20.10+)
- Docker Compose (版本 2.0+)

## ⚠️ 重要提示

**Windows 用户请注意：** 
- 本项目使用 Docker 构建，可以避免 Windows 符号链接权限问题
- 推荐在 WSL2 或直接使用 Docker Desktop 构建
- 或者以管理员身份运行 PowerShell 进行构建

## 🚀 快速开始

### 1. 构建并启动容器

```powershell
# 构建并启动（首次运行）
docker-compose up -d --build

# 或者直接启动（如果已经构建过）
docker-compose up -d
```

### 2. 访问应用

打开浏览器访问：`http://localhost:3000`

### 3. 查看日志

```powershell
# 查看所有日志
docker-compose logs -f

# 只查看最近 100 行
docker-compose logs -f --tail=100
```

### 4. 停止服务

```powershell
# 停止容器
docker-compose stop

# 停止并删除容器
docker-compose down

# 停止并删除容器、网络、镜像
docker-compose down --rmi all
```

## 🔧 配置说明

### 环境变量

如果需要配置环境变量：

1. 复制环境变量示例文件：
   ```powershell
   cp .env.example .env.local
   ```

2. 编辑 `.env.local` 文件

3. 在 `docker-compose.yml` 中添加环境变量配置：
   ```yaml
   environment:
     - NODE_ENV=production
     - YOUR_VAR=value
   ```

### 端口修改

如果需要修改端口，编辑 `docker-compose.yml`：

```yaml
ports:
  - "8080:3000"  # 将本地端口改为 8080
```

## 📊 常用命令

```powershell
# 重启服务
docker-compose restart

# 查看运行状态
docker-compose ps

# 查看资源使用情况
docker stats m3u8-player

# 进入容器内部
docker-compose exec m3u8-player sh

# 重新构建镜像
docker-compose build --no-cache

# 查看健康检查状态
docker inspect --format='{{json .State.Health}}' m3u8-player
```

## 🐛 故障排查

### 1. Windows 构建问题

**问题：** `EPERM: operation not permitted, symlink`

**解决方案：**
- 方案 A：使用 Docker 构建（推荐，已配置好）
- 方案 B：在 WSL2 中构建
- 方案 C：以管理员身份运行 PowerShell

**注意：** 项目已配置为在 Docker 中构建，不需要在本地 Windows 环境构建 standalone 模式。

### 2. 构建失败

```powershell
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

### 2. 容器无法启动

```powershell
# 查看详细日志
docker-compose logs m3u8-player

# 检查端口是否被占用
netstat -ano | findstr :3000
```

### 3. 应用无法访问

- 检查防火墙设置
- 确认端口映射正确
- 查看容器健康状态：`docker-compose ps`

## 🔄 更新应用

```powershell
# 1. 拉取最新代码
git pull

# 2. 停止当前容器
docker-compose down

# 3. 重新构建并启动
docker-compose up -d --build
```

## 📦 生产环境优化

### 添加 Nginx 反向代理

取消 `docker-compose.yml` 中 nginx 服务的注释，并创建 Nginx 配置文件。

### 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

## 🔐 安全建议

1. 不要将 `.env.local` 提交到 Git
2. 生产环境使用 HTTPS
3. 定期更新 Docker 镜像
4. 使用非 root 用户运行（已在 Dockerfile 中配置）

## 📝 目录结构

```
.
├── Dockerfile              # Docker 镜像构建文件
├── docker-compose.yml      # Docker Compose 配置
├── .dockerignore          # Docker 构建忽略文件
├── .env.example           # 环境变量示例
└── DOCKER_DEPLOY.md       # 本文档
```
