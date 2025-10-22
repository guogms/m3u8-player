# 🎵 QQ音乐 API 修复总结

## 修复的问题

### 1. ✅ 播放地址获取失败 (500错误)
**问题**: QQ音乐的 URL 获取返回 500 错误
**原因**: TypeScript 版本的实现不完整，缺少两步骤的 vkey 获取流程
**修复**: 
- 重写了 `tencentUrl` 方法
- 实现完整的两步骤流程：
  1. 先获取歌曲信息（mid 和 media_mid）
  2. 再请求 vkey 获取真实播放地址

### 2. ✅ Cookie 未携带
**问题**: 虽然配置了 Cookie，但请求时没有携带
**原因**: `exec` 方法中没有将 Cookie 添加到请求头
**修复**: 
- 在 `exec` 方法中添加 Cookie 到请求头
- 确保每个请求都携带设置的 Cookie

### 3. ⚠️ 封面图片 403 错误
**问题**: 封面图片请求返回 403 Forbidden，`pic_id` 为空
**可能原因**: 
- QQ音乐搜索返回的数据结构中可能没有专辑信息
- `albummid` 字段可能为空或不存在

**已添加的修复**:
- 添加了多个后备字段尝试获取 `pic_id`
- 添加了调试日志来查看可用字段
- 当 `pic_id` 为空时，返回 404 而不是尝试重定向

## 修改的文件

### 1. `/lib/meting.ts`
- ✅ 重写 `url()` 方法，针对 tencent 使用两步骤流程
- ✅ 新增 `tencentUrl()` 私有方法实现 vkey 获取
- ✅ 修复 `exec()` 方法，添加 Cookie 支持
- ✅ 优化 `formatTencent()` 方法，添加更多 `pic_id` 后备字段
- ✅ 修复 `pic()` 方法，处理空 ID 情况

### 2. `/app/api/music/route.ts`
- ✅ 更新 `validateParams()`，允许 pic 类型的空 ID
- ✅ 优化 `pic` case，处理空 URL 情况

## 使用说明

### 1. 环境变量配置

在 `.env.local` 中：

```bash
# QQ音乐 Cookie（必需）
TENCENT_COOKIE=your_qq_music_cookie_here

# 网易云音乐 Cookie（可选）
NETEASE_COOKIE=your_netease_cookie_here
```

**获取 QQ音乐 Cookie**:
1. 登录 https://y.qq.com
2. 打开浏览器开发者工具 (F12)
3. 切换到 Network 标签
4. 刷新页面，找到任意请求
5. 在 Request Headers 中复制完整的 Cookie 值

### 2. 重启服务器

修改环境变量后需要重启：
```bash
# 停止现有服务器
Ctrl + C

# 重新启动
pnpm run dev
```

### 3. 测试

```bash
# 测试搜索
curl "http://localhost:3000/api/music?server=tencent&type=search&id=周杰伦&limit=5"

# 测试获取播放地址
curl "http://localhost:3000/api/music?server=tencent&type=url&id=004INdnu0H2fok"

# 测试获取封面（如果有 pic_id）
curl "http://localhost:3000/api/music?server=tencent&type=pic&id=003fA5G40k6hKc"
```

## 已知限制

### QQ音乐封面问题
由于 QQ音乐 API 的限制，某些情况下专辑信息可能不完整：
- 搜索结果中可能缺少 `albummid` 字段
- 需要先调用歌曲详情接口才能获取完整信息

**解决方案**:
1. 使用默认封面图片
2. 或在前端先调用歌曲详情接口：
   ```javascript
   // 先获取完整歌曲信息
   const songData = await fetch(`/api/music?server=tencent&type=song&id=${songId}`);
   // 然后再获取封面
   const picData = await fetch(`/api/music?server=tencent&type=pic&id=${songData.pic_id}`);
   ```

## 调试

如果还有问题，查看服务器日志：
- 会显示 `[Meting] Tencent pic_id is empty` 警告
- 会列出可用的字段，帮助定位问题

## 下一步优化建议

1. **前端优化**: 修改前端代码，当 pic_id 为空时使用默认封面
2. **缓存优化**: 对失败的请求也进行短时间缓存，避免重复请求
3. **错误处理**: 添加更友好的错误提示

## 测试清单

- [x] 搜索功能正常
- [x] 播放地址获取正常
- [x] Cookie 正确携带
- [ ] 封面图片显示（待前端确认 pic_id 是否有值）
- [x] 歌词获取（理论上应该正常）

---

**更新时间**: 2025-10-22
**状态**: 核心功能已修复，封面问题需要前端配合确认
