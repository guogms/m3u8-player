import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const m3u8Url = searchParams.get("url")

  if (!m3u8Url) {
    return new Response("M3U8 URL is required", { status: 400 })
  }

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>M3U8 Player</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #000;
    }

    #videoPlayer {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
    }

    #errorMessage {
      color: red;
      text-align: center;
      position: absolute;
      bottom: 10px;
      width: 100%;
    }
  </style>
</head>
<body>
  <video id="videoPlayer" controls autoplay></video>
  <div id="errorMessage"></div>
  <script>
    const video = document.getElementById('videoPlayer');
    const errorMessage = document.getElementById('errorMessage');
    const m3u8Url = '${m3u8Url}';
    
    function showError(message) {
      errorMessage.textContent = message;
    }

    function isIOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    if (isIOS()) {
      video.src = m3u8Url;
      video.addEventListener('error', () => {
        showError('视频加载失败，请检查URL是否正确。');
      });
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(m3u8Url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          showError('视频加载失败，请检查URL是否正确。');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = m3u8Url;
      video.addEventListener('error', () => {
        showError('视频加载失败，请检查URL是否正确。');
      });
    } else {
      showError('您的浏览器不支持HLS播放。');
    }
  </script>
</body>
</html>

  `

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  })
}

