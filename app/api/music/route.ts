import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { getCorsHeaders } from '@/lib/cors';
import { Meting } from '@/lib/meting';
import { musicCache } from '@/lib/music-cache';
import { getCookie, refreshCookie } from '@/lib/music-cookie';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MUSIC_API_SALT = process.env.MUSIC_API_SALT || '';
const MUSIC_USE_SERVER_COOKIE = (process.env.MUSIC_USE_SERVER_COOKIE || 'true') === 'true';
const MUSIC_FORWARD_CLIENT_COOKIE = (process.env.MUSIC_FORWARD_CLIENT_COOKIE || 'true') === 'true';
const MUSIC_FORWARD_SET_COOKIE = (process.env.MUSIC_FORWARD_SET_COOKIE || 'false') === 'true';

type ServerType = 'netease' | 'tencent' | 'xiami' | 'kugou' | 'baidu';
type RequestType = 'song' | 'album' | 'search' | 'artist' | 'playlist' | 'lrc' | 'url' | 'pic';

interface RequestContext {
  request: NextRequest;
  searchParams: URLSearchParams;
  server: ServerType;
  type: RequestType;
  id: string;
  corsHeaders: Record<string, string>;
  baseUrl: string;
  execute: ApiExecutor;
}

type ApiExecutor = <T>(call: (api: Meting) => Promise<T>, validator: (result: T) => boolean) => Promise<T>;
type Handler = (ctx: RequestContext) => Promise<NextResponse>;

const CACHE_TTL = {
  search: 3600,
  collection: 7200,
  url: 1200,
  lyric: 86400,
  pic: 86400,
};

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

const handlers: Partial<Record<RequestType, Handler>> = {
  search: handleSearch,
  song: handleCollection('song'),
  playlist: handleCollection('playlist'),
  url: handleStreamProxy,
  lrc: handleLyric,
  pic: handlePicture,
};

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request.headers.get('origin'));
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request.headers.get('origin'));

  try {
    const context = buildContext(request, corsHeaders);
    if (!context) {
      return jsonError('无效的请求参数', 403, corsHeaders);
    }

    const handler = handlers[context.type];
    if (!handler) {
      return jsonError('不支持的请求类型', 400, corsHeaders);
    }

    return handler(context);
  } catch (error) {
    console.error('[音乐API] 发生错误', error);
    return jsonError('内部服务器错误', 500, corsHeaders);
  }
}

function buildContext(request: NextRequest, corsHeaders: Record<string, string>): RequestContext | null {
  const searchParams = request.nextUrl.searchParams;
  const server = searchParams.get('server') as ServerType;
  const type = searchParams.get('type') as RequestType;
  const id = searchParams.get('id') || '';
  const auth = searchParams.get('auth') || '';

  if (!isValidRequest(server, type, id)) {
    return null;
  }

  if (MUSIC_API_SALT && auth !== generateAuth(server, type, id, MUSIC_API_SALT)) {
    return null;
  }

  const typedServer = server as ServerType;
  const typedType = type as RequestType;

  return {
    request,
    searchParams,
    server: typedServer,
    type: typedType,
    id,
    corsHeaders,
    baseUrl: `${request.nextUrl.origin}/api/music`,
    execute: createApiExecutor(typedServer),
  };
}

function isValidRequest(server: string | null, type: string | null, id: string): server is ServerType {
  const validServers: ServerType[] = ['netease', 'tencent', 'baidu', 'xiami', 'kugou'];
  const validTypes: RequestType[] = ['song', 'album', 'search', 'artist', 'playlist', 'lrc', 'url', 'pic'];

  if (!server || !type) return false;
  if (type === 'pic' && !id.trim()) return validServers.includes(server as ServerType);

  return validServers.includes(server as ServerType) && validTypes.includes(type as RequestType) && !!id.trim();
}

function generateAuth(server: string, type: string, id: string, salt: string): string {
  const eid = server + type + id;
  return crypto.createHash('md5').update(salt + eid + salt).digest('hex');
}

function createApiExecutor(server: ServerType): ApiExecutor {
  return async <T>(call: (api: Meting) => Promise<T>, validator: (result: T) => boolean) => {
    const apiInstance = new Meting(server);
    apiInstance.format(true);

    const initialCookie = await getCookie(server as 'netease' | 'tencent');
    if (initialCookie) {
      apiInstance.cookie(initialCookie);
    }

    let result = await call(apiInstance);

    if (!validator(result)) {
      console.warn(`[音乐API] ${server} API 返回异常，尝试刷新 Cookie`);
      const newCookie = await refreshCookie(server as 'netease' | 'tencent');
      if (newCookie) {
        apiInstance.cookie(newCookie);
        result = await call(apiInstance);
      }
    }

    return result;
  };
}

async function handleSearch(ctx: RequestContext) {
  const keyword = ctx.searchParams.get('keyword') || ctx.id;
  const limit = parseNumber(ctx.searchParams.get('limit'), 30);
  const page = parseNumber(ctx.searchParams.get('page'), 1);
  const cacheKey = `${ctx.server}:search:${keyword}:${limit}:${page}`;

  const data = await withCache(cacheKey, CACHE_TTL.search, () =>
    ctx.execute(
      (api) => api.search(keyword, { limit, page }),
      (text) => text.trim() !== '[]'
    )
  );

  return NextResponse.json(formatSongs(data, ctx.baseUrl), { headers: ctx.corsHeaders });
}

