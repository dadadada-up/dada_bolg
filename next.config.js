/** @type {import('next').NextConfig} */
const nextConfig = {
  // 在生产环境中启用静态导出（用于 Vercel 部署）
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
  
  // 禁用图像优化服务，使用静态导出
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
  },
  
  // 配置重写和重定向
  rewrites: async () => {
    return [];
  },
  
  // 其他设置...
  reactStrictMode: true,
};

module.exports = nextConfig; 