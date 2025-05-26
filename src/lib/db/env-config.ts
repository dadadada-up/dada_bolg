/**
 * 数据库环境配置
 * 使用Turso数据库
 */

// 检查是否在 Vercel 环境中运行
export const isVercelEnv = process.env.VERCEL === '1';

// 检查是否在构建时
export const isBuildTime = process.env.NODE_ENV === 'production' && typeof window === 'undefined';

// 检查是否在Vercel构建时
export const isVercelBuild = isVercelEnv && isBuildTime;

// 检查是否有 Turso 配置
export const hasTursoConfig = !!(
  process.env.DATABASE_URL && 
  process.env.TURSO_AUTH_TOKEN && 
  process.env.DATABASE_URL.length > 0 && 
  process.env.TURSO_AUTH_TOKEN.length > 0
);

/**
 * 获取数据库 URL
 */
export function getDatabaseUrl(): string {
  // 优先使用通用DATABASE_URL配置
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  
  if (!url) {
    throw new Error('数据库URL未配置，请设置DATABASE_URL环境变量');
  }
  
  return url;
}

/**
 * 获取数据库认证令牌
 */
export function getDatabaseAuthToken(): string {
  const token = process.env.TURSO_AUTH_TOKEN;
  
  if (!token) {
    throw new Error('数据库认证令牌未配置，请设置TURSO_AUTH_TOKEN环境变量');
  }
  
  return token;
}

/**
 * 获取API基础URL
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
}

// 记录环境变量状态
console.log(`[环境] 环境变量状态:`, {
  DATABASE_URL: process.env.DATABASE_URL,
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  VERCEL: process.env.VERCEL,
  NODE_ENV: process.env.NODE_ENV
});

// 记录当前环境配置
console.log(`[环境配置] 数据库URL: ${getDatabaseUrl()}`);
console.log(`[环境] isVercel检测结果: ${isVercelEnv}`);
console.log(`[环境] isBuildTime检测结果: ${isBuildTime}`);
console.log(`[环境] isVercelBuild检测结果: ${isVercelBuild}`);
console.log(`[环境配置] Vercel环境: ${isVercelEnv}`);
console.log(`[环境配置] Turso配置: ${hasTursoConfig}`);