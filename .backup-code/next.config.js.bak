/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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

    return config;
  },
}

module.exports = nextConfig; 