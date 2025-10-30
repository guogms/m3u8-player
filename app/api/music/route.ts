// app/api/music/route.ts
// 将此文件内容复制到 app/api/music/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Meting } from '@/lib/meting';
import { musicCache } from '@/lib/music-cache';
import { getCorsHeaders } from '@/lib/cors';
import crypto from 'crypto';

// 强制动态渲染，因为这是一个 API 路由
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NETEASE_COOKIE = process.env.NETEASE_COOKIE || '';
const TENCENT_COOKIE = process.env.TENCENT_COOKIE || '';
const MUSIC_API_SALT = process.env.MUSIC_API_SALT || '';

// 配置开关：
// MUSIC_USE_SERVER_COOKIE=true  -> 优先使用服务端配置的目标站点 cookie
// MUSIC_FORWARD_CLIENT_COOKIE=true -> 当未使用服务端 cookie 时，允许透传客户端的 Cookie 到上游
// MUSIC_FORWARD_SET_COOKIE=true -> 是否把上游返回的 Set-Cookie 转发给客户端（默认 false）
const MUSIC_USE_SERVER_COOKIE = (process.env.MUSIC_USE_SERVER_COOKIE || 'true') === 'true';
const MUSIC_FORWARD_CLIENT_COOKIE = (process.env.MUSIC_FORWARD_CLIENT_COOKIE || 'true') === 'true';
const MUSIC_FORWARD_SET_COOKIE = (process.env.MUSIC_FORWARD_SET_COOKIE || 'false') === 'true';

// 调试日志：启动时输出 Cookie 状态
console.log('[Music API Init] TENCENT_COOKIE length:', TENCENT_COOKIE.length);
console.log('[Music API Init] NETEASE_COOKIE length:', NETEASE_COOKIE.length);

type ServerType = 'netease' | 'tencent' | 'xiami' | 'kugou' | 'baidu';
type RequestType = 'song' | 'album' | 'search' | 'artist' | 'playlist' | 'lrc' | 'url' | 'pic';

function validateParams(server: string, type: string, id: string): boolean {
  const validServers = ['netease', 'tencent', 'baidu', 'xiami', 'kugou'];
  const validTypes = ['song', 'album', 'search', 'artist', 'playlist', 'lrc', 'url', 'pic'];
  
  // 对于 pic 类型，允许空 id（返回默认图片）
  if (type === 'pic' && (!id || !id.trim())) {
    return true;
  }
  
  return validServers.includes(server) && validTypes.includes(type) && !!id?.trim();
}

function generateAuth(server: string, type: string, id: string, salt: string): string {
  const eid = server + type + id;
  return crypto.createHash('md5').update(salt + eid + salt).digest('hex');
}

