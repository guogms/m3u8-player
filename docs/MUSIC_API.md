# 音乐 API 接口文档

## 基础信息

**Base URL**: `/api/music`

**请求方法**: `GET`

**认证**: 可选（如果设置了 `MUSIC_API_SALT` 环境变量则需要）

---

## 通用参数

所有请求都需要以下基础参数：

| 参数 | 类型 | 必填 | 说明 | 示例值 |
|------|------|------|------|--------|
| server | string | 是 | 音乐平台 | `netease`, `tencent`, `baidu`, `xiami`, `kugou` |
| type | string | 是 | 请求类型 | `search`, `song`, `playlist`, `url`, `lrc`, `pic` |
| id | string | 是 | 资源ID或关键词 | `1234567` 或 `周杰伦` |
| auth | string | 否* | 认证签名（MD5） | `a1b2c3d4...` |

\* 如果服务端设置了 `MUSIC_API_SALT`，则 `auth` 参数必填

---

## 1. 搜索歌曲

### 请求

```
GET /api/music?server=netease&type=search&id=周杰伦&limit=10&page=1
```

### 额外参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| keyword | string | 否 | id的值 | 搜索关键词（可以用id代替） |
| limit | number | 否 | 30 | 每页返回数量 |
| page | number | 否 | 1 | 页码 |

### 响应示例

```json
[
  {
    "name": "晴天",
    "artist": "周杰伦",
    "url": "/api/music?server=netease&type=url&id=186016",
    "cover": "/api/music?server=netease&type=pic&id=18916",
    "lrc": "/api/music?server=netease&type=lrc&id=186016"
  },
  {
    "name": "稻香",
    "artist": "周杰伦",
    "url": "/api/music?server=netease&type=url&id=185812",
    "cover": "/api/music?server=netease&type=pic&id=18905",
    "lrc": "/api/music?server=netease&type=lrc&id=185812"
  }
]
```

---

## 2. 获取歌曲详情

### 请求

```
GET /api/music?server=netease&type=song&id=186016
```

### 响应示例

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

---

## 3. 获取歌单

### 请求

```
GET /api/music?server=netease&type=playlist&id=2829883691
```

### 响应示例

```json
[
  {
    "name": "歌曲名1",
    "artist": "歌手名1",
    "url": "/api/music?server=netease&type=url&id=xxx",
    "cover": "/api/music?server=netease&type=pic&id=xxx",
    "lrc": "/api/music?server=netease&type=lrc&id=xxx"
  },
  {
    "name": "歌曲名2",
    "artist": "歌手名2",
    "url": "/api/music?server=netease&type=url&id=yyy",
    "cover": "/api/music?server=netease&type=pic&id=yyy",
    "lrc": "/api/music?server=netease&type=lrc&id=yyy"
  }
]
```

---

## 4. 获取播放链接

### 请求

```
GET /api/music?server=netease&type=url&id=186016
```

### 响应

返回 `302 重定向` 到实际的音乐文件 URL

**注意**: 音乐链接有时效性，建议实时获取

---

## 5. 获取歌词

### 请求

```
GET /api/music?server=netease&type=lrc&id=186016
```

### 响应示例

```
[00:00.00]晴天 - 周杰伦
[00:00.50]词：周杰伦
[00:01.00]曲：周杰伦
[00:16.10]故事的小黄花
[00:18.84]从出生那年就飘着
[00:21.91]童年的荡秋千
[00:24.22]随记忆一直晃到现在
```

**Content-Type**: `text/plain; charset=utf-8`

**格式**: LRC 格式歌词（包含翻译，如果有的话）

---

## 6. 获取封面图片

### 请求

```
GET /api/music?server=netease&type=pic&id=18916
```

### 响应

返回 `302 重定向` 到实际的图片 URL

**尺寸**: 300x300 像素

---

## 数据结构说明

### MusicItem 对象

```typescript
interface MusicItem {
  name: string;      // 歌曲名称
  artist: string;    // 歌手名称（多个歌手用 " / " 分隔）
  url: string;       // 播放链接API地址
  cover: string;     // 封面图片API地址
  lrc: string;       // 歌词API地址
}
```

---

## 支持的音乐平台

