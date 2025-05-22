/**
 * 数据库访问层
 * 在 Vercel 环境中使用 Turso 云数据库
 * 在本地环境中使用 SQLite 数据库
 */

import { TursoDatabase } from './turso-adapter';
import { SQLiteDatabase } from './sqlite-adapter';
import { getDatabaseType, isVercelEnv } from './env-config';

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
  console.log(`[数据库] Vercel环境: ${isVercelEnv}`);

  try {
    // 根据环境选择数据库
    if (isVercelEnv) {
      // Vercel环境使用Turso
      dbInstance = new TursoDatabase() as GenericDatabase;
      console.log('[数据库] Turso数据库初始化成功');
    } else {
      // 本地环境使用SQLite
      dbInstance = new SQLiteDatabase() as GenericDatabase;
      console.log('[数据库] SQLite数据库初始化成功');
    }
    
    return dbInstance;
  } catch (error) {
    console.error('[数据库] 数据库初始化失败:', error);
    throw error;
  }
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