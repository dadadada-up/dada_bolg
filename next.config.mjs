/**
 * @type {import('next').NextConfig}
 */
import path from 'path';
import { fileURLToPath } from 'url';

// ES模块中获取 __dirname 的替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确定基本URL
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app';

const nextConfig = {
  output: process.env.NEXT_PUBLIC_OUTPUT || 'standalone',
  
  // 环境变量
  env: {
    NEXT_PUBLIC_SITE_URL: baseUrl,
    VERCEL: process.env.VERCEL === '1' ? '1' : '0', // 确保环境变量正确传递
    
    // 确保Turso配置被正确传递
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    
    // API基础URL
    NEXT_PUBLIC_API_BASE_URL: baseUrl
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

  experimental: {
    // 将所有SQLite相关包标记为外部包，避免构建问题
    serverComponentsExternalPackages: [
      'sqlite', 
      'sqlite3', 
      '@libsql/client',
      'better-sqlite3'
    ],
    
    // 防止静态生成动态API路由
    outputFileTracingExcludes: {
      '/api/**/*': ['**/*']
    }
  }
};

export default nextConfig; 