/**
 * 数据库访问层
 * 根据环境自动选择使用Turso云数据库或本地SQLite
 */

import path from 'path';
import fs from 'fs';
import { TursoDatabase } from './turso-adapter';
import { isTursoEnabled } from './turso-client-new';

// 检测是否在Vercel环境中
const isVercel = process.env.VERCEL === '1';

// 在Vercel环境中强制使用Turso
const forceTurso = isVercel || isTursoEnabled();

// 尝试多个数据库文件路径（本地开发用）
const DB_PATH_OPTIONS = [
  process.env.DB_PATH,
  // 优先使用data/storage/blog.db（包含完整数据的数据库）
  path.resolve(process.cwd(), 'data', 'storage', 'blog.db'),
  path.resolve(process.cwd(), 'data', 'storage', 'backups', 'sqlite-backup-2025-05-16T05-29-38-486Z.db'),
  path.resolve(process.cwd(), 'data', 'storage', 'backups', 'sqlite-backup-2025-05-16T05-28-37-207Z.db'),
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
type GenericDatabase = {
  get<T = any>(sql: string, ...params: any[]): Promise<T | undefined>;
  all<T = any>(sql: string, ...params: any[]): Promise<T[]>;
  run(sql: string, ...params: any[]): Promise<{ lastID: number; changes: number }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
};

// 单例数据库实例
let dbInstance: GenericDatabase | null = null;

// 检查是否有全局SQLite连接（由DataService创建的兜底连接）
function getGlobalDbInstance(): GenericDatabase | null {
  // @ts-ignore - 访问全局变量
  return global.__db_instance || null;
}

/**
 * 获取数据库连接
 */
export async function getDatabase(): Promise<GenericDatabase> {
  // 先检查本地实例
  if (dbInstance) {
    return dbInstance;
  }
  
  // 再检查全局实例（来自兜底机制）
  const globalInstance = getGlobalDbInstance();
  if (globalInstance) {
    console.log('[数据库] 使用全局兜底SQLite连接');
    dbInstance = globalInstance;
    return dbInstance;
  }
  
  // 都没有则初始化新连接
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

  // 检查是否有全局实例
  const globalInstance = getGlobalDbInstance();
  if (globalInstance) {
    console.log('[数据库] 使用全局兜底SQLite连接');
    dbInstance = globalInstance;
    return dbInstance;
  }

  console.log('[数据库] 开始初始化数据库连接...');
  console.log(`[数据库] 环境变量: TURSO_DATABASE_URL=${!!process.env.TURSO_DATABASE_URL}, TURSO_AUTH_TOKEN=${!!process.env.TURSO_AUTH_TOKEN}`);
  console.log(`[数据库] 旧环境变量: DATABASE_URL=${!!process.env.DATABASE_URL}, DATABASE_AUTH_TOKEN=${!!process.env.DATABASE_AUTH_TOKEN}`);
  console.log(`[数据库] isTursoEnabled=${isTursoEnabled()}, forceTurso=${forceTurso}`);

  try {
    // 在Vercel环境中强制使用Turso
    if (isVercel || forceTurso) {
      console.log('[数据库] 在Vercel环境或强制模式下使用Turso数据库');
      
      // 如果TURSO_前缀环境变量不存在，但旧格式存在，则使用旧格式
      if ((!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) && 
          (process.env.DATABASE_URL && process.env.DATABASE_AUTH_TOKEN)) {
        console.log('[数据库] 使用旧环境变量格式 (DATABASE_URL)');
        process.env.TURSO_DATABASE_URL = process.env.DATABASE_URL;
        process.env.TURSO_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;
      }
      
      // 检查Turso配置是否完备
      if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        throw new Error('Turso配置缺失: 需要设置TURSO_DATABASE_URL和TURSO_AUTH_TOKEN环境变量');
      }
      
      try {
        dbInstance = new TursoDatabase() as GenericDatabase;
        console.log('[数据库] Turso数据库初始化成功');
        return dbInstance;
      } catch (tursoError) {
        console.error('[数据库] Turso连接失败:', tursoError);
        throw new Error(`Turso连接失败: ${tursoError instanceof Error ? tursoError.message : String(tursoError)}`);
      }
    }
    
    // 本地开发环境 - 尝试使用SQLite
    console.log('[数据库] 在开发环境中使用本地SQLite');
    
    // 确保data目录存在
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 动态导入sqlite和sqlite3
    const { open } = await import('sqlite');
    const sqlite3 = await import('sqlite3');
    
    try {
      dbInstance = await open({
        filename: DB_PATH,
        driver: sqlite3.default.Database
      }) as GenericDatabase;
      
      console.log('[数据库] SQLite数据库初始化成功');
      return dbInstance;
    } catch (sqliteError) {
      console.error('[数据库] SQLite连接失败:', sqliteError);
      throw new Error(`SQLite连接失败: ${sqliteError instanceof Error ? sqliteError.message : String(sqliteError)}`);
    }
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