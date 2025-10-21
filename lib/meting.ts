/**
 * Meting music framework TypeScript implementation
 * Based on https://github.com/metowolf/Meting
 * Version 1.5.7
 */

import crypto from 'crypto';

type ServerType = 'netease' | 'tencent' | 'xiami' | 'kugou' | 'baidu';
type RequestType = 'song' | 'album' | 'search' | 'artist' | 'playlist' | 'lrc' | 'url' | 'pic';

interface ApiConfig {
  method: 'GET' | 'POST';
  url: string;
  body?: Record<string, any>;
  encode?: string;
  decode?: string;
  format?: string;
}

interface MusicInfo {
  name: string;
  artist: string[];
  url_id: string;
  pic_id: string;
  lyric_id: string;
  source: string;
}

export class Meting {
  private server: ServerType;
  private header: Record<string, string>;
  private proxy: string | null = null;
  private cookieValue: string = '';
  private formatOutput: boolean = false;

  constructor(server: ServerType = 'netease') {
    this.server = server;
    this.header = this.curlset();
  }

  private curlset(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Connection': 'keep-alive'
    };

    switch (this.server) {
      case 'netease':
        headers['Referer'] = 'https://music.163.com';
        break;
      case 'tencent':
        headers['Referer'] = 'https://y.qq.com';
        break;
      case 'xiami':
        headers['Referer'] = 'https://www.xiami.com';
        break;
      case 'kugou':
        headers['Referer'] = 'https://www.kugou.com';
        break;
      case 'baidu':
        headers['Referer'] = 'https://music.taihe.com';
        break;
    }

