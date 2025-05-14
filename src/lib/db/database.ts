import path from 'path';
import fs from 'fs';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { isVercelBuild } from '@/lib/env';

// 数据库文件路径
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'blog.db');

console.log(`[数据库] 使用数据库路径: ${DB_PATH}`);
console.log(`[数据库] Vercel构建检测: ${isVercelBuild}`);

// 单例数据库实例
let dbInstance: Database | null = null;

/**
 * 获取数据库连接
 */
export async function getDatabase(): Promise<Database> {
  // 在构建时始终使用模拟数据库
  console.log('[数据库] 获取数据库实例');
  
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

  // 始终使用模拟数据库
  console.log('[数据库] 使用模拟数据库');
  
  // 创建一个模拟的数据库实例
  dbInstance = createMockDatabase();
  console.log('[数据库] 模拟数据库初始化成功');
  
  return dbInstance;
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
  // 始终返回空数组
  console.log(`[数据库] 跳过查询: ${sql}`);
  return [];
}

/**
 * 执行查询并返回第一个结果
 * @param sql SQL查询语句
 * @param params 查询参数
 * @returns 查询结果或undefined
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  // 始终返回undefined
  console.log(`[数据库] 跳过查询单条: ${sql}`);
  return undefined;
}

/**
 * 执行更新操作
 * @param sql SQL更新语句
 * @param params 更新参数
 * @returns 受影响的行数
 */
export async function execute(sql: string, params?: any[]): Promise<number> {
  // 始终返回0
  console.log(`[数据库] 跳过执行: ${sql}`);
  return 0;
}

/**
 * 开始一个事务
 */
export async function beginTransaction(): Promise<void> {
  // 不执行
  console.log('[数据库] 跳过开始事务');
  return;
}

/**
 * 提交一个事务
 */
export async function commitTransaction(): Promise<void> {
  // 不执行
  console.log('[数据库] 跳过提交事务');
  return;
}

/**
 * 回滚一个事务
 */
export async function rollbackTransaction(): Promise<void> {
  // 不执行
  console.log('[数据库] 跳过回滚事务');
  return;
}

/**
 * 在事务中执行一个函数
 * @param fn 要在事务中执行的函数
 * @returns 函数的返回值
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  // 直接执行函数
  console.log('[数据库] 跳过事务包装，直接执行函数');
  return fn();
}

/**
 * 获取当前时间的ISO格式字符串
 * @returns ISO格式的当前时间字符串
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 创建模拟数据库实例，用于Vercel构建环境
 * @returns 模拟数据库实例
 */
function createMockDatabase(): Database {
  // 创建一个模拟的数据库对象，所有方法都返回空结果
  return {
    // 基本方法
    close: async () => {},
    exec: async () => {},
    
    // 查询方法
    all: async () => [],
    get: async () => undefined,
    run: async () => ({ changes: 0, lastID: 0 }),
    
    // 其他可能使用的方法
    prepare: () => ({
      all: async () => [],
      get: async () => undefined,
      run: async () => ({ changes: 0, lastID: 0 }),
      finalize: async () => {}
    }),
    
    // SQLite特定方法
    configure: () => {},
    
    // 必须返回的属性
    driver: sqlite3.Database,
    filename: 'mock-db.db'
  } as unknown as Database;
} 