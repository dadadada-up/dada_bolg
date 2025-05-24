/**
 * Turso数据库客户端 (新版本)
 * 此文件负责与Turso数据库建立连接
 */

import { createClient as createTursoClient } from '@libsql/client';
import { getDatabaseType, getDatabaseUrl, getDatabaseAuthToken } from './env-config';

/**
 * 检测Turso是否启用
 * @returns 如果已配置Turso数据库返回true，否则返回false
 */
export function isTursoEnabled(): boolean {
  const dbType = getDatabaseType();
  const url = getDatabaseUrl();
  const token = getDatabaseAuthToken();
  return dbType === 'turso' && !!url && !!token && url.length > 0 && token.length > 0;
}

/**
 * 创建Turso客户端实例
 * @param config 配置参数
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