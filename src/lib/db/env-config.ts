/**
 * 数据库环境配置
 * 本地开发环境使用SQLite
 * Vercel环境使用Turso
 */

// 检查是否在 Vercel 环境中运行
export const isVercelEnv = process.env.VERCEL === '1';

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

// 记录当前环境配置
console.log(`[环境配置] Vercel环境: ${isVercelEnv}`);
console.log(`[环境配置] Turso配置: ${hasTursoConfig}`);
console.log(`[环境配置] 数据库类型: ${getDatabaseType()}`); 