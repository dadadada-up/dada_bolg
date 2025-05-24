import { Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { Post } from '@/types/post';
import { initializeDatabase as initDb, getDatabase, closeDatabase, query, queryOne, execute, beginTransaction, commitTransaction, rollbackTransaction, withTransaction, getCurrentTimestamp } from './database';
import { initializeSchema } from './init-schema';

// 检测是否在Vercel环境中
const isVercel = process.env.VERCEL === '1';

let db: Database | null = null;

// 获取数据库连接
export async function getLocalDb(): Promise<Database> {
  if (db) {
    return db;
  }
  
  // 在Vercel环境中，跳过SQLite初始化
  if (isVercel) {
    throw new Error('在Vercel环境中不支持直接使用SQLite，请使用Turso数据库');
  }
  
  const dbPath = path.join(process.cwd(), 'data', 'blog.db');
  
  // 确保data目录存在
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  try {
    // 动态导入sqlite和sqlite3
    const { open } = await import('sqlite');
    const sqlite3 = await import('sqlite3');
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.default.Database
    });
    
    return db;
  } catch (error) {
    console.error('无法加载SQLite驱动:', error);
    throw error;
  }
}

interface SyncStatus {
  id: number;
  last_sync_time: string | null;
  sync_in_progress: number;
}

// 检查表是否存在
async function tablesExist(): Promise<boolean> {
  // 在Vercel环境中，跳过检查
  if (isVercel) {
    return true;
  }
  
  const db = await getLocalDb();
  const result = await db.get(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='posts'
  `);
  return !!result;
}

// 创建数据库表
export async function setupLocalDatabase() {
  // 在Vercel环境中，跳过初始化
  if (isVercel) {
    console.log('[DB] 在Vercel环境中跳过SQLite数据库初始化');
    return;
  }
  
  const db = await getLocalDb();
  
  // 创建文章表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id            INTEGER   PRIMARY KEY AUTOINCREMENT,
      slug          TEXT      UNIQUE NOT NULL,
      title         TEXT      NOT NULL,
      content       TEXT      NOT NULL,
      excerpt       TEXT,
      description   TEXT,
      published     BOOLEAN   DEFAULT true,
      featured      BOOLEAN   DEFAULT false,
      cover_image   TEXT,
      reading_time  INTEGER,
      original_file TEXT,
      created_at    DATETIME  NOT NULL,
      updated_at    DATETIME  NOT NULL
    )
  `);
  
  // 创建分类表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id          TEXT    PRIMARY KEY,
      name        TEXT    NOT NULL,
      slug        TEXT    UNIQUE NOT NULL,
      description TEXT
    )
  `);
  
  // 创建文章分类关联表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS post_categories (
      post_id     INTEGER NOT NULL,
      category_id TEXT    NOT NULL,
      PRIMARY KEY (post_id, category_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);
  
  // 创建标签表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id          TEXT    PRIMARY KEY,
      name        TEXT    NOT NULL,
      slug        TEXT    UNIQUE NOT NULL
    )
  `);
  
  // 创建文章标签关联表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS post_tags (
      post_id     INTEGER NOT NULL,
      tag_id      TEXT    NOT NULL,
      PRIMARY KEY (post_id, tag_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);
  
  // 创建slug映射表 (处理不同slug变体指向同一文章)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS slug_mapping (
      slug TEXT PRIMARY KEY,
      post_id INTEGER NOT NULL,
      is_primary BOOLEAN DEFAULT false,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);
  
  // 创建同步状态表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sync_status (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_sync_time DATETIME,
      sync_in_progress BOOLEAN DEFAULT false
    )
  `);
  
  // 创建必要的索引
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at);
    CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
    CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(featured);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
    CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
  `);
  
  // 初始化同步状态记录
  const syncStatus = await db.get('SELECT * FROM sync_status WHERE id = 1') as SyncStatus | undefined;
  if (!syncStatus) {
    await db.run('INSERT INTO sync_status (id, last_sync_time, sync_in_progress) VALUES (1, NULL, false)');
    console.log('[DB] 初始化同步状态记录');
  }
}

// 初始化数据库
export default async function initializeDb() {
  try {
    console.log('[数据库] 开始初始化数据库...');
    
    // 初始化数据库连接
    await initDb();
    
    // 初始化表结构
    await initializeSchema();
    
    console.log('[数据库] 初始化完成');
    return true;
  } catch (error) {
    console.error('[数据库] 初始化失败:', error);
    throw error;
  }
}

// 导出数据库函数
export {
  initDb as initializeDatabase,
  getDatabase,
  closeDatabase,
  query,
  queryOne,
  execute,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  withTransaction,
  getCurrentTimestamp
};

// 导出替代别名
export const getDb = getDatabase;
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
export const getTimestamp = () => {
  return Math.floor(Date.now() / 1000);
};

// 获取数据库状态信息
export async function getDbStatus() {
  // 在Vercel环境中，返回占位信息
  if (isVercel) {
    return {
      initialized: true,
      dbSize: 'N/A (Vercel环境)',
      postCount: 0,
      categoryCount: 0,
      tagCount: 0,
      lastSyncTime: null,
      syncInProgress: false,
      isVercel: true
    };
  }
  
  const db = await getLocalDb();
  
  const postCount = await db.get('SELECT COUNT(*) as count FROM posts');
  const categoryCount = await db.get('SELECT COUNT(*) as count FROM categories');
  const tagCount = await db.get('SELECT COUNT(*) as count FROM tags');
  const syncStatus = await db.get('SELECT * FROM sync_status WHERE id = 1') as SyncStatus | undefined;
  
  const dbFile = fs.existsSync(path.join(process.cwd(), 'data', 'blog.db'));
  const dbSize = dbFile ? fs.statSync(path.join(process.cwd(), 'data', 'blog.db')).size : 0;
  
  return {
    initialized: !!dbFile,
    dbSize: formatSize(dbSize),
    postCount: postCount?.count || 0,
    categoryCount: categoryCount?.count || 0,
    tagCount: tagCount?.count || 0,
    lastSyncTime: syncStatus?.last_sync_time || null,
    syncInProgress: !!syncStatus?.sync_in_progress,
    isVercel: false
  };
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 