| 平台代码 | 平台名称 | 支持状态 |
|---------|---------|---------|
| netease | 网易云音乐 | ✅ 完全支持 |
| tencent | QQ音乐 | ✅ 完全支持 |
| baidu | 百度音乐 | ⚠️ 部分支持 |
| xiami | 虾米音乐 | ⚠️ 部分支持（服务已关闭） |
| kugou | 酷狗音乐 | ⚠️ 部分支持 |

---

## 错误响应

### 403 - 参数错误

```json
{
  "error": "Invalid parameters"
}
```

### 403 - 认证失败

```json
{
  "error": "Invalid auth"
}
```

### 404 - 资源未找到

```json
{
  "error": "URL not found"
}
```

### 500 - 服务器错误

```json
{
  "error": "Internal server error"
}
```

---

## Auth 认证说明

如果服务端设置了 `MUSIC_API_SALT` 环境变量，每个请求需要携带 `auth` 参数。

### Auth 计算方法

```typescript
const server = 'netease';
const type = 'song';
const id = '186016';
const salt = 'your-secret-salt'; // 服务端的 MUSIC_API_SALT

// 计算方式: md5(salt + server + type + id + salt)
const eid = server + type + id;
const auth = md5(salt + eid + salt);

// 完整URL
const url = `/api/music?server=${server}&type=${type}&id=${id}&auth=${auth}`;
```

### JavaScript 示例

```javascript
import crypto from 'crypto';

function generateAuth(server, type, id, salt) {
  const eid = server + type + id;
  return crypto.createHash('md5').update(salt + eid + salt).digest('hex');
}

const auth = generateAuth('netease', 'song', '186016', 'your-secret-salt');
```

---

## 缓存策略

| 类型 | 缓存时间 | 说明 |
|------|---------|------|
| 歌词 (lrc) | 24小时 | 歌词不常变化 |
| 图片 (pic) | 24小时 | 封面图片不常变化 |
| 播放链接 (url) | 20分钟 | 链接有时效性 |
| 歌曲/歌单 | 2小时 | 平衡实时性和性能 |
| 搜索结果 | 1小时 | 搜索结果可能变化 |

---

## 使用建议

1. **播放链接**: 由于有时效性，建议在播放时实时获取
2. **歌词和封面**: 可以提前缓存，减少请求次数
3. **搜索结果**: 建议客户端也做缓存，避免重复搜索
4. **错误处理**: 建议实现重试机制，特别是播放链接获取失败时
5. **跨域**: API 已处理 CORS，可直接从前端调用

---

## 完整示例

### 搜索并播放歌曲

```javascript
// 1. 搜索歌曲
const searchResponse = await fetch('/api/music?server=netease&type=search&id=周杰伦&limit=10');
const songs = await searchResponse.json();

// 2. 选择第一首歌
const firstSong = songs[0];

// 3. 创建音频播放器
const audio = new Audio(firstSong.url);

// 4. 获取歌词
const lrcResponse = await fetch(firstSong.lrc);
const lrcText = await lrcResponse.text();

// 5. 播放
audio.play();
```

### 获取歌单

```javascript
const playlistId = '2829883691';
const response = await fetch(`/api/music?server=netease&type=playlist&id=${playlistId}`);
const playlist = await response.json();

console.log(`歌单共有 ${playlist.length} 首歌曲`);
playlist.forEach((song, index) => {
  console.log(`${index + 1}. ${song.name} - ${song.artist}`);
});
```

---

## TypeScript 类型定义

```typescript
// 音乐平台类型
type MusicServer = 'netease' | 'tencent' | 'baidu' | 'xiami' | 'kugou';

// 请求类型
type RequestType = 'search' | 'song' | 'playlist' | 'url' | 'lrc' | 'pic';

// 歌曲信息
interface MusicItem {
  name: string;
  artist: string;
  url: string;
  cover: string;
  lrc: string;
}

// 搜索参数
interface SearchParams {
  server: MusicServer;
  type: 'search';
  id: string;
  limit?: number;
  page?: number;
  keyword?: string;
  auth?: string;
}

// API响应
type MusicAPIResponse = MusicItem[] | { error: string };
```
