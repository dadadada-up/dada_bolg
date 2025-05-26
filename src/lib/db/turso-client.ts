/**
 * Turso数据库客户端
 * 此文件负责与Turso数据库建立连接
 */

import { createClient as createTursoClient } from '@libsql/client';
import { getDatabaseUrl, getDatabaseAuthToken } from './env-config';

// 导出现有接口供兼容性
export interface TursoClient {
  execute(options: { sql: string; args?: any[] }): Promise<{ rows: any[] }>;
  batch(statements: { sql: string; args?: any[] }[]): Promise<{ rows: any[] }[]>;
  sync(): Promise<void>;
}

export interface TursoClientConfig {
  url: string;
  authToken?: string;
  syncUrl?: string;
}

/**
 * 检测Turso是否启用
 * @returns 如果已配置Turso数据库返回true，否则返回false
 */
export function isTursoEnabled(): boolean {
  const enabled = !!process.env.DATABASE_URL && !!process.env.TURSO_AUTH_TOKEN;
  console.log(`[Turso] 是否启用: ${enabled}`);
  console.log(`[Turso] 数据库URL: ${process.env.DATABASE_URL ? '已设置' : '未设置'}`);
  console.log(`[Turso] 认证令牌: ${process.env.TURSO_AUTH_TOKEN ? '已设置' : '未设置'}`);
  return enabled;
}

/**
 * 创建Turso客户端实例
 * @param url 数据库URL
 * @param authToken 认证令牌
 * @returns Turso客户端
 */
export function createTursoClientInstance(url: string, authToken: string) {
  if (!url || url.trim() === '') {
    throw new Error('Turso URL 未配置');
  }
  
  if (!authToken || authToken.trim() === '') {
    throw new Error('Turso 认证令牌未配置');
  }
  
  try {
    return createTursoClient({
      url,
      authToken
    });
  } catch (error) {
    console.error('[Turso] 创建客户端失败:', error);
    throw error;
  }
}

// 创建默认客户端实例
const tursoClient = isTursoEnabled() 
  ? createTursoClientInstance(getDatabaseUrl(), getDatabaseAuthToken())
  : null;

// 记录数据库连接信息（仅开发环境）
if (isTursoEnabled() && process.env.NODE_ENV !== 'production') {
  console.log(`[数据库] 使用Turso数据库: ${getDatabaseUrl()}`);
} else if (process.env.NODE_ENV !== 'production') {
  console.log('[数据库] Turso配置不完整，请检查环境变量');
}

// 导出默认客户端
export default tursoClient;

// 导出工具函数，保持向后兼容
export function useTurso(): boolean {
  return isTursoEnabled();
} 