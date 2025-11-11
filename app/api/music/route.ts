// app/api/music/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Meting } from '@/lib/meting';
import { musicCache } from '@/lib/music-cache';
import { getCorsHeaders } from '@/lib/cors';
import { getCookie, refreshCookie } from '@/lib/music-cookie';
import crypto from 'crypto';

// 强制此API路由进行动态渲染。
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MUSIC_API_SALT = process.env.MUSIC_API_SALT || '';

// 从环境变量配置开关。
const MUSIC_USE_SERVER_COOKIE = (process.env.MUSIC_USE_SERVER_COOKIE || 'true') === 'true';
const MUSIC_FORWARD_CLIENT_COOKIE = (process.env.MUSIC_FORWARD_CLIENT_COOKIE || 'true') === 'true';
const MUSIC_FORWARD_SET_COOKIE = (process.env.MUSIC_FORWARD_SET_COOKIE || 'false') === 'true';

type ServerType = 'netease' | 'tencent' | 'xiami' | 'kugou' | 'baidu';
type RequestType = 'song' | 'album' | 'search' | 'artist' | 'playlist' | 'lrc' | 'url' | 'pic';

/**
 * 验证音乐API请求的核心参数。
 */
function validateParams(server: string, type: string, id: string): boolean {
  const validServers: ServerType[] = ['netease', 'tencent', 'baidu', 'xiami', 'kugou'];
  const validTypes: RequestType[] = ['song', 'album', 'search', 'artist', 'playlist', 'lrc', 'url', 'pic'];
  
  if (type === 'pic' && (!id || !id.trim())) {
    return true; // 允许为默认图片使用空ID。
  }
  
  return validServers.includes(server as ServerType) && validTypes.includes(type as RequestType) && !!id?.trim();
}

/**
 * 如果配置了MUSIC_API_SALT，则生成认证哈希值。
 */
function generateAuth(server: string, type: string, id: string, salt: string): string {
  const eid = server + type + id;
  return crypto.createHash('md5').update(salt + eid + salt).digest('hex');
}

