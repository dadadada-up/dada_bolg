/**
 * @type {import('next').NextConfig}
 */
import path from 'path';
import { fileURLToPath } from 'url';

// ES模块中获取 __dirname 的替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  output: process.env.NEXT_PUBLIC_OUTPUT || 'standalone',
  
  // 环境变量
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app',
    VERCEL: '1', // 确保在Vercel环境中被正确标记
    
    // 在Vercel环境中启用备用数据
    NEXT_PUBLIC_USE_FALLBACK_DATA: process.env.VERCEL === '1' ? 'true' : 'false',
    
    // 确保Turso配置被正确传递
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  async redirects() {
    return [];
  },
  
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/404.html',
        has: [
          {
            type: 'header',
            key: 'x-vercel-skip-404',
            value: 'true',
          },
        ],
      },
    ];
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  
  webpack: (config, { isServer }) => {
    // 针对Vercel环境的特殊处理
    if (!isServer) {
      // 客户端构建时不使用这些模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        sqlite3: false,
        sqlite: false,
        'better-sqlite3': false,
      };
    } else {
      // 服务端构建时，确保原生模块正确处理
      config.externals = [
        ...(config.externals || []),
        'sqlite3',
        'sqlite',
        'better-sqlite3',
        'sharp'
      ];
    }

    // 添加路径别名解析
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    return config;
  },
  
  // React严格模式
  reactStrictMode: true,
  
  // 优化构建
  swcMinify: true,
  
  // 增量静态再生成
  experimental: {
    // 启用增量静态再生成
    isrMemoryCacheSize: 50,
    // 启用服务器组件
    serverComponents: false,
  }
};

export default nextConfig; 