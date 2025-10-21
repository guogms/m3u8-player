/**
 * 音乐API类型定义
 */

// 音乐平台类型
export type MusicServer = 'netease' | 'tencent' | 'baidu' | 'xiami' | 'kugou';

// 请求类型
export type RequestType = 'search' | 'song' | 'playlist' | 'url' | 'lrc' | 'pic' | 'album' | 'artist';

// 歌曲信息
export interface MusicItem {
  name: string;       // 歌曲名称
  artist: string;     // 歌手名称（多个歌手用 " / " 分隔）
  url: string;        // 播放链接API地址
  cover: string;      // 封面图片API地址
  lrc: string;        // 歌词API地址
}

// 播放器状态
export interface PlayerState {
  currentTime: number;    // 当前播放时间（秒）
  currentIndex: number;   // 当前播放索引
  isPlaying: boolean;     // 是否正在播放
  volume: number;         // 音量（0-1）
  timestamp: number;      // 保存时间戳
}

// 搜索参数
export interface SearchParams {
  server: MusicServer;
  type: 'search';
  id: string;             // 搜索关键词
  limit?: number;         // 返回数量，默认30
  page?: number;          // 页码，默认1
  keyword?: string;       // 可选，等同于id
  auth?: string;          // 认证签名
}

// 歌单参数
export interface PlaylistParams {
  server: MusicServer;
  type: 'playlist';
  id: string;             // 歌单ID
  auth?: string;
}

// 歌曲参数
export interface SongParams {
  server: MusicServer;
  type: 'song';
  id: string;             // 歌曲ID
  auth?: string;
}

// URL参数
export interface UrlParams {
  server: MusicServer;
  type: 'url';
  id: string;             // 歌曲ID
  auth?: string;
}

// 歌词参数
export interface LrcParams {
  server: MusicServer;
  type: 'lrc';
  id: string;             // 歌曲ID
  auth?: string;
}

// 图片参数
export interface PicParams {
  server: MusicServer;
  type: 'pic';
  id: string;             // 图片ID
  auth?: string;
}

// API 响应类型
export type MusicAPIResponse = MusicItem[] | { error: string };

// API错误响应
export interface APIError {
  error: string;
}

// 音乐播放器配置
export interface MusicPlayerConfig {
  defaultPlaylistId?: string;
  defaultServer?: MusicServer;
  autoLoad?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// APlayer 配置（简化版）
export interface APlayerOptions {
  container: HTMLElement;
  audio: MusicItem[];
  lrcType?: number;
  listFolded?: boolean;
  listMaxHeight?: string;
  mini?: boolean;
  fixed?: boolean;
  volume?: number;
  storageName?: string;
}

// APlayer 实例接口（简化版）
export interface APlayerInstance {
  audio: HTMLAudioElement;
  list: {
    index: number;
    audios: MusicItem[];
    switch: (index: number) => void;
  };
  play: () => void;
  pause: () => void;
  destroy: () => void;
  volume: (percentage: number) => void;
  on: (event: string, callback: () => void) => void;
}
