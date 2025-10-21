'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'aplayer/dist/APlayer.min.css';

// 音乐数据接口
interface MusicItem {
  name: string;
  artist: string;
  url: string;
  cover: string;
  lrc: string;
}

// 播放器状态接口
interface PlayerState {
  currentTime: number;
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  timestamp: number;
}

// 组件Props
interface MusicPlayerProps {
  defaultPlaylistId?: string;  // 默认歌单ID
  defaultServer?: 'netease' | 'tencent' | 'baidu';  // 默认音乐平台
  autoLoad?: boolean;  // 是否自动加载
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';  // 位置
}

const MUSIC_STORAGE_KEY = 'GlobalAPlayer_State';
const MUSIC_LIST_STORAGE_KEY = 'GlobalAPlayer_MusicList';

export default function MusicPlayer({
  defaultPlaylistId = '2829883691',
  defaultServer = 'netease',
  autoLoad = true,
  position = 'top-right'
}: MusicPlayerProps) {
  const [isShow, setIsShow] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCover, setCurrentCover] = useState('');
  const [isFirstClick, setIsFirstClick] = useState(true);
  const [musicList, setMusicList] = useState<MusicItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 位置样式
  const getPositionStyle = () => {
    const styles: Record<string, React.CSSProperties> = {
      'top-right': { top: '1rem', right: '1rem' },
      'top-left': { top: '1rem', left: '1rem' },
      'bottom-right': { bottom: '1rem', right: '1rem' },
      'bottom-left': { bottom: '1rem', left: '1rem' },
    };
    return styles[position];
  };

  // 从API加载歌单
  const loadPlaylist = async (playlistId: string, server: string = defaultServer) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/music?server=${server}&type=playlist&id=${playlistId}`);
      if (!response.ok) {
        throw new Error('Failed to load playlist');
      }
      const data: MusicItem[] = await response.json();
      
      if (data && data.length > 0) {
        setMusicList(data);
        if (data[0].cover) {
          setCurrentCover(data[0].cover);
        }
        // 保存到本地存储
        localStorage.setItem(MUSIC_LIST_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.error('Failed to load playlist:', error);
      // 尝试从缓存加载
      const cached = localStorage.getItem(MUSIC_LIST_STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        setMusicList(data);
        if (data[0]?.cover) {
          setCurrentCover(data[0].cover);
        }
        return data;
      }
    } finally {
      setLoading(false);
    }
    return [];
  };

  // 搜索歌曲
  const searchMusic = async (keyword: string, server: string = defaultServer, limit: number = 30) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/music?server=${server}&type=search&id=${encodeURIComponent(keyword)}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error('Failed to search music');
      }
      const data: MusicItem[] = await response.json();
      
      if (data && data.length > 0) {
        setMusicList(data);
        if (data[0].cover) {
          setCurrentCover(data[0].cover);
        }
        return data;
      }
    } catch (error) {
      console.error('Failed to search music:', error);
    } finally {
      setLoading(false);
    }
    return [];
  };

  // 保存播放状态
  const savePlayerState = () => {
    if (playerRef.current) {
      const state: PlayerState = {
        currentTime: playerRef.current.audio.currentTime,
        currentIndex: playerRef.current.list.index,
        isPlaying: !playerRef.current.audio.paused,
        volume: playerRef.current.audio.volume,
        timestamp: Date.now(),
      };
      localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(state));
    }
  };

  // 恢复播放状态
  const restorePlayerState = () => {
    if (!playerRef.current) return;

    try {
      const saved = localStorage.getItem(MUSIC_STORAGE_KEY);
      if (saved) {
        const state: PlayerState = JSON.parse(saved);
        // 检查是否过期（24小时）
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          if (state.currentIndex !== undefined) {
            playerRef.current.list.switch(state.currentIndex);
          }
          if (state.volume !== undefined) {
            playerRef.current.volume(state.volume);
          }
          if (state.currentTime !== undefined) {
            playerRef.current.audio.currentTime = state.currentTime;
          }
          if (state.isPlaying) {
            setTimeout(() => playerRef.current?.play(), 100);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to restore player state:', error);
    }
  };

  // 初始化播放器
  const initPlayer = async () => {
    if (!containerRef.current || musicList.length === 0) return;

    // 动态导入APlayer
    const APlayer = (await import('aplayer')).default;

    // 销毁旧播放器
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.warn('Failed to destroy player:', e);
      }
      playerRef.current = null;
    }

    // 清空容器
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    try {
      // 创建新播放器
      playerRef.current = new APlayer({
        container: containerRef.current,
        audio: musicList,
        lrcType: 3,
        listFolded: false,
        listMaxHeight: '324px',
        mini: false,
        fixed: false,
        volume: 0.8,
        storageName: 'GlobalAPlayer',
      });

      // 绑定事件
      playerRef.current.on('play', () => {
        setIsPlaying(true);
        const currentAudio = playerRef.current.list.audios[playerRef.current.list.index];
        if (currentAudio?.cover) {
          setCurrentCover(currentAudio.cover);
        }
        savePlayerState();
      });

      playerRef.current.on('pause', () => {
        setIsPlaying(false);
        savePlayerState();
      });

      playerRef.current.on('ended', () => {
        setIsPlaying(false);
        savePlayerState();
      });

      playerRef.current.on('timeupdate', () => {
        // 每5秒保存一次状态
        if (Math.floor(playerRef.current.audio.currentTime) % 5 === 0) {
          savePlayerState();
        }
      });

      playerRef.current.on('listswitch', () => {
        savePlayerState();
      });

      // 恢复播放状态
      setTimeout(() => restorePlayerState(), 200);
    } catch (error) {
      console.error('Failed to initialize player:', error);
    }
  };

  // 切换显示状态
  const toggleShow = () => {
    if (isFirstClick) {
      setIsShow(true);
      setIsFirstClick(false);
      setTimeout(() => playerRef.current?.play(), 100);
    } else {
      setIsShow(!isShow);
    }
  };

  // 组件挂载时初始化
  useEffect(() => {
    if (autoLoad) {
      // 尝试从缓存加载
      const cached = localStorage.getItem(MUSIC_LIST_STORAGE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setMusicList(data);
          if (data[0]?.cover) {
            setCurrentCover(data[0].cover);
          }
        } catch (e) {
          console.warn('Failed to load cached music list:', e);
        }
      }
      
      // 从服务器加载默认歌单
      if (defaultPlaylistId) {
        loadPlaylist(defaultPlaylistId, defaultServer);
      }
    }
  }, [autoLoad, defaultPlaylistId, defaultServer]);

  // 当音乐列表变化时初始化播放器
  useEffect(() => {
    if (musicList.length > 0) {
      initPlayer();
    }

    // 清理函数
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn('Failed to destroy player:', e);
        }
        playerRef.current = null;
      }
    };
  }, [musicList]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isShow && !target.closest('.music-player-container')) {
        setIsShow(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isShow]);

  return (
    <div className="music-player-container" style={getPositionStyle()}>
      {/* 封面按钮 */}
      {currentCover && (
        <div
          className={`music-cover ${isPlaying ? 'playing' : ''}`}
          onClick={toggleShow}
          style={{ cursor: 'pointer' }}
        >
          <img src={currentCover} alt="音乐封面" />
          {loading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      )}

      {/* 播放器面板 */}
      {isShow && (
        <div className="music-panel">
          <div className="close-btn" onClick={() => setIsShow(false)}>
            ✕
          </div>
          <div ref={containerRef} id="music-player"></div>
        </div>
      )}

      <style jsx>{`
        .music-player-container {
          position: fixed;
          z-index: 9999;
        }

        .music-cover {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 2px solid #fff;
          transition: all 0.3s ease;
          position: relative;
        }

        .music-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .music-cover:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .music-cover.playing img {
          animation: rotate 3s linear infinite;
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #fff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .music-panel {
          position: fixed;
          ${position.includes('right') ? 'right: 1rem;' : 'left: 1rem;'}
          ${position.includes('top') ? 'top: 5rem;' : 'bottom: 5rem;'}
          width: 340px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .close-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.3);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background 0.2s;
          font-size: 18px;
          line-height: 1;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.5);
        }

        :global(.aplayer-list-title),
        :global(.aplayer-title) {
          color: #3c3c43 !important;
        }
      `}</style>
    </div>
  );
}

// 导出搜索和加载函数的Hook
export function useMusicPlayer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMusic = async (
    keyword: string,
    server: 'netease' | 'tencent' | 'baidu' = 'netease',
    limit: number = 30
  ): Promise<MusicItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/music?server=${server}&type=search&id=${encodeURIComponent(keyword)}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylist = async (
    playlistId: string,
    server: 'netease' | 'tencent' | 'baidu' = 'netease'
  ): Promise<MusicItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/music?server=${server}&type=playlist&id=${playlistId}`);
      if (!response.ok) {
        throw new Error('Load playlist failed');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getSong = async (
    songId: string,
    server: 'netease' | 'tencent' | 'baidu' = 'netease'
  ): Promise<MusicItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/music?server=${server}&type=song&id=${songId}`);
      if (!response.ok) {
        throw new Error('Get song failed');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    searchMusic,
    loadPlaylist,
    getSong,
  };
}
