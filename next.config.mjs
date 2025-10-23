let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  // Cloudflare Pages optimization - comprehensive
  webpack: (config, { isServer, dev }) => {
    // Apply optimizations for both client and server builds
    if (!dev) {
      // Optimize for production builds
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          minSize: 20000,
          maxSize: 200000, // 200KB limit per chunk
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
              maxSize: 200000,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
              maxSize: 200000,
            },
          },
        },
        // Enable tree shaking and dead code elimination
        usedExports: true,
        sideEffects: false,
      }

      // Additional optimizations for server builds
      if (isServer) {
        // Reduce server bundle size by excluding unnecessary modules
        config.externals = config.externals || []
        config.externals.push({
          'sharp': 'commonjs sharp',
          'canvas': 'commonjs canvas',
        })

        // Optimize server-side chunks
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          chunks: 'all',
          minSize: 10000,
          maxSize: 100000, // Smaller chunks for server
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            server: {
              test: /[\\/]node_modules[\\/]/,
              name: 'server-vendor',
              priority: 10,
              chunks: 'all',
              maxSize: 100000,
            },
          },
        }
      }
    }
    
    return config
  },
  // Enable compression and other optimizations
  compress: true,
  poweredByHeader: false,
  // Docker 部署：生成 standalone 输出
  // 注意：Windows 上构建需要管理员权限或在 WSL/Docker 中构建
  // output: 'standalone',
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