/**
 * 处理CORS的OPTIONS预检请求。
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

/**
 * 处理对音乐API的GET请求。
 */
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
      return NextResponse.json({ error: '无效的参数' }, { status: 403, headers: corsHeaders });
    }

    if (MUSIC_API_SALT && auth !== generateAuth(server, type, id, MUSIC_API_SALT)) {
      return NextResponse.json({ error: '无效的认证' }, { status: 403, headers: corsHeaders });
    }

    const api = new Meting(server);
    api.format(true);

    const cacheKey = `${server}${type}${id}`;
    const baseUrl = `${request.nextUrl.origin}/api/music`;

    // 辅助函数，用于处理和格式化歌曲数据
    const processAndFormatSongs = (data: string) => {
      try {
        const songs = JSON.parse(data);
        if (!Array.isArray(songs)) return [];
        return songs.map((song: any) => ({
          name: song.name,
          artist: Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist,
          url: `${baseUrl}?server=${song.source}&type=url&id=${song.url_id}${MUSIC_API_SALT ? `&auth=${generateAuth(song.source, 'url', song.url_id, MUSIC_API_SALT)}` : ''}`,
          cover: `${baseUrl}?server=${song.source}&type=pic&id=${song.pic_id}${MUSIC_API_SALT ? `&auth=${generateAuth(song.source, 'pic', song.pic_id, MUSIC_API_SALT)}` : ''}`,
          lrc: `${baseUrl}?server=${song.source}&type=lrc&id=${song.lyric_id}${MUSIC_API_SALT ? `&auth=${generateAuth(song.source, 'lrc', song.lyric_id, MUSIC_API_SALT)}` : ''}`,
        }));
      } catch {
        return [];
      }
    };
    
    // 针对特定API调用的带有重试逻辑的请求执行器
    const executeApiCall = async <T>(
      apiCall: (apiInstance: Meting) => Promise<T>,
      validator: (result: T) => boolean
    ): Promise<T> => {
      const apiInstance = new Meting(server);
      apiInstance.format(true);

      const initialCookie = await getCookie(server as 'netease' | 'tencent');
      if (initialCookie) {
        apiInstance.cookie(initialCookie);
      }

      let result = await apiCall(apiInstance);

      if (!validator(result)) {
        console.warn(`[音乐API] ${server} 的初始API调用返回无效数据，尝试刷新Cookie。`);
        const newCookie = await refreshCookie(server as 'netease' | 'tencent');
        if (newCookie) {
          apiInstance.cookie(newCookie);
          console.log(`[音乐API] 使用新的Cookie为 ${server} 重试API调用。`);
          result = await apiCall(apiInstance);
        } else {
            console.error(`[音乐API] 无法为 ${server} 刷新Cookie。`);
        }
      }
      return result;
    };


    switch (type) {
      case 'search': {
        const keyword = searchParams.get('keyword') || id;
        const limit = parseInt(searchParams.get('limit') || '30');
        const page = parseInt(searchParams.get('page') || '1');
        const searchKey = `${server}search${keyword}${limit}${page}`;
        
        let data = musicCache.get(searchKey);
        if (!data) {
          data = await executeApiCall(
            (api) => api.search(keyword, { limit, page }),
            (res) => res.trim() !== '[]'
          );
          musicCache.set(searchKey, data, 3600);
        }
        
        return NextResponse.json(processAndFormatSongs(data), { headers: corsHeaders });
      }

      case 'song':
      case 'playlist': {
        let data = musicCache.get(cacheKey);
        if (!data) {
          const apiCall = type === 'song' ? (api: Meting) => api.song(id) : (api: Meting) => api.playlist(id);
          data = await executeApiCall(apiCall, (res) => res.trim() !== '[]');
          musicCache.set(cacheKey, data, 7200);
        }
        
        return NextResponse.json(processAndFormatSongs(data), { headers: corsHeaders });
      }

      case 'url': {
        let data = musicCache.get(cacheKey);
        if (!data) {
            data = await executeApiCall(
                (api) => api.url(id, 320),
                (res) => {
                    try { return !!JSON.parse(res).url; } catch { return false; }
                }
            );
            musicCache.set(cacheKey, data, 1200);
        }

        const urlData = JSON.parse(data);
        let url = urlData.url || '';

        if (!url) {
          return NextResponse.json({ error: '未找到URL' }, { status: 404, headers: corsHeaders });
        }
        
        if (server === 'netease') {
          url = url.replace(/https?:\/\/m\dc\./, 'https://m7.');
        }

        const clientCookie = request.headers.get('cookie') || '';
        const serverCookie = await getCookie(server as 'netease' | 'tencent');
        
        let upstreamCookie = '';
        if (MUSIC_USE_SERVER_COOKIE && serverCookie) {
          upstreamCookie = serverCookie;
        } else if (MUSIC_FORWARD_CLIENT_COOKIE && clientCookie) {
          upstreamCookie = clientCookie;
        }

        const range = request.headers.get('range');
        const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0';
        
        const fetchHeaders: Record<string, string> = { 'accept': '*/*', 'user-agent': userAgent };
        if (upstreamCookie) fetchHeaders['cookie'] = upstreamCookie;
        if (range) fetchHeaders['range'] = range;

        const upstreamResp = await fetch(url, { method: 'GET', headers: fetchHeaders, redirect: 'manual' });

        if (upstreamResp.status >= 300 && upstreamResp.status < 400 && upstreamResp.headers.has('location')) {
            const loc = upstreamResp.headers.get('location')!;
            const resp = NextResponse.redirect(loc, upstreamResp.status);
            Object.entries(corsHeaders).forEach(([key, value]) => resp.headers.set(key, value as string));
            return resp;
        }

        const respHeaders: Record<string, string> = {};
        const hopByHop = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade']);
        
        upstreamResp.headers.forEach((value, key) => {
          const lk = key.toLowerCase();
          if (hopByHop.has(lk)) return;
          if (lk === 'set-cookie' && !MUSIC_FORWARD_SET_COOKIE) return;
          respHeaders[key] = value;
        });

        Object.entries(corsHeaders).forEach(([key, value]) => {
          respHeaders[key] = value as string;
        });

        return new NextResponse(upstreamResp.body, { status: upstreamResp.status, headers: respHeaders });
      }

      case 'lrc': {
        let data = musicCache.get(cacheKey);
        if (!data) {
            data = await executeApiCall(
                (api) => api.lyric(id),
                (res) => {
                    try { const d = JSON.parse(res); return !!(d.lyric || d.lrc); } catch { return false; }
                }
            );
            musicCache.set(cacheKey, data, 86400);
        }
        
        const lyricData = JSON.parse(data);
        const lyricText = lyricData.lyric || lyricData.lrc || '';
        
        return new NextResponse(lyricText, { headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders } });
      }

      case 'pic': {
        let data = musicCache.get(cacheKey);
        if (!data) {
            data = await executeApiCall(
                (api) => api.pic(id, 300),
                (res) => {
                    try { return !!JSON.parse(res).url; } catch { return false; }
                }
            );
            musicCache.set(cacheKey, data, 86400);
        }
        
        const picData = JSON.parse(data);
        if (!picData.url) {
            return NextResponse.json({ error: '未找到图片URL' }, { status: 404, headers: corsHeaders });
        }
        const response = NextResponse.redirect(picData.url);
        Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value as string));
        return response;
      }

      default:
        return NextResponse.json({ error: '无效的类型' }, { status: 400, headers: corsHeaders });
    }
  } catch (error) {
    console.error('[音乐API错误]', error);
    return NextResponse.json({ error: '内部服务器错误' }, { status: 500, headers: corsHeaders });
  }
}
