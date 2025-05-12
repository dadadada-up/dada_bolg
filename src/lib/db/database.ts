import path from 'path';
import fs from 'fs';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';

// 数据库文件路径
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'blog.db');

// 单例数据库实例
let dbInstance: Database | null = null;

/**
 * 获取数据库连接
 */
export async function getDatabase(): Promise<Database> {
  if (!dbInstance) {
    await initializeDatabase();
  }
  return dbInstance!;
}

/**
 * 初始化数据库连接
 */
export async function initializeDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  console.log(`[数据库] 初始化数据库连接: ${DB_PATH}`);

  // 确保数据目录存在
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  try {
    // 打开数据库连接
    dbInstance = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // 启用外键约束
    await dbInstance.exec('PRAGMA foreign_keys = ON');

    console.log('[数据库] 连接初始化成功');
    return dbInstance;
  } catch (error) {
    console.error('[数据库] 连接初始化失败:', error);
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
    console.log('[数据库] 连接已关闭');
  }
}

/**
 * 执行查询并返回所有结果
 * @param sql SQL查询语句
 * @param params 查询参数
 * @returns 查询结果数组
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const db = await getDatabase();
  try {
    console.log(`[数据库] 执行查询: ${sql}`, params);
    const result = await db.all<T>(sql, params);
    return result;
  } catch (error) {
    console.error(`[数据库] 查询失败: ${sql}`, params, error);
    throw error;
  }
}

/**
 * 执行查询并返回第一个结果
 * @param sql SQL查询语句
 * @param params 查询参数
 * @returns 查询结果或undefined
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const db = await getDatabase();
  try {
    console.log(`[数据库] 执行查询单条: ${sql}`, params);
    const result = await db.get<T>(sql, params);
    return result;
  } catch (error) {
    console.error(`[数据库] 查询单条失败: ${sql}`, params, error);
    throw error;
  }
}

/**
 * 执行更新操作
 * @param sql SQL更新语句
 * @param params 更新参数
 * @returns 受影响的行数
 */
export async function execute(sql: string, params?: any[]): Promise<number> {
  const db = await getDatabase();
  try {
    console.log(`[数据库] 执行更新: ${sql}`, params);
    const result = await db.run(sql, params);
    return result.changes || 0;
  } catch (error) {
    console.error(`[数据库] 更新失败: ${sql}`, params, error);
    throw error;
  }
}

/**
 * 开始一个事务
 */
export async function beginTransaction(): Promise<void> {
  const db = await getDatabase();
  await db.exec('BEGIN TRANSACTION');
}

/**
 * 提交一个事务
 */
export async function commitTransaction(): Promise<void> {
  const db = await getDatabase();
  await db.exec('COMMIT');
}

/**
 * 回滚一个事务
 */
export async function rollbackTransaction(): Promise<void> {
  const db = await getDatabase();
  await db.exec('ROLLBACK');
}

/**
 * 在事务中执行一个函数
 * @param fn 要在事务中执行的函数
 * @returns 函数的返回值
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
 * 获取当前时间的ISO格式字符串
 * @returns ISO格式的当前时间字符串
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
} 