# 🎵 音乐解析 API - 快速开始

## 📋 目录

1. [接口文档](#接口文档)
2. [安装依赖](#安装依赖)
3. [快速使用](#快速使用)
4. [完整示例](#完整示例)
5. [相关文档](#相关文档)

---

## 📖 接口文档

### API 基础信息

- **Base URL**: `/api/music`
- **方法**: `GET`
- **认证**: 可选

### 核心接口

#### 1. 搜索歌曲

```http
GET /api/music?server=netease&type=search&id=周杰伦&limit=10
```

**响应**:
```json
[
  {
    "name": "晴天",
    "artist": "周杰伦",
    "url": "/api/music?server=netease&type=url&id=186016",
    "cover": "/api/music?server=netease&type=pic&id=18916",
    "lrc": "/api/music?server=netease&type=lrc&id=186016"
  }
]
```

#### 2. 获取歌单

```http
GET /api/music?server=netease&type=playlist&id=2829883691
```

#### 3. 获取播放链接

```http
GET /api/music?server=netease&type=url&id=186016
```

返回: `302 重定向` 到音乐文件

#### 4. 获取歌词

```http
GET /api/music?server=netease&type=lrc&id=186016
```

返回: LRC 格式歌词文本

#### 5. 获取封面

```http
GET /api/music?server=netease&type=pic&id=18916
```

返回: `302 重定向` 到图片文件

### 支持的平台

| 平台 | 代码 | 状态 |
|------|------|------|
| 网易云音乐 | `netease` | ✅ 完全支持 |
| QQ音乐 | `tencent` | ✅ 完全支持 |
| 百度音乐 | `baidu` | ⚠️ 部分支持 |
| 虾米音乐 | `xiami` | ⚠️ 部分支持 |
| 酷狗音乐 | `kugou` | ⚠️ 部分支持 |

---

## 📦 安装依赖

### 后端依赖

后端代码已经创建在以下位置：
- `/lib/meting.ts` - 音乐解析核心库
- `/lib/music-cache.ts` - 缓存管理
- `/app/api/music/route.ts` - API路由

**无需额外安装**，Next.js 内置依赖已足够。

### 前端依赖

如果要使用前端播放器组件：

```bash
# 安装 APlayer
npm install aplayer
# 或
pnpm add aplayer

# TypeScript 类型定义（可选）
npm install --save-dev @types/aplayer
# 或
pnpm add -D @types/aplayer
```

---

## 🚀 快速使用

### 方式1: 直接使用 API

在任何地方直接调用 API：

```javascript
// 搜索歌曲
const response = await fetch('/api/music?server=netease&type=search&id=周杰伦&limit=10');
const songs = await response.json();

console.log(songs);
// [{ name: "晴天", artist: "周杰伦", url: "...", cover: "...", lrc: "..." }, ...]

// 使用播放链接
const audio = new Audio(songs[0].url);
audio.play();
```

### 方式2: 使用 React 组件

```tsx
// app/page.tsx
import MusicPlayer from '@/components/MusicPlayer';

export default function Page() {
  return (
    <div>
      <h1>我的网站</h1>
      <MusicPlayer 
        defaultPlaylistId="2829883691"
        defaultServer="netease"
      />
    </div>
  );
}
```

### 方式3: 在现有 Vue 组件中使用

修改您的 `NavMusic.vue`:

```typescript
// 修改 LoadMusicList 函数
const LoadMusicList = (callback?: () => void) => {
  axios.get('/api/music?server=netease&type=playlist&id=2829883691')
    .then((res) => {
      if (res.data?.length) {
        GlobalMusicList = res.data;
        if (res.data[0] && res.data[0].cover) {
          currentCover.value = res.data[0].cover;
        }
        saveMusicList();
      }
      callback?.();
    })
    .catch((error) => {
      console.warn('Failed to load music list:', error);
    });
};
```

---

## 💡 完整示例

### 示例 1: 搜索并播放音乐

```typescript
async function searchAndPlay(keyword: string) {
  // 1. 搜索歌曲
  const response = await fetch(
    `/api/music?server=netease&type=search&id=${encodeURIComponent(keyword)}&limit=10`
  );
  const songs = await response.json();
  
  if (songs.length === 0) {
    console.log('没有找到歌曲');
    return;
  }
  
  // 2. 选择第一首歌
  const song = songs[0];
  console.log(`准备播放: ${song.name} - ${song.artist}`);
  
  // 3. 创建音频播放器
  const audio = new Audio(song.url);
  
  // 4. 获取歌词（可选）
  const lrcResponse = await fetch(song.lrc);
  const lrcText = await lrcResponse.text();
  console.log('歌词:', lrcText);
  
  // 5. 播放
  audio.play();
}

// 使用
searchAndPlay('晴天');
```

### 示例 2: 加载歌单并创建播放列表

```typescript
async function loadPlaylistAndCreatePlayer(playlistId: string) {
  // 1. 获取歌单
  const response = await fetch(
    `/api/music?server=netease&type=playlist&id=${playlistId}`
  );
  const playlist = await response.json();
  
  console.log(`歌单共有 ${playlist.length} 首歌曲`);
  
  // 2. 显示歌单信息
  playlist.forEach((song, index) => {
    console.log(`${index + 1}. ${song.name} - ${song.artist}`);
  });
  
  // 3. 使用 APlayer 创建播放器（如果已安装）
  if (typeof APlayer !== 'undefined') {
    const player = new APlayer({
      container: document.getElementById('player'),
      audio: playlist,
      listFolded: false,
      listMaxHeight: '400px',
    });
  }
  
  return playlist;
}

// 使用
loadPlaylistAndCreatePlayer('2829883691');
```

### 示例 3: React Hook 使用

```tsx
'use client';

import { useState } from 'react';

function MusicSearch() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/music?server=netease&type=search&id=${encodeURIComponent(keyword)}&limit=20`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="搜索歌曲..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? '搜索中...' : '搜索'}
      </button>
      
      <ul>
        {results.map((song, index) => (
          <li key={index}>
            <img src={song.cover} alt={song.name} width="50" />
            <span>{song.name} - {song.artist}</span>
            <audio src={song.url} controls />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📚 相关文档

### 详细文档

1. **API 完整文档**: [`docs/MUSIC_API.md`](./MUSIC_API.md)
   - 详细的接口说明
   - 参数说明
   - 响应格式
   - 错误处理
   - TypeScript 类型定义

2. **React 组件使用**: [`docs/MUSIC_PLAYER_USAGE.md`](./MUSIC_PLAYER_USAGE.md)
   - 组件安装
   - 属性说明
   - Hook 使用
   - 完整示例
   - 样式自定义

3. **实现指南**: [`MUSIC_API_GUIDE.md`](../MUSIC_API_GUIDE.md)
   - 实现原理
   - 文件结构
   - 配置说明
   - 开发指南

### 类型定义

TypeScript 类型定义位于: [`types/music.d.ts`](../types/music.d.ts)

```typescript
import { MusicItem, MusicServer } from '@/types/music';

// 使用类型
const song: MusicItem = {
  name: '晴天',
  artist: '周杰伦',
  url: '/api/music?...',
  cover: '/api/music?...',
  lrc: '/api/music?...'
};
```

---

## ⚙️ 配置

### 环境变量（可选）

创建 `.env.local` 文件：

```bash
# 网易云音乐 Cookie（提高访问成功率）
NETEASE_COOKIE=

# QQ音乐 Cookie
TENCENT_COOKIE=

# API 安全盐值（启用认证）
MUSIC_API_SALT=your-random-secret
```

### 获取 Cookie

1. **网易云音乐**:
   - 登录 https://music.163.com
   - 打开浏览器开发者工具 (F12)
   - 切换到 Network 标签
   - 刷新页面
   - 找到任意请求，复制 Cookie

2. **QQ音乐**:
   - 登录 https://y.qq.com
   - 同样方法获取 Cookie

---

## 🔧 故障排除

### 问题 1: API 返回 403 错误

**原因**: 参数错误或认证失败

**解决**:
```javascript
// 检查参数是否正确
const server = 'netease';  // 必须是支持的平台
const type = 'search';     // 必须是支持的类型
const id = '周杰伦';        // 不能为空

// 如果启用了 auth，需要正确计算签名
```

### 问题 2: 音乐无法播放

**原因**: 播放链接过期或被限制

**解决**:
```javascript
// 1. 实时获取播放链接
const url = `/api/music?server=netease&type=url&id=${songId}`;

// 2. 添加错误处理
audio.onerror = () => {
  console.error('播放失败，尝试重新获取链接');
  // 重新获取链接
};
```

### 问题 3: 搜索无结果

**原因**: 关键词问题或平台限制

**解决**:
```javascript
// 1. 尝试不同的平台
const servers = ['netease', 'tencent', 'baidu'];
for (const server of servers) {
  const result = await fetch(`/api/music?server=${server}&type=search&id=关键词`);
  // ...
}

// 2. 检查关键词
const keyword = encodeURIComponent('正确的关键词');
```

---

## 📞 获取帮助

如有问题，请查看：

1. 完整 API 文档: `docs/MUSIC_API.md`
2. 组件使用文档: `docs/MUSIC_PLAYER_USAGE.md`
3. 实现指南: `MUSIC_API_GUIDE.md`

---

## 📄 许可证

本项目基于 [Meting](https://github.com/metowolf/Meting) 改编，遵循 MIT 许可证。
