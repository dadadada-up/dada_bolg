/**
 * Turso数据库客户端 (新版本)
 * 此文件负责与Turso数据库建立连接
 */

import { createClient as createTursoClient, Client } from '@libsql/client';
import { getDatabaseType, getDatabaseUrl, getDatabaseAuthToken } from './env-config';

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
  const dbType = getDatabaseType();
  const url = getDatabaseUrl();
  const token = getDatabaseAuthToken();
  const isEnabled = dbType === 'turso' && !!url && !!token && url.length > 0 && token.length > 0;
  
  console.log(`[Turso] 是否启用: ${isEnabled}`);
  console.log(`[Turso] 数据库URL: ${url ? '已设置' : '未设置'}`);
  console.log(`[Turso] 认证令牌: ${token ? '已设置' : '未设置'}`);
  
  return isEnabled;
}

/**
 * 创建Turso客户端实例
 * @param config 配置参数
 * @returns Turso客户端实例
 */
export function createClient(config: TursoClientConfig): TursoClient {
  console.log(`[Turso] 初始化客户端，URL: ${config.url}`);
  console.log(`[Turso] 认证令牌是否存在: ${!!config.authToken}`);
  console.log(`[Turso] 同步URL是否存在: ${!!config.syncUrl}`);
  
  try {
    // 检查配置是否有效
    if (!config.url || config.url.trim() === '') {
      throw new Error('Turso URL 未配置');
    }
    
    if (!config.authToken || config.authToken.trim() === '') {
      throw new Error('Turso 认证令牌未配置');
    }
    
    // 使用真实的@libsql/client
    const client: Client = createTursoClient({
      url: config.url,
      authToken: config.authToken,
      syncUrl: config.syncUrl,
    });

    // 包装接口
    return {
      async execute({ sql, args = [] }) {
        console.log(`[Turso] 执行SQL: ${sql}`);
        if (args.length > 0) {
          console.log(`[Turso] 参数: ${JSON.stringify(args)}`);
        }
        try {
          return await client.execute({ sql, args });
        } catch (error) {
          console.error(`[Turso] SQL执行错误:`, error);
          throw error;
        }
      },
      
      async batch(statements) {
        console.log(`[Turso] 批量执行 ${statements.length} 条语句`);
        // 确保每个语句都有args属性
        const formattedStatements = statements.map(stmt => ({
          sql: stmt.sql,
          args: stmt.args || []
        }));
        try {
          return await client.batch(formattedStatements);
        } catch (error) {
          console.error(`[Turso] 批量执行错误:`, error);
          throw error;
        }
      },
      
      async sync() {
        console.log('[Turso] 同步数据');
        try {
          // 执行同步但忽略返回值，因为我们的接口定义为返回void
          await client.sync();
          return;
        } catch (error) {
          console.error(`[Turso] 同步错误:`, error);
          throw error;
        }
      }
    };
  } catch (error) {
    console.error('[Turso] 客户端初始化失败:', error);
    throw error;
  }
}

// 检查环境变量并创建默认客户端实例
const isEnabled = isTursoEnabled();
let tursoClient = null;

// 只有在确认启用Turso时才创建客户端
if (isEnabled) {
  try {
    tursoClient = createClient({
      url: getDatabaseUrl() || '',
      authToken: getDatabaseAuthToken() || '',
      syncUrl: process.env.NODE_ENV === 'production' 
        ? getDatabaseUrl() 
        : undefined,
    });
    
    // 记录数据库连接信息（仅开发环境）
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[数据库] 使用Turso数据库: ${getDatabaseUrl()}`);
    }
  } catch (error) {
    console.error('[Turso] 创建客户端失败，将使用备用数据:', error);
    tursoClient = null;
  }
} else if (process.env.NODE_ENV !== 'production') {
  console.log('[数据库] 未配置Turso或配置无效，将使用备用数据');
}

// 导出默认客户端
export default tursoClient; 