// 处理 OPTIONS 请求（预检请求）
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const searchParams = request.nextUrl.searchParams;
    const server = searchParams.get('server') as ServerType;
    const type = searchParams.get('type') as RequestType;
    const id = searchParams.get('id') || '';
    const auth = searchParams.get('auth') || '';

    if (!validateParams(server, type, id)) {
      return NextResponse.json(
        { error: 'Invalid parameters' }, 
        { status: 403, headers: corsHeaders }
      );
    }

    if (MUSIC_API_SALT && auth !== generateAuth(server, type, id, MUSIC_API_SALT)) {
      return NextResponse.json(
        { error: 'Invalid auth' }, 
        { status: 403, headers: corsHeaders }
      );
    }

    const cacheKey = `${server}${type}${id}`;
    const api = new Meting(server);
    api.format(true);

    // 调试日志
    console.log(`[Music API] Request: ${server} ${type} ${id}`);
    console.log(`[Music API] Has TENCENT_COOKIE: ${!!TENCENT_COOKIE}, Length: ${TENCENT_COOKIE.length}`);

    if (server === 'netease' && NETEASE_COOKIE) {
      console.log('[Music API] Setting Netease cookie');
      api.cookie(NETEASE_COOKIE);
    } else if (server === 'tencent' && TENCENT_COOKIE) {
      console.log('[Music API] Setting Tencent cookie, length:', TENCENT_COOKIE.length);
      api.cookie(TENCENT_COOKIE);
    } else {
      console.log('[Music API] No cookie set for', server);
    }

    switch (type) {
      case 'search': {
        const keyword = searchParams.get('keyword') || id;
        const limit = parseInt(searchParams.get('limit') || '30');
        const page = parseInt(searchParams.get('page') || '1');
        
        const searchKey = `${server}search${keyword}${limit}${page}`;
        let data = musicCache.get(searchKey);
        
        if (!data) {
          data = await api.search(keyword, { limit, page });
          musicCache.set(searchKey, data, 3600);
        }

        const songs = JSON.parse(data);
        const baseUrl = `${request.nextUrl.origin}/api/music`;

        const music = songs.map((song: any) => ({
          name: song.name,
          artist: Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist,
          url: `${baseUrl}?server=${song.source}&type=url&id=${song.url_id}${MUSIC_API_SALT ? `&auth=${generateAuth(song.source, 'url', song.url_id, MUSIC_API_SALT)}` : ''}`,
          cover: `${baseUrl}?server=${song.source}&type=pic&id=${song.pic_id}${MUSIC_API_SALT ? `&auth=${generateAuth(song.source, 'pic', song.pic_id, MUSIC_API_SALT)}` : ''}`,
          lrc: `${baseUrl}?server=${song.source}&type=lrc&id=${song.lyric_id}${MUSIC_API_SALT ? `&auth=${generateAuth(song.source, 'lrc', song.lyric_id, MUSIC_API_SALT)}` : ''}`,
        }));

        return NextResponse.json(music, { headers: corsHeaders });
      }

      case 'song':
      case 'playlist': {
        let data = musicCache.get(cacheKey);
        
        if (!data) {
          if (type === 'song') {
            data = await api.song(id);
          } else {
            data = await api.playlist(id);
          }
          musicCache.set(cacheKey, data, 7200);
        }

        const songs = JSON.parse(data);
        const baseUrl = `${request.nextUrl.origin}/api/music`;

        const music = songs.map((song: any) => ({
          name: song.name,
          artist: Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist,
          url: `${baseUrl}?server=${song.source}&type=url&id=${song.url_id}${MUSIC_API_SALT ? `&auth=${generateAuth(song.source, 'url', song.url_id, MUSIC_API_SALT)}` : ''}`,
          cover: `${baseUrl}?server=${song.source}&type=pic&id=${song.pic_id}${MUSIC_API_SALT ? `&auth=${generateAuth(song.source, 'pic', song.pic_id, MUSIC_API_SALT)}` : ''}`,
          lrc: `${baseUrl}?server=${song.source}&type=lrc&id=${song.lyric_id}${MUSIC_API_SALT ? `&auth=${generateAuth(song.source, 'lrc', song.lyric_id, MUSIC_API_SALT)}` : ''}`,
        }));

        return NextResponse.json(music, { headers: corsHeaders });
      }

      case 'url': {
        let data = musicCache.get(cacheKey);
        
        if (!data) {
          data = await api.url(id, 320);
          musicCache.set(cacheKey, data, 1200);
        }

        const urlData = JSON.parse(data);
        let url = urlData.url || '';

        if (server === 'netease') {
          url = url.replace('://m7c.', '://m7.');
          url = url.replace('://m8c.', '://m8.');
          url = url.replace('http://m10.', 'https://m10.');
        }

        if (!url) {
          return NextResponse.json(
            { error: 'URL not found' }, 
            { status: 404, headers: corsHeaders }
          );
        }

        // 为了支持会员音乐，需要在服务器端向上游带上 cookie 请求并把响应流回客户端。
        // 优先使用服务器端配置的 cookie（NETEASE_COOKIE / TENCENT_COOKIE），否则回退到客户端请求携带的 cookie。
        const clientCookie = request.headers.get('cookie') || '';
        const serverCookie = server === 'netease' ? NETEASE_COOKIE : server === 'tencent' ? TENCENT_COOKIE : '';

        // 根据配置决定使用哪个 cookie：优先使用服务端 cookie（若开启），否则根据是否允许透传客户端 cookie 决定
        let upstreamCookie = '';
        if (MUSIC_USE_SERVER_COOKIE && serverCookie) {
          upstreamCookie = serverCookie;
          console.log('[Music API] Using server cookie for upstream request');
        } else if (MUSIC_FORWARD_CLIENT_COOKIE && clientCookie) {
          upstreamCookie = clientCookie;
          console.log('[Music API] Forwarding client cookie to upstream request');
        } else {
          upstreamCookie = '';
          console.log('[Music API] No upstream cookie will be sent');
        }

        const range = request.headers.get('range') || undefined;
        const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (compatible)';

        const fetchHeaders: Record<string, string> = {
          accept: '*/*',
          'user-agent': userAgent,
        };

        if (upstreamCookie) {
          fetchHeaders['cookie'] = upstreamCookie;
        }
        if (range) {
          fetchHeaders['range'] = range;
        }

        // 向上游请求音频（流式转发）
        const upstreamResp = await fetch(url, {
          method: 'GET',
          headers: fetchHeaders,
          redirect: 'manual',
        });

        // 如果上游返回重定向且携带 location，则尝试直接重定向（但仍可能因 cookie 问题失败）
        if (upstreamResp.status >= 300 && upstreamResp.status < 400) {
          const loc = upstreamResp.headers.get('location');
          if (loc) {
            const resp = NextResponse.redirect(loc, upstreamResp.status);
            Object.entries(corsHeaders).forEach(([key, value]) => {
              resp.headers.set(key, value as string);
            });
            return resp;
          }
        }

        // 组装返回给客户端的头，并过滤掉 hop-by-hop header
        const respHeaders: Record<string, string> = {};
        const hopByHop = new Set([
          'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade'
        ]);

        upstreamResp.headers.forEach((value, key) => {
          const lk = key.toLowerCase();
          if (hopByHop.has(lk)) return;
          if (lk === 'set-cookie' && !MUSIC_FORWARD_SET_COOKIE) return; // 可选：是否透传 Set-Cookie
          // 保持上游的 Content-*、Accept-*、Content-Range、Content-Length 等头
          respHeaders[key] = value;
        });

        // 合并 CORS 头，优先使用我们的 corsHeaders
        Object.entries(corsHeaders).forEach(([key, value]) => {
          respHeaders[key] = value as string;
        });

        // 将上游响应流直接返回给客户端，保留状态码和头
        return new NextResponse(upstreamResp.body, {
          status: upstreamResp.status,
          headers: respHeaders,
        });
      }

      case 'lrc': {
        let data = musicCache.get(cacheKey);
        
        if (!data) {
          data = await api.lyric(id);
          musicCache.set(cacheKey, data, 86400);
        }

        const lyricData = JSON.parse(data);
        const lyricText = lyricData.lyric || lyricData.lrc || '';
        
        return new NextResponse(lyricText, {
          headers: { 
            'Content-Type': 'text/plain; charset=utf-8',
            ...corsHeaders
          },
        });
      }

      case 'pic': {
        let data = musicCache.get(cacheKey);
        
        if (!data) {
          data = await api.pic(id, 300);
          musicCache.set(cacheKey, data, 86400);
        }

        const picData = JSON.parse(data);
        const response = NextResponse.redirect(picData.url);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type' }, 
          { status: 400, headers: corsHeaders }
        );
    }
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500, headers: corsHeaders }
    );
  }
}
