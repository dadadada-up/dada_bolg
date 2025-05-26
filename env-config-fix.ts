/**
 * 数据库环境配置
 * 本地开发环境根据配置使用SQLite或Turso
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
  // 首先检查环境变量是否明确指定了数据库类型
  if (process.env.DATABASE_TYPE === 'turso') {
    console.log('[环境配置] 环境变量指定使用Turso数据库');
    return 'turso';
  }

  // 其次检查是否在Vercel环境
  if (isVercelEnv) {
    console.log('[环境配置] Vercel环境使用Turso数据库');
    return 'turso';
  }

  // 最后，默认使用SQLite
  console.log('[环境配置] 默认使用SQLite数据库');
  return 'sqlite';
}

/**
 * 获取数据库 URL
 */
export function getDatabaseUrl(): string | null {
  // 优先使用通用DATABASE_URL配置
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // 其次使用Turso特定配置
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
  DATABASE_TYPE: process.env.DATABASE_TYPE,
  DATABASE_URL: process.env.DATABASE_URL,
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  VERCEL: process.env.VERCEL,
  NODE_ENV: process.env.NODE_ENV
});

// 记录当前环境配置
console.log(`[环境配置] 数据库类型: ${getDatabaseType()}`);
console.log(`[环境配置] 数据库URL: ${getDatabaseUrl()}`); 