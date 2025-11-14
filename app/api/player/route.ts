import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('url');

  if (!source) {
    return new NextResponse('M3U8 URL is required', { status: 400 });
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>M3U8 Player</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <style>
      body {
        margin: 0;
        background: #000;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont;
      }
      #videoPlayer {
        width: 100vw;
        height: 100vh;
        background: #000;
      }
      #errorMessage {
        position: fixed;
        bottom: 16px;
        width: 100%;
        text-align: center;
        color: #f87171;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <video id="videoPlayer" controls autoplay playsinline></video>
    <div id="errorMessage"></div>
    <script>
      const video = document.getElementById('videoPlayer');
      const errorMessage = document.getElementById('errorMessage');
      const m3u8Url = ${JSON.stringify(source)};

      const showError = (message) => {
        errorMessage.textContent = message;
      };

      const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

      if (isIOS()) {
        video.src = m3u8Url;
        video.addEventListener('error', () => showError('视频加载失败，请检查 URL 是否正确'));
      } else if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(m3u8Url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => showError('需要用户交互才能播放'));
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            showError('视频加载失败，请检查 URL 是否正确');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = m3u8Url;
        video.addEventListener('error', () => showError('视频加载失败，请检查 URL 是否正确'));
      } else {
        showError('当前浏览器不支持 HLS 播放');
      }
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
