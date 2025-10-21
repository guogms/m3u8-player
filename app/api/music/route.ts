// app/api/music/route.ts
// 将此文件内容复制到 app/api/music/route.ts

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

    if (server === 'netease' && NETEASE_COOKIE) {
      api.cookie(NETEASE_COOKIE);
    } else if (server === 'tencent' && TENCENT_COOKIE) {
      api.cookie(TENCENT_COOKIE);
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

        return NextResponse.json(music);
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

        return NextResponse.json(music);
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
          return NextResponse.json({ error: 'URL not found' }, { status: 404 });
        }

        return NextResponse.redirect(url);
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
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      case 'pic': {
        let data = musicCache.get(cacheKey);
        
        if (!data) {
          data = await api.pic(id, 300);
          musicCache.set(cacheKey, data, 86400);
        }

        const picData = JSON.parse(data);
        return NextResponse.redirect(picData.url);
      }

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
