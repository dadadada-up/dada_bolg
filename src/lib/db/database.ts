/**
 * 数据库访问层
 * 在 Vercel 环境中使用 Turso 云数据库或备用数据
 */

import { TursoDatabase } from './turso-adapter';
import { getDatabaseType, shouldUseFallback } from './env-config';
import * as fallbackData from '../fallback-data';

// 单例数据库实例
let dbInstance: GenericDatabase | null = null;

// 使用通用数据库类型
type GenericDatabase = {
  get<T = any>(sql: string, ...params: any[]): Promise<T | undefined>;
  all<T = any>(sql: string, ...params: any[]): Promise<T[]>;
  run(sql: string, ...params: any[]): Promise<{ lastID: number; changes: number }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
};

/**
 * 获取数据库连接
 */
export async function getDatabase(): Promise<GenericDatabase> {
  // 先检查本地实例
  if (dbInstance) {
    return dbInstance;
  }
  
  // 初始化新连接
  await initializeDatabase();
  return dbInstance!;
}

/**
 * 初始化数据库连接
 */
export async function initializeDatabase(): Promise<GenericDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  console.log('[数据库] 开始初始化数据库连接...');
  console.log(`[数据库] 环境变量: TURSO_DATABASE_URL=${!!process.env.TURSO_DATABASE_URL}, TURSO_AUTH_TOKEN=${!!process.env.TURSO_AUTH_TOKEN}`);
  console.log(`[数据库] 数据库类型: ${getDatabaseType()}`);
  console.log(`[数据库] 使用备用数据: ${shouldUseFallback()}`);

  try {
    // 检查是否应该使用备用数据
    if (shouldUseFallback()) {
      console.log('[数据库] 使用备用数据');
      
      // 创建一个模拟数据库实例
      dbInstance = createFallbackDatabase();
      console.log('[数据库] 备用数据库初始化成功');
      return dbInstance;
    }
    
    // 尝试初始化 Turso 数据库
    try {
      dbInstance = new TursoDatabase() as GenericDatabase;
      console.log('[数据库] Turso数据库初始化成功');
      return dbInstance;
    } catch (tursoError) {
      console.error('[数据库] Turso连接失败:', tursoError);
      
      // 如果 Turso 连接失败，回退到备用数据
      console.log('[数据库] 回退到备用数据');
      dbInstance = createFallbackDatabase();
      return dbInstance;
    }
  } catch (error) {
    console.error('[数据库] 数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 创建备用数据库实例
 */
function createFallbackDatabase(): GenericDatabase {
  return {
    async get<T>(sql: string, ...params: any[]): Promise<T | undefined> {
      console.log(`[备用数据库] get: ${sql}`);
      
      // 根据SQL查询返回相应的备用数据
      if (sql.includes('FROM posts') || sql.includes('from posts')) {
        if (sql.includes('WHERE slug =') || sql.includes('where slug =')) {
          // 尝试提取slug参数
          const slugParam = params[0] || '';
          const post = fallbackData.getFallbackPostBySlug(slugParam);
          return post as unknown as T;
        }
        return fallbackData.getAllFallbackPosts()[0] as unknown as T;
      }
      
      if (sql.includes('FROM categories') || sql.includes('from categories')) {
        return fallbackData.fallbackCategories[0] as unknown as T;
      }
      
      if (sql.includes('FROM tags') || sql.includes('from tags')) {
        return fallbackData.fallbackTags[0] as unknown as T;
      }
      
      return undefined;
    },
    
    async all<T>(sql: string, ...params: any[]): Promise<T[]> {
      console.log(`[备用数据库] all: ${sql}`);
      
      // 根据SQL查询返回相应的备用数据
      if (sql.includes('FROM posts') || sql.includes('from posts')) {
        const posts = fallbackData.getAllFallbackPosts();
        return posts as unknown as T[];
      }
      
      if (sql.includes('FROM categories') || sql.includes('from categories')) {
        return fallbackData.fallbackCategories as unknown as T[];
      }
      
      if (sql.includes('FROM tags') || sql.includes('from tags')) {
        return fallbackData.fallbackTags as unknown as T[];
      }
      
      return [] as T[];
    },
    
    async run(sql: string, ...params: any[]): Promise<{ lastID: number; changes: number }> {
      console.log(`[备用数据库] run: ${sql}`);
      // 模拟成功的操作
      return { lastID: 1, changes: 1 };
    },
    
    async exec(sql: string): Promise<void> {
      console.log(`[备用数据库] exec: ${sql}`);
      // 空操作
    },
    
    async close(): Promise<void> {
      console.log(`[备用数据库] close`);
      // 空操作
    }
  };
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

/**
 * 执行查询并返回所有结果
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const db = await getDatabase();
  return db.all<T>(sql, ...(params || []));
}

/**
 * 执行查询并返回第一个结果
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const db = await getDatabase();
  return db.get<T>(sql, ...(params || []));
}

/**
 * 执行更新操作并返回受影响的行数
 */
export async function execute(sql: string, params?: any[]): Promise<number> {
  const db = await getDatabase();
  const result = await db.run(sql, ...(params || []));
  return result.changes;
}

/**
 * 开始事务
 */
export async function beginTransaction(): Promise<void> {
  await execute('BEGIN TRANSACTION');
}

/**
 * 提交事务
 */
export async function commitTransaction(): Promise<void> {
  await execute('COMMIT');
}

/**
 * 回滚事务
 */
export async function rollbackTransaction(): Promise<void> {
  await execute('ROLLBACK');
}

/**
 * 在事务中执行操作
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  await beginTransaction();
  try {
    const result = await fn();
    await commitTransaction();
    return result;
  } catch (error) {
    await rollbackTransaction();
    throw error;
  }
}

/**
 * 获取当前时间戳
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
} 