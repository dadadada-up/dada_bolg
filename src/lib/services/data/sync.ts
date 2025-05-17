/**
 * 数据同步工具
 * 
 * 此模块用于将Turso云数据库的数据同步到本地SQLite数据库
 * 只在开发环境中使用，生产环境直接使用Turso
 */

import fs from 'fs';
import path from 'path';
import { isTursoEnabled } from '@/lib/db/turso-client-new';
import {
  query as dbQuery,
  queryOne as dbQueryOne,
  execute as dbExecute,
  initializeDatabase,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  withTransaction,
  getDatabase,
  closeDatabase
} from '@/lib/db/database';

// 表定义
interface TableDefinition {
  name: string;
  query: string;
  primaryKey: string;
  type?: 'category' | 'tag' | 'post' | 'postCategory' | 'postTag' | 'slugMapping';
}

// 同步选项
export interface SyncOptions {
  categories?: boolean;
  tags?: boolean;
  posts?: boolean;
  postCategories?: boolean;
  postTags?: boolean;
  slugMappings?: boolean;
}

// 要同步的表定义，按依赖顺序排序
const TABLES_TO_SYNC: TableDefinition[] = [
  {
    name: 'categories',
    query: 'SELECT id, name, slug, description FROM categories',
    primaryKey: 'id',
    type: 'category'
  },
  {
    name: 'tags',
    query: 'SELECT id, name, slug FROM tags',
    primaryKey: 'id',
    type: 'tag'
  },
  {
    name: 'posts',
    query: `SELECT id, title, slug, content, excerpt, description, 
            published, featured, cover_image, reading_time, 
            created_at, updated_at FROM posts`,
    primaryKey: 'id',
    type: 'post'
  },
  {
    name: 'post_categories',
    query: 'SELECT post_id, category_id FROM post_categories',
    primaryKey: 'post_id,category_id',
    type: 'postCategory'
  },
  {
    name: 'post_tags',
    query: 'SELECT post_id, tag_id FROM post_tags',
    primaryKey: 'post_id,tag_id',
    type: 'postTag'
  },
  {
    name: 'slug_mapping',
    query: 'SELECT post_id, slug, is_primary FROM slug_mapping',
    primaryKey: 'post_id,slug',
    type: 'slugMapping'
  }
];

/**
 * 创建临时数据库文件路径
 */
function getTempDbPath(): string {
  const tempDir = path.resolve(process.cwd(), 'data', 'storage', 'temp');
  
  // 确保目录存在
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  return path.resolve(tempDir, `sync-${Date.now()}.db`);
}

/**
 * 创建备份数据库文件路径
 */
function getBackupDbPath(): string {
  const backupDir = path.resolve(process.cwd(), 'data', 'storage', 'backups');
  
  // 确保目录存在
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  return path.resolve(backupDir, `sqlite-backup-${timestamp}.db`);
}

/**
 * 获取目标SQLite数据库路径
 */
function getSqliteDbPath(): string {
  // 尝试读取DB_PATH环境变量
  if (process.env.DB_PATH && fs.existsSync(process.env.DB_PATH)) {
    return process.env.DB_PATH;
  }
  
  // 默认路径
  const defaultPath = path.resolve(process.cwd(), 'data', 'blog.db');
  
  // 确保目录存在
  const dir = path.dirname(defaultPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  return defaultPath;
}

/**
 * 从Turso云数据库同步数据到本地SQLite
 * @param options 同步选项，指定要同步的表
 */
export async function syncFromTursoToSQLite(options?: SyncOptions): Promise<boolean> {
  if (process.env.NODE_ENV === 'production') {
    console.log('[DataSync] 生产环境不需要同步，跳过');
    return false;
  }
  
  if (!isTursoEnabled()) {
    console.log('[DataSync] Turso未启用，跳过同步');
    return false;
  }
  
  console.log('[DataSync] 开始从Turso同步数据到SQLite');
  
  try {
    // 初始化数据库连接
    await initializeDatabase();
    
    // 过滤要同步的表
    let tablesToSync = [...TABLES_TO_SYNC];
    
    if (options) {
      console.log('[DataSync] 使用自定义同步选项:', options);
      
      tablesToSync = TABLES_TO_SYNC.filter(table => {
        switch(table.type) {
          case 'category':
            return options.categories !== false; // 默认true
          case 'tag':
            return options.tags !== false;
          case 'post':
            return options.posts !== false;
          case 'postCategory':
            return options.postCategories !== false;
          case 'postTag':
            return options.postTags !== false;
          case 'slugMapping':
            return options.slugMappings !== false;
          default:
            return true;
        }
      });
      
      console.log(`[DataSync] 将同步 ${tablesToSync.length} 个表: `, 
        tablesToSync.map(t => t.name).join(', '));
    }
    
    // 在一个事务中执行所有同步操作
    await withTransaction(async () => {
      // 同步每个表
      for (const table of tablesToSync) {
        await syncTable(table);
      }
    });
    
    console.log('[DataSync] 同步完成');
    return true;
  } catch (error) {
    console.error('[DataSync] 同步数据失败:', error);
    return false;
  }
}

/**
 * 同步单个表
 */
async function syncTable(table: TableDefinition): Promise<void> {
  console.log(`[DataSync] 同步表 ${table.name}`);
  
  // 1. 获取表的所有数据
  const rows = await dbQuery(table.query);
  console.log(`[DataSync] 共读取 ${rows.length} 条记录`);
  
  if (rows.length === 0) {
    console.log(`[DataSync] 表 ${table.name} 没有数据，跳过`);
    return;
  }
  
  // 2. 先清空表
  await dbExecute(`DELETE FROM ${table.name}`);
  
  // 3. 批量插入数据
  const keys = Object.keys(rows[0]);
  const placeholders = keys.map(() => '?').join(', ');
  const insertSql = `INSERT INTO ${table.name} (${keys.join(', ')}) VALUES (${placeholders})`;
  
  for (const row of rows) {
    const values = keys.map(key => row[key]);
    await dbExecute(insertSql, values);
  }
  
  console.log(`[DataSync] 表 ${table.name} 同步完成，共 ${rows.length} 条记录`);
}

/**
 * 备份本地SQLite数据库
 */
export async function backupSQLiteDatabase(): Promise<string | null> {
  try {
    const dbPath = getSqliteDbPath();
    if (!fs.existsSync(dbPath)) {
      console.log('[DataSync] SQLite数据库文件不存在，无法备份');
      return null;
    }
    
    const backupPath = getBackupDbPath();
    fs.copyFileSync(dbPath, backupPath);
    
    console.log(`[DataSync] 数据库已备份到: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('[DataSync] 备份数据库失败:', error);
    return null;
  }
}

/**
 * 完整的同步流程：备份现有数据库，从Turso同步数据
 * @param options 同步选项
 */
export async function performFullSync(options?: SyncOptions): Promise<boolean> {
  try {
    // 1. 从Turso同步数据
    console.log('[DataSync] 开始全量同步');
    const result = await syncFromTursoToSQLite(options);
    
    if (result) {
      console.log('[DataSync] 同步成功完成');
    } else {
      console.log('[DataSync] 同步失败');
    }
    
    return result;
  } catch (error) {
    console.error('[DataSync] 全量同步失败:', error);
    return false;
  }
} 