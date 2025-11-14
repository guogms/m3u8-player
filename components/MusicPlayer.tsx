'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import 'aplayer/dist/APlayer.min.css';

type MusicServer = 'netease' | 'tencent' | 'baidu';

interface MusicItem {
  name: string;
  artist: string;
  url: string;
  cover: string;
  lrc: string;
}

interface PlayerState {
  currentTime: number;
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  timestamp: number;
}

interface MusicPlayerProps {
  defaultPlaylistId?: string;
  defaultServer?: MusicServer;
  autoLoad?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const LIST_CACHE_KEY = 'm3u8-player:playlist';
const PLAYER_STATE_KEY = 'm3u8-player:state';

export default function MusicPlayer({
  defaultPlaylistId = '2829883691',
  defaultServer = 'netease',
  autoLoad = true,
}: MusicPlayerProps) {
  const [tracks, setTracks] = useState<MusicItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<MusicItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlistId, setPlaylistId] = useState(defaultPlaylistId);
  const [keyword, setKeyword] = useState('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);

  const saveState = useCallback(() => {
    if (!playerRef.current) return;
    const state: PlayerState = {
      currentTime: playerRef.current.audio.currentTime,
      currentIndex: playerRef.current.list.index,
      isPlaying: !playerRef.current.audio.paused,
      volume: playerRef.current.audio.volume,
      timestamp: Date.now(),
    };
    localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state));
  }, []);

  const restoreState = useCallback(() => {
    if (!playerRef.current) return;
    const saved = localStorage.getItem(PLAYER_STATE_KEY);
    if (!saved) return;

    try {
      const state: PlayerState = JSON.parse(saved);
      if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) return;

      if (typeof state.volume === 'number') {
        playerRef.current.volume(state.volume);
      }
      if (typeof state.currentIndex === 'number') {
        playerRef.current.list.switch(state.currentIndex);
      }
      if (typeof state.currentTime === 'number') {
        playerRef.current.audio.currentTime = state.currentTime;
      }
      if (state.isPlaying) {
        setTimeout(() => playerRef.current?.play(), 150);
      }
    } catch (err) {
      console.warn('Failed to restore music state', err);
    }
  }, []);

  const hydratePlayer = useCallback(async () => {
    if (!containerRef.current || !tracks.length) return;
    const APlayer = (await import('aplayer')).default as any;

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (err) {
        console.warn('Failed to destroy APlayer', err);
      }
      playerRef.current = null;
    }

    containerRef.current.innerHTML = '';
    playerRef.current = new APlayer({
      container: containerRef.current,
      audio: tracks,
      lrcType: 3,
      listFolded: false,
      listMaxHeight: '320px',
      autoplay: false,
    });

    setNowPlaying(tracks[0]);
    restoreState();

    const handlePlay = () => {
      const audio = playerRef.current.list.audios[playerRef.current.list.index] || null;
      setNowPlaying(audio);
      saveState();
    };
    const handlePause = () => saveState();
    playerRef.current.on('listswitch', handlePlay);
    playerRef.current.audio.addEventListener('play', handlePlay);
    playerRef.current.audio.addEventListener('pause', handlePause);
  }, [tracks, restoreState, saveState]);

  const persistTracks = useCallback((list: MusicItem[]) => {
    try {
      localStorage.setItem(LIST_CACHE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('Failed to cache playlist', err);
    }
  }, []);

  const loadPlaylist = useCallback(
    async (id: string) => {
      if (!id.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/music?server=${defaultServer}&type=playlist&id=${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error('加载歌单失败');
        const data: MusicItem[] = await response.json();
        if (!data.length) throw new Error('歌单为空或无法解析');
        setTracks(data);
        setNowPlaying(data[0]);
        persistTracks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    },
    [defaultServer, persistTracks]
  );

  const searchMusic = useCallback(
    async (term: string) => {
      if (!term.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/music?server=${defaultServer}&type=search&id=${encodeURIComponent(term)}&limit=30`
        );
        if (!response.ok) throw new Error('搜索失败');
        const data: MusicItem[] = await response.json();
        if (!data.length) throw new Error('未找到匹配的歌曲');
        setTracks(data);
        setNowPlaying(data[0]);
        persistTracks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    },
    [defaultServer, persistTracks]
  );

  useEffect(() => {
    const cached = localStorage.getItem(LIST_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
          setTracks(parsed);
          setNowPlaying(parsed[0]);
          return;
        }
      } catch {
        localStorage.removeItem(LIST_CACHE_KEY);
      }
    }
    if (autoLoad) {
      void loadPlaylist(defaultPlaylistId);
    }
  }, [autoLoad, defaultPlaylistId, loadPlaylist]);

  useEffect(() => {
    if (!tracks.length) return;
    void hydratePlayer();
  }, [tracks, hydratePlayer]);

  useEffect(() => {
    return () => {
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
    };
  }, []);

  const handlePlaylistSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void loadPlaylist(playlistId);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void searchMusic(keyword);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-black/25 backdrop-blur">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.5em] text-blue-300">Music API Preview</p>
        <h2 className="text-2xl font-semibold text-white">多平台歌单解析播放器</h2>
        <p className="text-sm text-slate-300">同一个 API 同时输出歌曲、封面、歌词链接，使用 APlayer 就能快速搭建可用播放器。</p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form onSubmit={handlePlaylistSubmit} className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <label className="text-sm font-semibold text-slate-200" htmlFor="playlistId">
            歌单 ID
          </label>
          <div className="flex gap-3">
            <input
              id="playlistId"
              value={playlistId}
              onChange={(event) => setPlaylistId(event.target.value)}
              placeholder="例如：2829883691"
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
              disabled={loading}
            >
              {loading ? '加载中…' : '加载歌单'}
            </button>
          </div>
        </form>

        <form onSubmit={handleSearchSubmit} className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <label className="text-sm font-semibold text-slate-200" htmlFor="keyword">
            搜索歌曲 / 歌手
          </label>
          <div className="flex gap-3">
            <input
              id="keyword"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="输入关键字，如：周杰伦"
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600"
              disabled={loading}
            >
              {loading ? '搜索中…' : '开始搜索'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</p>
      )}

      {nowPlaying && (
        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200">
          <div className="h-14 w-14 overflow-hidden rounded-xl bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={nowPlaying.cover} alt={nowPlaying.name} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">{nowPlaying.name}</p>
            <p className="text-xs uppercase tracking-widest text-blue-200">{nowPlaying.artist}</p>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="mt-6 min-h-[320px] rounded-2xl border border-white/5 bg-black/20 p-3 shadow-inner shadow-black/30"
      />
    </section>
  );
}
