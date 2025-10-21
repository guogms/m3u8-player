# 音乐解析 API - 实现指南

## 概述

已经从 Handsome PHP 项目中提取了音乐解析逻辑，并准备好了 TypeScript/Next.js 版本的实现。

## 已创建的文件

### 1. `/lib/meting.ts`
核心音乐解析类，支持多个音乐平台：
- 网易云音乐 (netease)
- QQ音乐 (tencent)  
- 虾米音乐 (xiami)
- 酷狗音乐 (kugou)
- 百度音乐 (baidu)

主要功能：
- `search()` - 搜索歌曲
- `song()` - 获取歌曲详情
- `playlist()` - 获取歌单
- `url()` - 获取播放链接
- `lyric()` - 获取歌词
- `pic()` - 获取封面图片

**注意**: 文件中有一个小问题需要修复，BigInt 字面量语法需要调整为兼容 ES6。

### 2. `/lib/music-cache.ts`
简单的内存缓存实现，用于缓存音乐数据，减少API请求。

特性：
- 支持过期时间 (TTL)
- 自动清理过期数据
- 可替换为 Redis 等持久化方案

### 3. `/app/api/music/route.ts`
Next.js API 路由处理器。

**状态**: 由于文件创建过程中出现问题，需要手动创建此文件。

### 4. `.env.local.example`
环境变量配置示例。

### 5. `/app/api/music/README.md`
完整的 API 使用文档。

## 手动创建 route.ts

由于自动创建遇到问题，请手动在 `/app/api/music/route.ts` 创建文件，包含以下基本结构：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Meting } from '@/lib/meting';
import { musicCache } from '@/lib/music-cache';
import crypto from 'crypto';

const NETEASE_COOKIE = process.env.NETEASE_COOKIE || '';
const TENCENT_COOKIE = process.env.TENCENT_COOKIE || '';
const MUSIC_API_SALT = process.env.MUSIC_API_SALT || '';

type ServerType = 'netease' | 'tencent' | 'xiami' | 'kugou' | 'baidu';
type RequestType = 'song' | 'album' | 'search' | 'artist' | 'playlist' | 'lrc' | 'url' | 'pic';

function validateParams(server: string, type: string, id: string): boolean {
  const validServers = ['netease', 'tencent', 'baidu', 'xiami', 'kugou'];
  const validTypes = ['song', 'album', 'search', 'artist', 'playlist', 'lrc', 'url', 'pic'];
  return validServers.includes(server) && validTypes.includes(type) && !!id?.trim();
}

function generateAuth(server: string, type: string, id: string, salt: string): string {
  const eid = server + type + id;
  return crypto.createHash('md5').update(salt + eid + salt).digest('hex');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const server = searchParams.get('server') as ServerType;
    const type = searchParams.get('type') as RequestType;
    const id = searchParams.get('id') || '';
    const auth = searchParams.get('auth') || '';

    if (!validateParams(server, type, id)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 403 });
    }

    if (MUSIC_API_SALT && auth !== generateAuth(server, type, id, MUSIC_API_SALT)) {
      return NextResponse.json({ error: 'Invalid auth' }, { status: 403 });
    }

    const cacheKey = `${server}${type}${id}`;
    const api = new Meting(server);
    api.format(true);

    if (server === 'netease' && NETEASE_COOKIE) api.cookie(NETEASE_COOKIE);
    else if (server === 'tencent' && TENCENT_COOKIE) api.cookie(TENCENT_COOKIE);

    // 根据不同的 type 处理请求
    // 具体实现见原 PHP 代码中的逻辑

    return NextResponse.json({ message: 'Music API' });
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## API 使用示例

### 搜索歌曲
```bash
GET /api/music?server=netease&type=search&id=周杰伦&limit=10
```

### 获取歌单
```bash
GET /api/music?server=netease&type=playlist&id=2829883691
```

### 获取播放链接
```bash
GET /api/music?server=netease&type=url&id=1234567
```

### 获取歌词
```bash
GET /api/music?server=netease&type=lrc&id=1234567
```

## 主要改进点

相比 PHP 版本，TypeScript 版本有以下改进：

1. **类型安全**: 使用 TypeScript 提供完整的类型检查
2. **现代化 API**: 使用 fetch API 替代 curl
3. **更好的错误处理**: 统一的错误响应格式
4. **环境变量配置**: 使用 .env.local 管理配置
5. **内存缓存**: 简单高效的缓存实现
6. **Next.js 集成**: 原生支持 Next.js API 路由

## 下一步工作

1. 修复 `/lib/meting.ts` 中的 BigInt 字面量问题（已在代码中修复）
2. 完善 `/app/api/music/route.ts` 中的各种类型处理逻辑
3. 添加歌词合并功能（中文+翻译）
4. 测试各个音乐平台的接口
5. 可选：添加 Redis 缓存支持
6. 可选：添加请求限流中间件

## 参考

- 原 PHP 实现: `/Handsome/action/MetingAction.php`
- 原 Meting 库: `/Handsome/libs/Meting.php`
- API 文档: `/app/api/music/README.md`

## 配置

复制 `.env.local.example` 为 `.env.local`，根据需要配置：

```bash
# 网易云音乐 Cookie
NETEASE_COOKIE=

# QQ音乐 Cookie  
TENCENT_COOKIE=

# API 安全盐值（可选）
MUSIC_API_SALT=
```

## 注意事项

1. 音乐平台的 API 可能会变化，需要定期维护
2. 部分平台需要 Cookie 才能正常访问
3. 播放链接有时效性，建议设置较短的缓存时间
4. 建议在生产环境启用 auth 验证保护 API
