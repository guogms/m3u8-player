/**
 * Next.js API Route for QQ Music Playlist Parsing
 * 基于PHP Meting库的JavaScript实现
 */

import { NextRequest, NextResponse } from 'next/server';

// QQ音乐Cookie配置 - 使用更新的Cookie
const TENCENT_COOKIE = 'pgv_pvid=7011075408; fqm_pvqid=c9dcdac5-9801-4260-8542-02e8afb652e5; fqm_sessionid=033da63d-c067-4cd1-aa22-415e9a2ad3fe; pgv_info=ssid=s4342232304; ts_last=y.qq.com/; ts_refer=music.qq.com/; ts_uid=3641312091; RK=un/luMc0ev; ptcz=820a203adc3aa8411becbbb4c79a74f7ef49657cd35a05ea9fceaa96cbe6c874; login_type=1; qm_keyst=Q_H_L_53n8FLhZv-LcsnVvHyAlZC7ImWHIcrDMZW73pexh5vpfIaKVsdkKRXg; euin=oKcl7Kc5ow-lNn**; psrf_qqrefresh_token=39E16E19A2CE961BEEEDB15407FAF384; psrf_qqaccess_token=89230D292EFF60B4E342F3204A1A8936; tmeLoginType=2; psrf_musickey_createtime=1647096981; psrf_access_token_expiresAt=1654872981; psrf_qqopenid=63A26BCA9A6F9F36C3DE491FAF8DACF6; psrf_qqunionid=49CA293F90070C2AE233B49BA2F615BB; wxopenid=; qm_keyst=Q_H_L_53n8FLhZv-LcsnVvHyAlZC7ImWHIcrDMZW73pexh5vpfIaKVsdkKRXg; uin=1875812278; qqmusic_key=Q_H_L_53n8FLhZv-LcsnVvHyAlZC7ImWHIcrDMZW73pexh5vpfIaKVsdkKRXg; wxunionid=; wxrefresh_token=';

// 支持的服务器类型
const SUPPORTED_SERVERS = ['netease', 'tencent', 'baidu', 'xiami', 'kugou'];
const SUPPORTED_TYPES = ['song', 'album', 'search', 'artist', 'playlist', 'lrc', 'url', 'pic'];

// 类型定义
interface SongData {
  mid?: string;
  songmid?: string;
  id?: string;
  songname?: string;
  name?: string;
  title?: string;
  album?: {
    title?: string;
    name?: string;
    mid?: string;
    pmid?: string;
  };
  albummid?: string;
  singer?: Array<{ name?: string; title?: string }>;
  singerName?: string;
  file?: {
    media_mid?: string;
    size_320mp3?: number;
    size_192aac?: number;
    size_128mp3?: number;
    size_96aac?: number;
    size_48aac?: number;
    size_24aac?: number;
  };
  type?: number;
  musicData?: any;
}

interface FormattedSong {
  id: string;
  name: string;
  artist: string[];
  album: string;
  pic_id: string;
  url_id: string;
  lyric_id: string;
  source: string;
}

/**
 * 参数验证
 */
function validateParams(server: string | null, type: string | null, id: string | null): boolean {
  if (!server || !SUPPORTED_SERVERS.includes(server)) {
    return false;
  }
  if (!type || !SUPPORTED_TYPES.includes(type)) {
    return false;
  }
  if (!id || id.trim() === '') {
    return false;
  }
  return true;
}

/**
 * 生成随机GUID
 */
function generateGuid(): string {
  return Math.floor(Math.random() * 10000000000).toString();
}

/**
 * 获取QQ音乐请求头
 */
function getTencentHeaders(): HeadersInit {
  return {
    'Referer': 'http://y.qq.com',
    'Cookie': TENCENT_COOKIE,
    'User-Agent': 'QQ音乐/54409 CFNetwork/901.1 Darwin/17.6.0 (x86_64)',
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.8,gl;q=0.6,zh-TW;q=0.4',
    'Connection': 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded'
  };
}

/**
 * 格式化QQ音乐数据
 */
