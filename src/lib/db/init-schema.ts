import { getDatabase } from './database';
import fs from 'fs';
import path from 'path';

// 初始化数据库表结构
export async function initializeSchema() {
  const db = await getDatabase();
  
  console.log('[数据库] 开始初始化基本表结构...');
  
  try {
    // 创建文章表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        updated TEXT,
        content TEXT NOT NULL,
        excerpt TEXT,
        description TEXT,
        published INTEGER DEFAULT 1,
        featured INTEGER DEFAULT 0,
        cover_image TEXT,
        reading_time INTEGER,
        original_file TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    
    // 创建分类表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        parent_id INTEGER,
        post_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    
    // 创建标签表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        post_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    // 创建文章-分类关联表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS post_categories (
        post_id TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        PRIMARY KEY (post_id, category_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    
    // 创建文章-标签关联表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id TEXT NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (post_id, tag_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
    
    // 创建slug映射表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS slug_mapping (
        slug TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);
    
    console.log('[数据库] 表结构初始化完成');
    
    // 检查是否为空数据库（没有任何记录）
    const postCount = await db.get<{count: number}>('SELECT COUNT(*) as count FROM posts');
    const categoryCount = await db.get<{count: number}>('SELECT COUNT(*) as count FROM categories');
    
    console.log(`[数据库] 当前文章数: ${postCount?.count || 0}, 分类数: ${categoryCount?.count || 0}`);
    
    if ((postCount && postCount.count === 0) && (categoryCount && categoryCount.count === 0)) {
      console.log('[数据库] 检测到空数据库，添加基础分类数据...');
      
      // 添加默认分类
      const now = new Date().toISOString();
      const defaultCategories = [
        { slug: 'programming', name: '编程', description: '编程相关文章', created_at: now, updated_at: now },
        { slug: 'tech', name: '技术', description: '技术相关文章', created_at: now, updated_at: now },
        { slug: 'life', name: '生活', description: '生活随笔', created_at: now, updated_at: now }
      ];
      
      for (const category of defaultCategories) {
        try {
          await db.run(
            'INSERT INTO categories (slug, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [category.slug, category.name, category.description, category.created_at, category.updated_at]
          );
          console.log(`[数据库] 添加默认分类: ${category.name}`);
        } catch (err) {
          console.error(`[数据库] 添加默认分类 ${category.name} 失败:`, err);
        }
      }
      
      console.log('[数据库] 默认数据添加完成');
    }
    
    // 确保数据目录存在，这样即使没有数据，数据库文件也能创建
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`[数据库] 创建数据目录: ${dataDir}`);
    }
    
    // 尝试写入一个测试文件确认权限
    try {
      const testFilePath = path.join(dataDir, '.test-write');
      fs.writeFileSync(testFilePath, 'test', 'utf8');
      fs.unlinkSync(testFilePath);
      console.log(`[数据库] 数据目录写入权限检查通过`);
    } catch (err) {
      console.error(`[数据库] 数据目录写入权限检查失败:`, err);
    }
    
    return true;
  } catch (error) {
    console.error('[数据库] 初始化表结构失败:', error);
    throw error;
  }
} 