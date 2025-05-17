/**
 * 数据库访问层
 * 根据环境自动选择使用Turso云数据库或本地SQLite
 */

import path from 'path';
import fs from 'fs';
import { Database } from 'sqlite';
import { TursoDatabase } from './turso-adapter';
import { isTursoEnabled } from './turso-client-new';

// 检测是否在Vercel环境中
const isVercel = process.env.VERCEL === '1';

// 在Vercel环境中强制使用Turso
const forceTurso = isVercel || isTursoEnabled();

// 尝试多个数据库文件路径（本地开发用）
const DB_PATH_OPTIONS = [
  process.env.DB_PATH,
  path.resolve(process.cwd(), 'data', 'storage', 'backups', 'sqlite-backup-2025-05-16T05-29-38-486Z.db'),
  path.resolve(process.cwd(), 'data', 'storage', 'backups', 'sqlite-backup-2025-05-16T05-28-37-207Z.db'),
  path.resolve(process.cwd(), 'data', 'storage', 'blog.db'),
  path.resolve(process.cwd(), 'data', 'blog.db')
];

// 选择第一个存在的数据库文件路径
let DB_PATH = DB_PATH_OPTIONS[0]; // 默认使用环境变量中的路径

// 如果环境变量未设置，检查其他可能的路径
if (!DB_PATH || !fs.existsSync(DB_PATH)) {
  for (let i = 1; i < DB_PATH_OPTIONS.length; i++) {
    const dbPath = DB_PATH_OPTIONS[i];
    if (dbPath && fs.existsSync(dbPath)) {
      DB_PATH = dbPath;
      break;
    }
  }
}

// 如果所有路径都不存在，使用data/blog.db作为默认值
if (!DB_PATH || !fs.existsSync(DB_PATH)) {
  DB_PATH = path.resolve(process.cwd(), 'data', 'blog.db');
}

// 记录数据库配置信息
if (forceTurso) {
  console.log('[数据库] 使用Turso云数据库');
  if (isVercel) console.log('[数据库] 在Vercel环境中强制使用Turso');
} else {
  console.log(`[数据库] 使用本地SQLite数据库: ${DB_PATH}`);
  console.log(`[数据库] 文件是否存在: ${fs.existsSync(DB_PATH) ? '是' : '否'}`);
  const fileSize = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0;
  console.log(`[数据库] 文件大小: ${fileSize} 字节`);
}

// 使用通用数据库类型，兼容SQLite和Turso适配器
// 由于两个实现的get方法返回类型略有不同，使用更通用的类型
type GenericDatabase = Omit<Database, 'get'> & {
  get<T = any>(sql: string, ...params: any[]): Promise<T | undefined>;
};

// 单例数据库实例
let dbInstance: GenericDatabase | null = null;

// 动态导入sqlite3，避免在Vercel环境中直接导入
async function getSqliteDriver() {
  if (forceTurso) {
    console.log('[DB] 在Vercel环境中跳过SQLite数据库初始化');
    return null;
  }
  
  try {
    // 使用动态导入，确保在Vercel环境中不会尝试加载
    const sqlite3Module = await import('sqlite3').catch(err => {
      console.warn('[数据库] 导入sqlite3失败，尝试使用Turso替代:', err);
      return null;
    });
    return sqlite3Module?.default;
  } catch (error) {
    console.error('[数据库] 导入sqlite3失败:', error);
    return null;
  }
}

// 动态导入sqlite，避免在Vercel环境中直接导入
async function getSqliteOpen() {
  if (forceTurso) {
    console.log('[DB] 在Vercel环境中跳过SQLite数据库初始化');
    return null;
  }
  
  try {
    // 使用动态导入，确保在Vercel环境中不会尝试加载
    const sqliteModule = await import('sqlite').catch(err => {
      console.warn('[数据库] 导入sqlite失败，尝试使用Turso替代:', err);
      return null;
    });
    return sqliteModule?.open;
  } catch (error) {
    console.error('[数据库] 导入sqlite失败:', error);
    return null;
  }
}

/**
 * 获取数据库连接
 */
export async function getDatabase(): Promise<GenericDatabase> {
  if (!dbInstance) {
    await initializeDatabase();
  }
  return dbInstance!;
}

/**
 * 初始化数据库连接
 */
export async function initializeDatabase(): Promise<GenericDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // 在Vercel环境中或配置了Turso时，使用Turso数据库
    if (forceTurso) {
      console.log('[数据库] 初始化Turso数据库连接');
      
      // 检查Turso配置
      if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        console.error('[数据库] 缺少Turso配置，请设置TURSO_DATABASE_URL和TURSO_AUTH_TOKEN环境变量');
        throw new Error('Turso配置缺失');
      }
      
      dbInstance = new TursoDatabase() as GenericDatabase;
      console.log('[数据库] Turso数据库初始化成功');
    } else {
      // 使用本地SQLite
      console.log(`[数据库] 初始化本地SQLite数据库: ${DB_PATH}`);
      
      // 确保数据目录存在
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // 动态导入sqlite和sqlite3
      const sqlite3 = await getSqliteDriver();
      const open = await getSqliteOpen();
      
      if (!sqlite3 || !open) {
        console.warn('[数据库] 无法加载SQLite驱动，尝试使用Turso替代');
        
        // 如果SQLite加载失败但配置了Turso，则使用Turso
        if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
          dbInstance = new TursoDatabase() as GenericDatabase;
          console.log('[数据库] 回退到Turso数据库');
          return dbInstance;
        }
        
        throw new Error('无法加载SQLite驱动，且未配置Turso替代');
      }
      
      // 打开数据库连接
      dbInstance = await open({
        filename: DB_PATH,
        driver: sqlite3.Database,
      }) as GenericDatabase;
      
      // 启用外键约束
      await dbInstance.exec('PRAGMA foreign_keys = ON');
      
      console.log('[数据库] SQLite数据库初始化成功');
    }
    
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
    if (!forceTurso) {
      // 只对本地SQLite连接执行关闭
      await dbInstance.close();
    }
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
  try {
    const db = await getDatabase();
    return db.all<T>(sql, ...(params || []));
  } catch (error) {
    console.error('[数据库] 查询失败:', error);
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
  try {
    const db = await getDatabase();
    return db.get<T>(sql, ...(params || []));
  } catch (error) {
    console.error('[数据库] 查询单条失败:', error);
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
  try {
    const db = await getDatabase();
    const result = await db.run(sql, ...(params || []));
    return result.changes || 0;
  } catch (error) {
    console.error('[数据库] 执行失败:', error);
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