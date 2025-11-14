'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer() {
  const [input, setInput] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('输入 M3U8 地址开始播放');
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!source || !videoRef.current) return;

    const video = videoRef.current;
    const destroy = () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };

    const mountPlayer = () => {
      setError(null);
      setStatus('正在加载流媒体…');

      if (Hls.isSupported()) {
        const instance = new Hls();
        hlsRef.current = instance;
        instance.loadSource(source);
        instance.attachMedia(video);
        instance.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus('播放中');
          video.play().catch(() => setStatus('等待用户交互以播放'));
        });
        instance.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setError('视频加载失败，请确认 URL 是否有效');
            setStatus('播放失败');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', () => {
          setStatus('播放中');
          video.play().catch(() => setStatus('等待用户交互以播放'));
        });
      } else {
        setError('当前浏览器不支持 HLS 播放');
        setStatus('浏览器不支持');
      }
    };

    destroy();
    mountPlayer();

    return destroy;
  }, [source]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    setSource(input.trim());
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-black/25 backdrop-blur">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.5em] text-emerald-300">M3U8 Live Player</p>
        <h2 className="text-2xl font-semibold text-white">输入地址，即刻播放</h2>
        <p className="text-sm text-slate-300">
          页面内集成 Hls.js，方便开发阶段直接验证 M3U8 播放链接，无需跳转至 `/api/player`。
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <label htmlFor="m3u8-url" className="text-sm font-semibold text-slate-200">
          M3U8 URL
        </label>
        <div className="flex gap-3">
          <input
            id="m3u8-url"
            type="url"
            required
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://example.com/live/stream.m3u8"
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            开始播放
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video ref={videoRef} controls playsInline className="h-full w-full bg-black object-contain" />
        </div>
        <p className="text-sm text-slate-200">{status}</p>
        {error && <p className="text-sm text-red-300">{error}</p>}
      </div>
    </section>
  );
}
