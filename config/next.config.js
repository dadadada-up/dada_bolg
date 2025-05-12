/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // 配置环境变量，使其在客户端可用
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
  },
  
  // 设置服务器配置
  serverRuntimeConfig: {
    // 服务器端环境变量
  },
  
  // 设置客户端配置
  publicRuntimeConfig: {
    // 客户端环境变量
  },
  
  // 实验性功能开启
  experimental: {
    // appDir: true,
    // serverActions: true,
  },
  
  // 图片域名
  images: {
    domains: ['localhost'],
  },
  
  // 优化字体加载
  optimizeFonts: false,
  
  // 设置头部安全策略
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // 添加webpack配置
  webpack: (config, { isServer }) => {
    // 在客户端构建中，为Node.js原生模块提供空模拟
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
}

export default nextConfig 