function handleCollection(kind: 'song' | 'playlist'): Handler {
  return async (ctx) => {
    const cacheKey = `${ctx.server}:${kind}:${ctx.id}`;

    const data = await withCache(cacheKey, CACHE_TTL.collection, () =>
      ctx.execute(
        (api) => (kind === 'song' ? api.song(ctx.id) : api.playlist(ctx.id)),
        (text) => text.trim() !== '[]'
      )
    );

    return NextResponse.json(formatSongs(data, ctx.baseUrl), { headers: ctx.corsHeaders });
  };
}

async function handleLyric(ctx: RequestContext) {
  const cacheKey = `${ctx.server}:lrc:${ctx.id}`;

  const data = await withCache(cacheKey, CACHE_TTL.lyric, () =>
    ctx.execute(
      (api) => api.lyric(ctx.id),
      (text) => {
        try {
          const result = JSON.parse(text);
          return Boolean(result?.lyric || result?.lrc);
        } catch {
          return false;
        }
      }
    )
  );

  const payload = JSON.parse(data);
  const lyricText = payload.lyric || payload.lrc || '';

  return new NextResponse(lyricText, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', ...ctx.corsHeaders },
  });
}

async function handlePicture(ctx: RequestContext) {
  const cacheKey = `${ctx.server}:pic:${ctx.id}`;

  const data = await withCache(cacheKey, CACHE_TTL.pic, () =>
    ctx.execute(
      (api) => api.pic(ctx.id, 300),
      (text) => {
        try {
          return Boolean(JSON.parse(text).url);
        } catch {
          return false;
        }
      }
    )
  );

  const payload = JSON.parse(data);
  if (!payload.url) {
    return jsonError('未找到图片URL', 404, ctx.corsHeaders);
  }

  const response = NextResponse.redirect(payload.url);
  applyCors(response, ctx.corsHeaders);
  return response;
}

async function handleStreamProxy(ctx: RequestContext) {
  const cacheKey = `${ctx.server}:url:${ctx.id}`;

  const data = await withCache(cacheKey, CACHE_TTL.url, () =>
    ctx.execute(
      (api) => api.url(ctx.id, 320),
      (text) => {
        try {
          return Boolean(JSON.parse(text).url);
        } catch {
          return false;
        }
      }
    )
  );

  const payload = JSON.parse(data);
  let upstreamUrl: string = payload.url || '';

  if (!upstreamUrl) {
    return jsonError('未找到URL', 404, ctx.corsHeaders);
  }

  if (ctx.server === 'netease') {
    upstreamUrl = upstreamUrl.replace(/https?:\/\/m\dc\./, 'https://m7.');
  }

  const upstreamCookie = await resolvePlaybackCookie(ctx);
  const userAgent = ctx.request.headers.get('user-agent') || 'Mozilla/5.0';
  const range = ctx.request.headers.get('range');

  const headers: Record<string, string> = { accept: '*/*', 'user-agent': userAgent };
  if (upstreamCookie) headers.cookie = upstreamCookie;
  if (range) headers.range = range;

  const upstreamResponse = await fetch(upstreamUrl, { method: 'GET', headers, redirect: 'manual' });

  if (upstreamResponse.status >= 300 && upstreamResponse.status < 400 && upstreamResponse.headers.has('location')) {
    const redirectUrl = upstreamResponse.headers.get('location')!;
    const response = NextResponse.redirect(redirectUrl, upstreamResponse.status);
    applyCors(response, ctx.corsHeaders);
    return response;
  }

  const responseHeaders: Record<string, string> = {};
  upstreamResponse.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowerKey)) return;
    if (lowerKey === 'set-cookie' && !MUSIC_FORWARD_SET_COOKIE) return;
    responseHeaders[key] = value;
  });

  Object.entries(ctx.corsHeaders).forEach(([key, value]) => {
    responseHeaders[key] = value;
  });

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

function formatSongs(data: string, baseUrl: string) {
  try {
    const songs = JSON.parse(data);
    if (!Array.isArray(songs)) return [];

    return songs.map((song: any) => ({
      name: song.name,
      artist: Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist,
      url: buildSignedUrl(baseUrl, song.source, 'url', song.url_id),
      cover: buildSignedUrl(baseUrl, song.source, 'pic', song.pic_id),
      lrc: buildSignedUrl(baseUrl, song.source, 'lrc', song.lyric_id),
    }));
  } catch {
    return [];
  }
}

function buildSignedUrl(baseUrl: string, server: string, type: string, id: string) {
  const auth = MUSIC_API_SALT ? `&auth=${generateAuth(server, type, id, MUSIC_API_SALT)}` : '';
  return `${baseUrl}?server=${server}&type=${type}&id=${id}${auth}`;
}

async function withCache(key: string, ttl: number, fetcher: () => Promise<string>): Promise<string> {
  let data = musicCache.get(key);
  if (!data) {
    data = await fetcher();
    musicCache.set(key, data, ttl);
  }
  return data;
}

function jsonError(message: string, status: number, headers: Record<string, string>) {
  return NextResponse.json({ error: message }, { status, headers });
}

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

async function resolvePlaybackCookie(ctx: RequestContext) {
  const serverCookie = await getCookie(ctx.server as 'netease' | 'tencent');
  if (MUSIC_USE_SERVER_COOKIE && serverCookie) {
    return serverCookie;
  }
  if (MUSIC_FORWARD_CLIENT_COOKIE) {
    return ctx.request.headers.get('cookie') || '';
  }
  return '';
}

function applyCors(response: NextResponse, corsHeaders: Record<string, string>) {
  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
}
