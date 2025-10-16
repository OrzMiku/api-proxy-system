import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 启用严格模式
  reactStrictMode: true,

  // 配置输出
  output: 'standalone',

  // 实验性功能
  experimental: {
    // 启用 Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // 图片优化
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
