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
    </head>
    <body>
      <video id="videoPlayer" controls autoplay width="640" height="360"></video>
      <script>
        const video = document.getElementById('videoPlayer');
        const m3u8Url = '${m3u8Url}';
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(m3u8Url);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = m3u8Url;
        } else {
          alert('This browser does not support HLS playback.');
        }
      </script>
    </body>
    </html>
  `

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  })
}