function formatTencentData(data: SongData): FormattedSong {
  console.log('Formatting song data:', JSON.stringify(data, null, 2));
  
  // 处理不同的数据结构
  if (data.musicData) {
    data = data.musicData;
  }
  
  const result: FormattedSong = {
    id: data.mid || data.songmid || data.id || '',
    name: data.songname || data.name || data.title || '',
    artist: [],
    album: '',
    pic_id: '',
    url_id: data.mid || data.songmid || data.id || '',
    lyric_id: data.mid || data.songmid || data.id || '',
    source: 'tencent'
  };
  
  // 处理专辑信息
  if (data.album) {
    result.album = data.album.title || data.album.name || '';
    result.pic_id = data.album.mid || data.album.pmid || '';
  } else if (data.albummid) {
    result.pic_id = data.albummid;
  }
  
  // 处理歌手信息
  if (data.singer && Array.isArray(data.singer)) {
    data.singer.forEach(singer => {
      result.artist.push(singer.name || singer.title || '');
    });
  } else if (data.singerName) {
    result.artist.push(data.singerName);
  }
  
  // 如果没有歌手信息，尝试其他字段
  if (result.artist.length === 0 && data.singerName) {
    result.artist.push(data.singerName);
  }
  
  console.log('Formatted result:', JSON.stringify(result, null, 2));
  
  return result;
}

/**
 * 解析QQ音乐歌单
 */
async function parseTencentPlaylist(id: string): Promise<FormattedSong[]> {
  const url = `https://c.y.qq.com/v8/fcg-bin/fcg_v8_playlist_cp.fcg?id=${id}&format=json&newsong=1&platform=jqspaframe.json`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getTencentHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  // 添加调试信息
  console.log('QQ Music API Response:', JSON.stringify(data, null, 2));
  
  // 检查不同的响应结构
  let songs: SongData[] = [];
  
  if (data.data && data.data.cdlist && data.data.cdlist[0] && data.data.cdlist[0].songlist) {
    songs = data.data.cdlist[0].songlist;
  } else if (data.data && data.data.songlist) {
    songs = data.data.songlist;
  } else if (data.songlist) {
    songs = data.songlist;
  } else if (data.data && Array.isArray(data.data)) {
    songs = data.data;
  } else {
    console.error('Unexpected API response structure:', data);
    throw new Error('Invalid playlist data structure');
  }
  
  if (!Array.isArray(songs) || songs.length === 0) {
    throw new Error('No songs found in playlist');
  }
  
  console.log(`Found ${songs.length} songs in playlist`);
  console.log('First song data:', JSON.stringify(songs[0], null, 2));
  
  return songs.map(formatTencentData);
}

/**
 * 获取QQ音乐歌曲播放链接
 */
async function getTencentUrl(songId: string, br: number = 320) {
  // 首先获取歌曲信息
  const songUrl = `https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songmid=${songId}&platform=yqq&format=json`;
  
  const songResponse = await fetch(songUrl, {
    method: 'GET',
    headers: getTencentHeaders()
  });
  
  if (!songResponse.ok) {
    throw new Error(`HTTP error! status: ${songResponse.status}`);
  }
  
  const songData = await songResponse.json();
  
  if (!songData.data || !songData.data[0]) {
    throw new Error('Invalid song data');
  }
  
  const song = songData.data[0];
  const guid = generateGuid();
  
  // 音质配置
  const qualityTypes: [string, number, string, string][] = [
    ['size_320mp3', 320, 'M800', 'mp3'],
    ['size_192aac', 192, 'C600', 'm4a'],
    ['size_128mp3', 128, 'M500', 'mp3'],
    ['size_96aac', 96, 'C400', 'm4a'],
    ['size_48aac', 48, 'C200', 'm4a'],
    ['size_24aac', 24, 'C100', 'm4a']
  ];
  
  const payload = {
    req_0: {
      module: 'vkey.GetVkeyServer',
      method: 'CgiGetVkey',
      param: {
        guid: guid.toString(),
        songmid: [] as string[],
        filename: [] as string[],
        songtype: [] as number[],
        uin: '0',
        loginflag: 1,
        platform: '20'
      }
    }
  };
  
  // 构建请求参数
  qualityTypes.forEach(type => {
    payload.req_0.param.songmid.push(songId);
    payload.req_0.param.filename.push(`${type[2]}${song.file.media_mid}.${type[3]}`);
    payload.req_0.param.songtype.push(song.type);
  });
  
  // 获取播放链接
  const vkeyUrl = `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&platform=yqq.json&needNewCode=0&data=${encodeURIComponent(JSON.stringify(payload))}`;
  
  const vkeyResponse = await fetch(vkeyUrl, {
    method: 'GET',
    headers: getTencentHeaders()
  });
  
  if (!vkeyResponse.ok) {
    throw new Error(`HTTP error! status: ${vkeyResponse.status}`);
  }
  
  const vkeyData = await vkeyResponse.json();
  
  if (!vkeyData.req_0 || !vkeyData.req_0.data || !vkeyData.req_0.data.midurlinfo) {
    throw new Error('Invalid vkey data');
  }
  
  const vkeys = vkeyData.req_0.data.midurlinfo;
  const sip = vkeyData.req_0.data.sip[0];
  
  // 选择最佳音质
  for (let i = 0; i < qualityTypes.length; i++) {
    const type = qualityTypes[i];
    if (song.file[type[0]] && type[1] <= br) {
      if (vkeys[i] && vkeys[i].vkey) {
        return {
          url: sip + vkeys[i].purl,
          size: song.file[type[0]],
          br: type[1]
        };
      }
    }
  }
  
  return {
    url: '',
    size: 0,
    br: -1
  };
}

