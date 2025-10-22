# 🚀 Docker 快速部署总结

## ✅ 已完成的工作

### 1. 修复的问题

- ✅ 修复 API 路由动态渲染问题（添加 `force-dynamic` 配置）
- ✅ 修复 Windows 符号链接权限问题（调整 Docker 配置）
- ✅ 优化 Dockerfile 以避免 standalone 模式在 Windows 上的问题

### 2. 创建的文件

| 文件 | 说明 |
|------|------|
| `Dockerfile` | Docker 镜像构建配置（多阶段构建） |
| `docker-compose.yml` | Docker Compose 编排配置 |
| `.dockerignore` | Docker 构建忽略规则 |
| `.env.example` | 环境变量示例文件 |
| `deploy.ps1` | Windows 部署脚本（交互式） |
| `quick-deploy.ps1` | Windows 快速部署脚本（一键） |
| `DOCKER_DEPLOY.md` | Docker 部署详细文档 |
| `README.md` | 项目主文档 |

### 3. 修改的文件

| 文件 | 修改内容 |
|------|---------|
| `app/api/music/route.ts` | 添加 `force-dynamic` 和 `runtime` 配置 |
| `next.config.mjs` | 注释 standalone 模式（仅在 Docker 中启用） |

## 🎯 现在可以做什么

### 方式一：快速部署（推荐）

打开 PowerShell，运行：

```powershell
.\quick-deploy.ps1
```

这会：
1. 自动检查 Docker 状态
2. 构建 Docker 镜像
3. 启动容器
4. 提示访问地址

### 方式二：使用完整脚本

```powershell
.\deploy.ps1
```

这会显示一个菜单，让你选择：
- 构建并启动
- 启动服务
- 停止服务
- 查看日志
- 重启服务
- 删除容器

### 方式三：手动命令

```powershell
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止
docker-compose stop
```

## 📝 注意事项

### Windows 用户必读

1. **Docker Desktop 必须运行**
   - 启动 Docker Desktop
   - 等待完全启动后再部署

2. **不需要本地构建**
   - 所有构建都在 Docker 容器中进行
   - 避免了 Windows 符号链接权限问题

3. **推荐使用 WSL2 后端**
   - Docker Desktop 设置中启用 WSL2
   - 性能更好，兼容性更强

### 端口占用

- 默认使用端口 `3000`
- 如果端口被占用，修改 `docker-compose.yml`：
  ```yaml
  ports:
    - "8080:3000"  # 改为 8080 或其他端口
  ```

### 环境变量

- 可选配置，不是必需的
- 如需配置，复制 `.env.example` 为 `.env.local`
- 在 `docker-compose.yml` 中添加环境变量

## 🔍 验证部署

部署成功后：

1. **检查容器状态**
   ```powershell
   docker-compose ps
   ```
   应该显示 `m3u8-player` 容器状态为 `Up`

2. **访问应用**
   - 打开浏览器
   - 访问：http://localhost:3000
   - 应该能看到应用首页

3. **测试 API**
   - 访问：http://localhost:3000/api/music?server=netease&type=search&id=周杰伦
   - 应该返回 JSON 格式的搜索结果

## 🎉 成功标志

看到以下内容表示部署成功：

```
✓ 部署成功！
访问地址: http://localhost:3000
```

## 📚 下一步

1. 阅读完整文档：`DOCKER_DEPLOY.md`
2. 查看 API 文档：`docs/MUSIC_API.md`
3. 了解组件使用：`docs/MUSIC_PLAYER_USAGE.md`
4. 自定义配置：修改 `.env.local`

## 💡 提示

- 首次构建可能需要 5-10 分钟（下载依赖）
- 后续构建会快很多（使用缓存）
- 如遇问题，查看日志：`docker-compose logs -f`

---

## 🆘 快速帮助

### 查看日志
```powershell
docker-compose logs -f
```

### 重启服务
```powershell
docker-compose restart
```

### 完全重置
```powershell
docker-compose down
docker-compose up -d --build
```

### 进入容器调试
```powershell
docker-compose exec m3u8-player sh
```

---

**准备好了吗？运行 `.\quick-deploy.ps1` 开始部署！** 🚀
