/**
 * 数据库环境配置
 * 本地开发环境使用SQLite
 * Vercel环境使用Turso
 */

// 检查是否在 Vercel 环境中运行
export const isVercelEnv = process.env.VERCEL === '1';

// 检查是否在构建时
export const isBuildTime = process.env.NODE_ENV === 'production' && typeof window === 'undefined';

// 检查是否在Vercel构建时
export const isVercelBuild = isVercelEnv && isBuildTime;

// 检查是否有 Turso 配置
export const hasTursoConfig = !!(
  process.env.TURSO_DATABASE_URL && 
  process.env.TURSO_AUTH_TOKEN && 
  process.env.TURSO_DATABASE_URL.length > 0 && 
  process.env.TURSO_AUTH_TOKEN.length > 0
);

// 数据库类型
export type DatabaseType = 'turso' | 'sqlite';

/**
 * 获取当前环境应该使用的数据库类型
 */
export function getDatabaseType(): DatabaseType {
  // Vercel环境使用Turso
  if (isVercelEnv) {
    return 'turso';
  }
  // 本地开发环境使用SQLite
  return 'sqlite';
}

/**
 * 获取数据库 URL
 */
export function getDatabaseUrl(): string | null {
  return process.env.TURSO_DATABASE_URL || null;
}

/**
 * 获取数据库认证令牌
 */
export function getDatabaseAuthToken(): string | null {
  return process.env.TURSO_AUTH_TOKEN || null;
}

/**
 * 获取API基础URL
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
}

// 记录环境变量状态
console.log(`[环境] 环境变量状态:`, {
  VERCEL: process.env.VERCEL,
  IS_VERCEL: process.env.IS_VERCEL,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_ENV: process.env.VERCEL_ENV
});

// 记录当前环境配置
console.log(`[环境] isVercel检测结果: ${isVercelEnv}`);
console.log(`[环境] isBuildTime检测结果: ${isBuildTime}`);
console.log(`[环境] isVercelBuild检测结果: ${isVercelBuild}`);
console.log(`[环境配置] Vercel环境: ${isVercelEnv}`);
console.log(`[环境配置] Turso配置: ${hasTursoConfig}`);
console.log(`[环境配置] 数据库类型: ${getDatabaseType()}`); 