/**
 * 获取QQ音乐歌词
 */
async function getTencentLyric(songId: string) {
  const url = `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${songId}&g_tk=5381`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getTencentHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const text = await response.text();
  const jsonStr = text.substring(18, text.length - 1);
  const data = JSON.parse(jsonStr);
  
  return {
    lyric: data.lyric ? Buffer.from(data.lyric, 'base64').toString('utf-8') : '',
    tlyric: data.trans ? Buffer.from(data.trans, 'base64').toString('utf-8') : ''
  };
}

/**
 * 获取QQ音乐专辑图片
 */
function getTencentPic(picId: string, size: number = 300): string {
  return `https://y.gtimg.cn/music/photo_new/T002R${size}x${size}M000${picId}.jpg?max_age=2592000`;
}

/**
 * 解析QQ音乐URL
 */
function parseQQMusicUrl(url: string) {
  const patterns = [
    { regex: /playsquare\/([^\.]*)/i, type: 'playlist' },
    { regex: /playlist\/([^\.]*)/i, type: 'playlist' },
    { regex: /album\/([^\.]*)/i, type: 'album' },
    { regex: /song\/([^\.]*)/i, type: 'song' },
    { regex: /songDetail\/([^\.]*)/i, type: 'song' },
    { regex: /singer\/([^\.]*)/i, type: 'artist' }
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern.regex);
    if (match) {
      return {
        server: 'tencent',
        id: match[1],
        type: pattern.type
      };
    }
  }
  
  return null;
}

/**
 * GET请求处理
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const server = searchParams.get('server');
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  const parseUrl = searchParams.get('url');
  const debug = searchParams.get('debug');
  
  try {
    // 处理调试请求
    if (debug === 'true') {
      const testId = id || '123456'; // 使用默认测试ID
      try {
        const result = await parseTencentPlaylist(testId);
        return NextResponse.json({
          success: true,
          count: result.length,
          data: result.slice(0, 3), // 只返回前3首歌曲
          debug: true
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          debug: true
        }, { status: 500 });
      }
    }
    
    // 处理URL解析请求
    if (parseUrl) {
      const parsed = parseQQMusicUrl(parseUrl);
      if (parsed) {
        return NextResponse.json(parsed);
      } else {
        return NextResponse.json({ error: 'Unsupported URL' }, { status: 400 });
      }
    }
    
    // 参数验证
    if (!validateParams(server, type, id)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 403 });
    }
    
    let result;
    
    switch (type) {
      case 'playlist':
        if (server === 'tencent') {
          result = await parseTencentPlaylist(id!);
        } else {
          return NextResponse.json({ error: 'Unsupported server for playlist' }, { status: 400 });
        }
        break;
        
      case 'url':
        if (server === 'tencent') {
          const br = parseInt(searchParams.get('br') || '320');
          result = await getTencentUrl(id!, br);
        } else {
          return NextResponse.json({ error: 'Unsupported server for URL' }, { status: 400 });
        }
        break;
        
      case 'lrc':
        if (server === 'tencent') {
          result = await getTencentLyric(id!);
        } else {
          return NextResponse.json({ error: 'Unsupported server for lyric' }, { status: 400 });
        }
        break;
        
      case 'pic':
        if (server === 'tencent') {
          const size = parseInt(searchParams.get('size') || '300');
          result = { url: getTencentPic(id!, size) };
        } else {
          return NextResponse.json({ error: 'Unsupported server for picture' }, { status: 400 });
        }
        break;
        
      default:
        return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
