import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { dbSchema } from './models/index';

// 重新导出Database类型，用于其他文件导入
export type { Database };

// 数据库文件路径
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'blog.db');

// 日志当前使用的数据库路径
console.log(`[数据库] 使用数据库路径: ${DB_PATH}`);

// 确保数据目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 数据库连接实例
let dbInstance: Database | null = null;

/**
 * 获取数据库连接
 */
export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    await initializeDatabase();
  }
  return dbInstance!;
}

/**
 * 初始化数据库
 */
export default async function initializeDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  console.log(`[数据库] 初始化数据库: ${DB_PATH}`);

  try {
    // 打开数据库连接
    dbInstance = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    // 启用外键约束
    await dbInstance.exec('PRAGMA foreign_keys = ON');

    // 执行数据库初始化脚本
    await dbInstance.exec(dbSchema);

    console.log('[数据库] 初始化成功');
    return dbInstance;
  } catch (error) {
    console.error('[数据库] 初始化失败:', error);
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
 * 获取当前时间戳，用于created_at和updated_at字段
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 检查数据库连接状态
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const db = await getDb();
    await db.get('SELECT 1');
    return true;
  } catch (error) {
    console.error('[数据库] 连接检查失败:', error);
    return false;
  }
} 