/**
 * 数据库环境配置
 * 根据环境决定使用哪种数据库
 */

// 检查是否在 Vercel 环境中运行
export const isVercelEnv = process.env.VERCEL === '1';

// 检查是否有 Turso 配置
export const hasTursoConfig = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

// 检查是否应该使用备用数据
export const shouldUseFallbackData = process.env.NEXT_PUBLIC_USE_FALLBACK_DATA === 'true';

// 数据库类型
export type DatabaseType = 'turso' | 'fallback';

/**
 * 获取当前环境应该使用的数据库类型
 */
export function getDatabaseType(): DatabaseType {
  // 在 Vercel 环境中始终使用 Turso 或备用数据
  if (isVercelEnv) {
    return hasTursoConfig ? 'turso' : 'fallback';
  }

  // 在开发环境中，如果配置了 Turso 则使用 Turso
  if (hasTursoConfig) {
    return 'turso';
  }

  // 默认使用备用数据
  return 'fallback';
}

/**
 * 检查是否应该使用备用数据
 * 当明确设置了使用备用数据或者没有数据库配置时返回 true
 */
export function shouldUseFallback(): boolean {
  return shouldUseFallbackData || !hasTursoConfig;
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
console.log(`[环境配置] 使用备用数据: ${shouldUseFallbackData}`);
console.log(`[环境配置] 数据库类型: ${getDatabaseType()}`); 