import path from 'path';
import fs from 'fs';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { isVercelBuild } from '@/lib/env';
import { useTurso } from './turso-client';
import { TursoDatabase } from './turso-adapter';

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
  if (isVercelBuild) {
    console.log('[数据库] Vercel构建环境，使用模拟数据库');
    return createMockDatabase();
  }
  
  if (!dbInstance) {
    await initializeDatabase();
  }
  return dbInstance!;
}

/**
 * 初始化数据库连接
 */
export async function initializeDatabase(): Promise<Database> {
  // 在Vercel构建环境中始终返回模拟数据库
  if (isVercelBuild) {
    console.log('[数据库] Vercel构建环境，跳过真实数据库初始化');
    dbInstance = createMockDatabase();
    return dbInstance;
  }
  
  if (dbInstance) {
    return dbInstance;
  }

  try {
    if (useTurso) {
      // 使用Turso数据库
      console.log('[数据库] 初始化Turso数据库连接');
      dbInstance = new TursoDatabase();
      console.log('[数据库] Turso数据库初始化成功');
    } else {
      // 使用本地SQLite数据库
      console.log(`[数据库] 初始化本地SQLite数据库: ${DB_PATH}`);
      
      // 确保数据目录存在
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // 打开数据库连接
      dbInstance = await open({
        filename: DB_PATH,
        driver: sqlite3.Database,
      });
      
      // 启用外键约束
      await dbInstance.exec('PRAGMA foreign_keys = ON');
      
      console.log('[数据库] SQLite数据库初始化成功');
    }
    
    return dbInstance;
  } catch (error) {
    console.error('[数据库] 初始化失败:', error);
    // 在出错时使用模拟数据库，确保不会阻塞构建
    console.log('[数据库] 错误后使用模拟数据库');
    dbInstance = createMockDatabase();
    return dbInstance;
  }
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    if (!useTurso && !isVercelBuild) {
      await dbInstance.close();
    }
    dbInstance = null;
    console.log('[数据库] 连接已关闭');
  }
}

/**
 * 检查数据库连接状态
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  // 在Vercel构建环境中始终返回true
  if (isVercelBuild) {
    console.log('[数据库] Vercel构建环境，跳过连接检查');
    return true;
  }
  
  try {
    const db = await getDatabase();
    await db.get('SELECT 1');
    return true;
  } catch (error) {
    console.error('[数据库] 连接检查失败:', error);
    return false;
  }
}

/**
 * 执行查询并返回所有结果
 * @param sql SQL查询语句
 * @param params 查询参数
 * @returns 查询结果数组
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  // 在Vercel构建环境中始终返回空数组
  if (isVercelBuild) {
    console.log(`[数据库] Vercel构建环境，跳过查询: ${sql.substring(0, 50)}...`);
    return [];
  }
  
  try {
    const db = await getDatabase();
    return await db.all(sql, params);
  } catch (error) {
    console.error('[数据库] 查询失败:', error);
    return [];
  }
}

/**
 * 执行查询并返回第一个结果
 * @param sql SQL查询语句
 * @param params 查询参数
 * @returns 查询结果或undefined
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  // 在Vercel构建环境中始终返回undefined
  if (isVercelBuild) {
    console.log(`[数据库] Vercel构建环境，跳过查询单条: ${sql.substring(0, 50)}...`);
    return undefined;
  }
  
  try {
    const db = await getDatabase();
    return db.get<T>(sql, params);
  } catch (error) {
    console.error('[数据库] 查询单条失败:', error);
    return undefined;
  }
}

/**
 * 执行更新操作
 * @param sql SQL更新语句
 * @param params 更新参数
 * @returns 受影响的行数
 */
export async function execute(sql: string, params?: any[]): Promise<number> {
  // 在Vercel构建环境中始终返回0
  if (isVercelBuild) {
    console.log(`[数据库] Vercel构建环境，跳过执行: ${sql.substring(0, 50)}...`);
    return 0;
  }
  
  try {
    const db = await getDatabase();
    const result = await db.run(sql, params);
    return result.changes || 0;
  } catch (error) {
    console.error('[数据库] 执行失败:', error);
    return 0;
  }
}

/**
 * 开始一个事务
 */
export async function beginTransaction(): Promise<void> {
  // 在Vercel构建环境中不执行
  if (isVercelBuild) {
    console.log('[数据库] Vercel构建环境，跳过开始事务');
    return;
  }
  
  const db = await getDatabase();
  await db.run('BEGIN TRANSACTION');
}

/**
 * 提交一个事务
 */
export async function commitTransaction(): Promise<void> {
  // 在Vercel构建环境中不执行
  if (isVercelBuild) {
    console.log('[数据库] Vercel构建环境，跳过提交事务');
    return;
  }
  
  const db = await getDatabase();
  await db.run('COMMIT');
}

/**
 * 回滚一个事务
 */
export async function rollbackTransaction(): Promise<void> {
  // 在Vercel构建环境中不执行
  if (isVercelBuild) {
    console.log('[数据库] Vercel构建环境，跳过回滚事务');
    return;
  }
  
  const db = await getDatabase();
  await db.run('ROLLBACK');
}

/**
 * 在事务中执行一个函数
 * @param fn 要在事务中执行的函数
 * @returns 函数的返回值
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  // 在Vercel构建环境中直接执行函数
  if (isVercelBuild) {
    console.log('[数据库] Vercel构建环境，跳过事务包装，直接执行函数');
    return fn();
  }
  
  try {
    await beginTransaction();
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

/**
 * 创建一个模拟的数据库实例（用于Vercel构建过程）
 */
function createMockDatabase(): Database {
  console.log('[数据库] 创建模拟数据库实例');
  
  const mockDb: Partial<Database> = {
    async exec(sql: string): Promise<void> {
      console.log('[模拟数据库] 执行SQL:', sql.substring(0, 50));
      return Promise.resolve();
    },
    
    async get<T>(): Promise<any> {
      console.log('[模拟数据库] 获取数据');
      return Promise.resolve(undefined);
    },
    
    async all<T>(): Promise<any[]> {
      console.log('[模拟数据库] 获取所有数据');
      return Promise.resolve([]);
    },
    
    async run(sql: string): Promise<sqlite3.RunResult> {
      console.log('[模拟数据库] 运行SQL:', sql.substring(0, 50));
      return Promise.resolve({ lastID: 0, changes: 0 } as sqlite3.RunResult);
    },
    
    async close(): Promise<void> {
      console.log('[模拟数据库] 关闭连接');
      return Promise.resolve();
    }
  };
  
  return mockDb as Database;
} 