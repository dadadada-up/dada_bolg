/**
 * Turso数据库客户端
 * 此文件负责与Turso数据库建立连接
 */

import { createClient as createTursoClient, Client } from '@libsql/client';

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
 * 创建Turso客户端实例
 * @param config 配置参数
 * @returns Turso客户端实例
 */
export function createClient(config: TursoClientConfig): TursoClient {
  console.log(`[Turso] 初始化客户端，URL: ${config.url}`);
  console.log(`[Turso] 认证令牌是否存在: ${!!config.authToken}`);
  console.log(`[Turso] 同步URL是否存在: ${!!config.syncUrl}`);
  
  try {
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
          return await client.sync();
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

// 环境检测功能
const isTursoEnabled = (): boolean => {
  const enabled = !!process.env.TURSO_DATABASE_URL && !!process.env.TURSO_AUTH_TOKEN;
  console.log(`[Turso] 是否启用: ${enabled}`);
  console.log(`[Turso] 数据库URL: ${process.env.TURSO_DATABASE_URL ? '已设置' : '未设置'}`);
  console.log(`[Turso] 认证令牌: ${process.env.TURSO_AUTH_TOKEN ? '已设置' : '未设置'}`);
  return enabled;
};

// 创建默认客户端实例
const tursoClient = isTursoEnabled() 
  ? createClient({
      url: process.env.TURSO_DATABASE_URL || '',
      authToken: process.env.TURSO_AUTH_TOKEN,
      syncUrl: process.env.NODE_ENV === 'production' 
        ? process.env.TURSO_DATABASE_URL 
        : undefined,
    })
  : null;

// 记录数据库连接信息（仅开发环境）
if (isTursoEnabled() && process.env.NODE_ENV !== 'production') {
  console.log(`[数据库] 使用Turso数据库: ${process.env.TURSO_DATABASE_URL}`);
} else if (process.env.NODE_ENV !== 'production') {
  console.log('[数据库] 未配置Turso，将使用本地SQLite数据库');
}

// 导出默认客户端
export default tursoClient;

// 导出工具函数
export const useTurso = isTursoEnabled(); 