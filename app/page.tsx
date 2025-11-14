import HlsPlayer from '@/components/HlsPlayer';
import MusicPlayer from '@/components/MusicPlayer';

const features = [
  '支持网易云 / QQ / 百度等多平台',
  '统一 `/api/music` 返回链接、封面与歌词',
  '提供 `/api/player` 便于单独分享播放页',
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-[0.6em] text-blue-300">M3U8 MUSIC STACK</p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            一个以 Next.js 为核心的 M3U8 播放与音乐解析中台
          </h1>
          <p className="text-lg text-slate-300">
            `/api/music` 负责解析和缓存多平台音频，`/api/files` / `/api/forward` 负责代理文件和网页，前端以 Hls.js 与
            APlayer 做调试面板。任何 React / Vercel / Docker 环境都能直接使用。
          </p>

          <ul className="grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
            {features.map((item) => (
              <li key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-10 lg:grid-cols-2">
          <HlsPlayer />
          <MusicPlayer />
        </div>
      </div>
    </main>
  );
}
