export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100">
      <div className="flex items-center justify-center flex-grow">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-4">M3U8 播放器</h1>
          <form action="/api/player" method="get" className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                M3U8 URL
              </label>
              <input
                type="url"
                id="url"
                name="url"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/video.m3u8"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              播放视频
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center p-4 bg-gray-200 text-sm">
{/*         <a
          target="_blank"
          href="http://www.freecdn.vip/?zzwz"
          rel="noopener noreferrer"
          title="免费云加速（FreeCDN），为您免费提供网站加速和网站防御（DDOS、CC攻击）"
          alt="免费云加速（FreeCDN），为您免费提供网站加速和网站防御（DDOS、CC攻击）"
        >
          本站由免费云加速（FreeCDN）提供网站加速和攻击防御服务
        </a> */}
      </footer>
    </div>
  )
}

