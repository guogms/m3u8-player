# 音乐播放器组件使用文档

## 安装依赖

首先需要安装 APlayer 依赖：

```bash
npm install aplayer
# 或
pnpm add aplayer
```

如果使用 TypeScript，还需要安装类型定义：

```bash
npm install --save-dev @types/aplayer
# 或
pnpm add -D @types/aplayer
```

---

## 基础使用

### 1. 在 Next.js 页面中使用

```tsx
// app/page.tsx 或任何页面组件
import MusicPlayer from '@/components/MusicPlayer';

export default function Page() {
  return (
    <div>
      <h1>我的网站</h1>
      
      {/* 音乐播放器 */}
      <MusicPlayer 
        defaultPlaylistId="2829883691"  // 网易云歌单ID
        defaultServer="netease"          // 默认平台：网易云
        autoLoad={true}                  // 自动加载
        position="top-right"             // 位置：右上角
      />
    </div>
  );
}
```

### 2. 在布局中使用（全局播放器）

```tsx
// app/layout.tsx
import MusicPlayer from '@/components/MusicPlayer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        
        {/* 全局音乐播放器 */}
        <MusicPlayer />
      </body>
    </html>
  );
}
```

---

## 组件属性 (Props)

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `defaultPlaylistId` | string | `'2829883691'` | 默认加载的歌单ID |
| `defaultServer` | `'netease' \| 'tencent' \| 'baidu'` | `'netease'` | 默认音乐平台 |
| `autoLoad` | boolean | `true` | 是否自动加载歌单 |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | 播放器位置 |

---

## 使用 Hook 进行高级控制

### useMusicPlayer Hook

用于在自定义组件中控制音乐播放器。

```tsx
import { useMusicPlayer } from '@/components/MusicPlayer';

function MyMusicSearch() {
  const { loading, error, searchMusic, loadPlaylist, getSong } = useMusicPlayer();
  const [results, setResults] = useState([]);
  const [keyword, setKeyword] = useState('');

  const handleSearch = async () => {
    const songs = await searchMusic(keyword, 'netease', 20);
    setResults(songs);
  };

  return (
    <div>
      <input 
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜索歌曲..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? '搜索中...' : '搜索'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      <ul>
        {results.map((song, index) => (
          <li key={index}>
            {song.name} - {song.artist}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Hook 方法说明

#### 1. searchMusic

搜索歌曲

```typescript
searchMusic(
  keyword: string,           // 搜索关键词
  server?: 'netease' | 'tencent' | 'baidu',  // 平台，默认 netease
  limit?: number             // 返回数量，默认 30
): Promise<MusicItem[]>
```

**示例**:
```typescript
const songs = await searchMusic('周杰伦', 'netease', 10);
```

#### 2. loadPlaylist

加载歌单

```typescript
loadPlaylist(
  playlistId: string,        // 歌单ID
  server?: 'netease' | 'tencent' | 'baidu'  // 平台，默认 netease
): Promise<MusicItem[]>
```

**示例**:
```typescript
const playlist = await loadPlaylist('2829883691', 'netease');
```

#### 3. getSong

获取单曲信息

```typescript
getSong(
  songId: string,            // 歌曲ID
  server?: 'netease' | 'tencent' | 'baidu'  // 平台，默认 netease
): Promise<MusicItem[]>
```

**示例**:
```typescript
const song = await getSong('186016', 'netease');
```

---

## 完整示例

### 示例 1: 自定义搜索和播放

```tsx
'use client';

import { useState } from 'react';
import MusicPlayer, { useMusicPlayer } from '@/components/MusicPlayer';

export default function CustomMusicPage() {
  const { loading, error, searchMusic } = useMusicPlayer();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState([]);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    const songs = await searchMusic(keyword, 'netease', 20);
    setResults(songs);
  };

  const handleAddToPlaylist = (song) => {
    setSelectedPlaylist([...selectedPlaylist, song]);
  };

  return (
    <div className="container">
      <h1>音乐搜索</h1>
      
      {/* 搜索框 */}
      <div className="search-box">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜索歌曲、歌手..."
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? '搜索中...' : '搜索'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && <div className="error">{error}</div>}

      {/* 搜索结果 */}
      <div className="results">
        <h2>搜索结果</h2>
        {results.map((song, index) => (
          <div key={index} className="song-item">
            <img src={song.cover} alt={song.name} />
            <div className="info">
              <div className="name">{song.name}</div>
              <div className="artist">{song.artist}</div>
            </div>
            <button onClick={() => handleAddToPlaylist(song)}>
              添加到播放列表
            </button>
          </div>
        ))}
      </div>

      {/* 音乐播放器 */}
      <MusicPlayer autoLoad={false} />
    </div>
  );
}
```

### 示例 2: 多个歌单切换

```tsx
'use client';

