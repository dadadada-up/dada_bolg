/**
 * 数据库访问层
 * 使用 Turso 数据库
 */

import { Database } from './types';
import { TursoDatabase } from './turso-adapter';

let db: Database | null = null;

/**
 * 获取数据库实例
 * 返回Turso数据库实例
 */
export async function getDatabase(): Promise<Database> {
  // 如果已经初始化，直接返回
  if (db !== null) {
    return db;
  }

  console.log('[数据库] 初始化Turso数据库');
    db = new TursoDatabase();
  return db;
}

/**
 * 初始化数据库连接
 * 兼容旧代码的函数，实际上调用getDatabase
 */
export async function initializeDatabase(): Promise<Database> {
  console.log('[数据库] 开始初始化数据库...');
  try {
    const database = await getDatabase();
    console.log('[数据库] 初始化成功');
    return database;
  } catch (error) {
    console.error('[数据库] 初始化失败:', error);
    throw error;
  }
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

/**
 * 执行查询并返回所有结果
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const db = await getDatabase();
  return db.all<T>(sql, params || []);
}

/**
 * 执行查询并返回第一个结果
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const db = await getDatabase();
  return db.get<T>(sql, params || []);
}

/**
 * 执行更新操作并返回受影响的行数
 */
export async function execute(sql: string, params?: any[]): Promise<number> {
  const db = await getDatabase();
  const result = await db.run(sql, params || []);
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