    return headers;
  }

  site(server: ServerType): this {
    this.server = server;
    this.header = this.curlset();
    return this;
  }

  cookie(value: string): this {
    this.cookieValue = value;
    this.header['Cookie'] = value;
    return this;
  }

  format(value: boolean = true): this {
    this.formatOutput = value;
    return this;
  }

  private async exec(api: ApiConfig): Promise<any> {
    if (api.encode) {
      api = await this.encodeRequest(api);
    }

    let url = api.url;
    const options: RequestInit = {
      method: api.method,
      headers: this.header,
    };

    if (api.method === 'GET' && api.body) {
      const params = new URLSearchParams(api.body as any);
      url += '?' + params.toString();
    } else if (api.method === 'POST' && api.body) {
      options.body = typeof api.body === 'string' ? api.body : JSON.stringify(api.body);
      if (typeof api.body !== 'string') {
        this.header['Content-Type'] = 'application/json';
      }
    }

    try {
      const response = await fetch(url, options);
      let data = await response.text();

      if (!this.formatOutput) {
        return data;
      }

      if (api.decode) {
        data = this.decodeResponse(data, api.decode);
      }

      if (api.format) {
        return this.clean(data, api.format);
      }

      return data;
    } catch (error) {
      console.error('Meting request failed:', error);
      throw error;
    }
  }

  private encodeRequest(api: ApiConfig): ApiConfig {
    // Implement encoding logic for different platforms
    switch (api.encode) {
      case 'netease_AESCBC':
        return this.neteaseAESCBC(api);
      // Add other encoding methods as needed
      default:
        return api;
    }
  }

  private neteaseAESCBC(api: ApiConfig): ApiConfig {
    const text = JSON.stringify(api.body);
    const secKey = this.createSecretKey(16);
    const encText = this.aesEncrypt(this.aesEncrypt(text, '0CoJUm6Qyw8W8jud'), secKey);
    const encSecKey = this.rsaEncrypt(secKey);

    api.body = {
      params: encText,
      encSecKey: encSecKey,
    };

    return api;
  }

  private createSecretKey(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  private aesEncrypt(text: string, key: string): string {
    const iv = '0102030405060708';
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  private rsaEncrypt(text: string): string {
    const n = '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7';
    const e = '010001';
    
    text = text.split('').reverse().join('');
    const hexText = Buffer.from(text, 'utf8').toString('hex');
    
    // Simple RSA implementation
    const biText = BigInt('0x' + hexText);
    const biN = BigInt('0x' + n);
    const biE = BigInt('0x' + e);
    const biRet = this.powMod(biText, biE, biN);
    
    return biRet.toString(16).padStart(256, '0');
  }

  private powMod(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = BigInt(1);
    base = base % mod;
    while (exp > BigInt(0)) {
      if (exp % BigInt(2) === BigInt(1)) {
        result = (result * base) % mod;
      }
      exp = exp / BigInt(2);
      base = (base * base) % mod;
    }
    return result;
  }

  private decodeResponse(data: string, method: string): string {
    switch (method) {
      case 'netease_url':
        const json = JSON.parse(data);
        if (json.data && json.data[0]) {
          return JSON.stringify({ url: json.data[0].url || '' });
        }
        return JSON.stringify({ url: '' });
      default:
        return data;
    }
  }

  private clean(raw: string, rule: string): string {
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return '[]';
    }

    if (rule) {
      const keys = rule.split('.');
      for (const key of keys) {
        if (data && typeof data === 'object' && key in data) {
          data = data[key];
        } else {
          return '[]';
        }
      }
    }

    if (!Array.isArray(data) && data !== null) {
      data = [data];
    }

    const result = (data || []).map((item: any) => this.formatData(item));
    return JSON.stringify(result);
  }

  private formatData(item: any): MusicInfo {
    switch (this.server) {
      case 'netease':
        return this.formatNetease(item);
      case 'tencent':
        return this.formatTencent(item);
      default:
        return item;
    }
  }

  private formatNetease(item: any): MusicInfo {
    return {
      name: item.name || '',
      artist: (item.ar || item.artists || []).map((a: any) => a.name),
      url_id: item.id?.toString() || '',
      pic_id: item.al?.id?.toString() || item.album?.id?.toString() || '',
      lyric_id: item.id?.toString() || '',
      source: 'netease',
    };
  }

  private formatTencent(item: any): MusicInfo {
    return {
      name: item.songname || item.name || '',
      artist: (item.singer || []).map((s: any) => s.name),
      url_id: item.songmid || item.mid || '',
      pic_id: item.albummid || '',
      lyric_id: item.songmid || item.mid || '',
      source: 'tencent',
    };
  }

  async search(keyword: string, option: any = {}): Promise<string> {
    let api: ApiConfig;

    switch (this.server) {
      case 'netease':
        api = {
          method: 'POST',
          url: 'http://music.163.com/api/cloudsearch/pc',
          body: {
            s: keyword,
            type: option.type || 1,
            limit: option.limit || 30,
            total: 'true',
            offset: option.page && option.limit ? (option.page - 1) * option.limit : 0,
          },
          encode: 'netease_AESCBC',
          format: 'result.songs',
        };
        break;
      case 'tencent':
        api = {
          method: 'GET',
          url: 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp',
          body: {
            format: 'json',
            p: option.page || 1,
            n: option.limit || 30,
            w: keyword,
            aggr: 1,
            lossless: 1,
            cr: 1,
            new_json: 1,
          },
          format: 'data.song.list',
        };
        break;
      default:
        throw new Error('Server not supported');
    }

    return this.exec(api);
  }

  async song(id: string): Promise<string> {
    let api: ApiConfig;

    switch (this.server) {
      case 'netease':
        api = {
          method: 'POST',
          url: 'http://music.163.com/api/v3/song/detail/',
          body: {
            c: `[{"id":${id},"v":0}]`,
          },
          encode: 'netease_AESCBC',
          format: 'songs',
        };
        break;
      case 'tencent':
        api = {
          method: 'GET',
          url: 'https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg',
          body: {
            songmid: id,
            platform: 'yqq',
            format: 'json',
          },
          format: 'data',
        };
        break;
      default:
        throw new Error('Server not supported');
    }

    return this.exec(api);
  }

  async playlist(id: string): Promise<string> {
    let api: ApiConfig;

    switch (this.server) {
      case 'netease':
        api = {
          method: 'POST',
          url: 'http://music.163.com/api/v6/playlist/detail',
          body: {
            s: '0',
            id: id,
            n: '1000',
            t: '0',
          },
          encode: 'netease_AESCBC',
          format: 'playlist.tracks',
        };
        break;
      case 'tencent':
        api = {
          method: 'GET',
          url: 'https://c.y.qq.com/v8/fcg-bin/fcg_v8_playlist_cp.fcg',
          body: {
            id: id,
            format: 'json',
            newsong: 1,
            platform: 'jqspaframe.json',
          },
          format: 'data.cdlist.0.songlist',
        };
        break;
      default:
        throw new Error('Server not supported');
    }

    return this.exec(api);
  }

  async url(id: string, br: number = 320): Promise<string> {
    let api: ApiConfig;

    switch (this.server) {
      case 'netease':
        api = {
          method: 'POST',
          url: 'http://music.163.com/api/song/enhance/player/url',
          body: {
            ids: [id],
            br: br * 1000,
          },
          encode: 'netease_AESCBC',
          decode: 'netease_url',
        };
        break;
      case 'tencent':
        api = {
          method: 'GET',
          url: 'https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg',
          body: {
            songmid: id,
            platform: 'yqq',
            format: 'json',
          },
        };
        break;
      default:
        throw new Error('Server not supported');
    }

    return this.exec(api);
  }

  async lyric(id: string): Promise<string> {
    let api: ApiConfig;

    switch (this.server) {
      case 'netease':
        api = {
          method: 'POST',
          url: 'http://music.163.com/api/song/lyric',
          body: {
            id: id,
            lv: -1,
            tv: -1,
          },
          encode: 'netease_AESCBC',
        };
        break;
      case 'tencent':
        api = {
          method: 'GET',
          url: 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg',
          body: {
            songmid: id,
            format: 'json',
            nobase64: 1,
          },
        };
        break;
      default:
        throw new Error('Server not supported');
    }

    return this.exec(api);
  }

  async pic(id: string, size: number = 300): Promise<string> {
    let url = '';

    switch (this.server) {
      case 'netease':
        url = `https://p3.music.126.net/${id}/${id}.jpg?param=${size}y${size}`;
        break;
      case 'tencent':
        url = `https://y.gtimg.cn/music/photo_new/T002R${size}x${size}M000${id}.jpg`;
        break;
    }

    return JSON.stringify({ url });
  }
}