import { useState } from 'react';
import MusicPlayer, { useMusicPlayer } from '@/components/MusicPlayer';

const PLAYLISTS = [
  { id: '2829883691', name: '华语流行', server: 'netease' },
  { id: '3778678', name: '欧美经典', server: 'netease' },
  { id: '2884035', name: '日语动漫', server: 'netease' },
];

export default function PlaylistSelector() {
  const { loading, loadPlaylist } = useMusicPlayer();
  const [currentPlaylist, setCurrentPlaylist] = useState(PLAYLISTS[0]);

  const handleSelectPlaylist = async (playlist) => {
    setCurrentPlaylist(playlist);
    await loadPlaylist(playlist.id, playlist.server);
  };

  return (
    <div>
      <h2>选择歌单</h2>
      <div className="playlist-buttons">
        {PLAYLISTS.map((playlist) => (
          <button
            key={playlist.id}
            onClick={() => handleSelectPlaylist(playlist)}
            disabled={loading}
            className={currentPlaylist.id === playlist.id ? 'active' : ''}
          >
            {playlist.name}
          </button>
        ))}
      </div>

      <MusicPlayer
        defaultPlaylistId={currentPlaylist.id}
        defaultServer={currentPlaylist.server}
      />
    </div>
  );
}
```

### 示例 3: 在现有 Vue 组件中使用 API

如果您想在现有的 `NavMusic.vue` 中使用新的 API，只需修改加载函数：

```typescript
// NavMusic.vue 中的修改
const LoadMusicList = (callback?: () => void) => {
  // 使用新的 Next.js API
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
      if (restoreMusicList()) {
        callback?.();
      }
    });
};

// 或者添加搜索功能
const SearchMusic = (keyword: string) => {
  axios.get(`/api/music?server=netease&type=search&id=${encodeURIComponent(keyword)}&limit=30`)
    .then((res) => {
      if (res.data?.length) {
        GlobalMusicList = res.data;
        if (res.data[0] && res.data[0].cover) {
          currentCover.value = res.data[0].cover;
        }
        saveMusicList();
        NewPlayer();
      }
    })
    .catch((error) => {
      console.error('Search failed:', error);
    });
};
```

---

## 样式自定义

### 修改播放器位置

```tsx
<MusicPlayer position="bottom-right" />
```

### 自定义CSS

组件使用了 CSS-in-JS，如果需要自定义样式，可以通过全局CSS覆盖：

```css
/* global.css */

/* 修改封面大小 */
.music-cover {
  width: 60px !important;
  height: 60px !important;
}

/* 修改播放器面板宽度 */
.music-panel {
  width: 400px !important;
}

/* 修改APlayer主题色 */
:root {
  --aplayer-theme: #ff6b6b;
}
```

---

## 注意事项

1. **客户端组件**: 组件需要在客户端渲染，确保添加 `'use client'` 指令
2. **APlayer依赖**: 必须安装 `aplayer` npm包
3. **API可用性**: 确保 `/api/music` 端点正常工作
4. **跨域问题**: Next.js API路由自动处理CORS
5. **状态持久化**: 播放状态自动保存到 localStorage
6. **音乐源**: 依赖第三方音乐平台API，可能受网络影响

---

## 类型定义

```typescript
interface MusicItem {
  name: string;      // 歌曲名称
  artist: string;    // 歌手名称
  url: string;       // 播放链接
  cover: string;     // 封面图片
  lrc: string;       // 歌词链接
}

interface PlayerState {
  currentTime: number;
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  timestamp: number;
}
```

---

## 故障排除

### 问题 1: 音乐无法播放

**解决方案**:
- 检查 `/api/music` 是否正常工作
- 查看浏览器控制台错误信息
- 确认音乐链接是否有效（某些链接有时效性）

### 问题 2: 播放器不显示

**解决方案**:
- 确保安装了 `aplayer` 包
- 检查是否有 CSS 加载问题
- 确认组件使用了 `'use client'` 指令

### 问题 3: 状态不保存

**解决方案**:
- 检查 localStorage 是否可用
- 查看浏览器是否禁用了存储
- 清除浏览器缓存重试

---

## API参考

详细的 API 文档请查看: [`docs/MUSIC_API.md`](../docs/MUSIC_API.md)
