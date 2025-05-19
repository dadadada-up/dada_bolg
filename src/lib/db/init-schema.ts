import { getDatabase } from './database';
import fs from 'fs';
import path from 'path';

// 初始化数据库表结构
export async function initializeSchema() {
  const db = await getDatabase();
  
  console.log('[数据库] 开始初始化基本表结构...');
  
  try {
    // 检查现有表结构
    const existingTables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = existingTables.map((t: any) => t.name);
    console.log('[数据库] 现有表:', tableNames.join(', '));
    
    // 创建文章表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        description TEXT,
        is_published INTEGER DEFAULT 1,
        is_featured INTEGER DEFAULT 0,
        image_url TEXT,
        reading_time INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
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
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    // 创建文章-分类关联表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS post_categories (
        post_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        PRIMARY KEY (post_id, category_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    
    // 创建文章-标签关联表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER NOT NULL,
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
        post_id INTEGER NOT NULL,
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);
    
    console.log('[数据库] 表结构初始化完成');
    
    // 检查表结构是否需要修复
    await checkAndFixTableStructure(db, tableNames);
    
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

// 检查并修复表结构
async function checkAndFixTableStructure(db: any, existingTables: string[]) {
  try {
    console.log('[数据库] 开始检查表结构...');
    
    // 检查posts表结构
    if (existingTables.includes('posts')) {
      // 检查是否有published列（旧版本）但没有is_published列（新版本）
      const postsColumns = await db.all("PRAGMA table_info(posts)");
      const columnNames = postsColumns.map((col: any) => col.name);
      
      console.log('[数据库] posts表列:', columnNames.join(', '));
      
      // 检查并修复published -> is_published
      if (columnNames.includes('published') && !columnNames.includes('is_published')) {
        console.log('[数据库] 检测到旧版列名published，添加is_published列并同步数据');
        
        await db.exec(`
          ALTER TABLE posts ADD COLUMN is_published INTEGER DEFAULT 1;
          UPDATE posts SET is_published = published;
        `);
        
        console.log('[数据库] 成功添加is_published列并同步数据');
      }
      
      // 检查并修复featured -> is_featured
      if (columnNames.includes('featured') && !columnNames.includes('is_featured')) {
        console.log('[数据库] 检测到旧版列名featured，添加is_featured列并同步数据');
        
        await db.exec(`
          ALTER TABLE posts ADD COLUMN is_featured INTEGER DEFAULT 0;
          UPDATE posts SET is_featured = featured;
        `);
        
        console.log('[数据库] 成功添加is_featured列并同步数据');
      }
      
      // 检查并修复cover_image -> image_url
      if (columnNames.includes('cover_image') && !columnNames.includes('image_url')) {
        console.log('[数据库] 检测到旧版列名cover_image，添加image_url列并同步数据');
        
        await db.exec(`
          ALTER TABLE posts ADD COLUMN image_url TEXT;
          UPDATE posts SET image_url = cover_image;
        `);
        
        console.log('[数据库] 成功添加image_url列并同步数据');
      }
    }
    
    // 检查是否需要更新slug_mapping表的外键类型
    if (existingTables.includes('slug_mapping')) {
      try {
        // 检查post_id列类型
        const slugMappingInfo = await db.all("PRAGMA table_info(slug_mapping)");
        const postIdColumn = slugMappingInfo.find((col: any) => col.name === 'post_id');
        
        if (postIdColumn && postIdColumn.type === 'TEXT') {
          console.log('[数据库] 检测到slug_mapping表的post_id列类型为TEXT，需要修复为INTEGER');
          
          // 创建临时表
          await db.exec(`
            CREATE TABLE slug_mapping_temp (
              slug TEXT PRIMARY KEY,
              post_id INTEGER NOT NULL,
              is_primary INTEGER DEFAULT 0,
              FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            );
            
            INSERT INTO slug_mapping_temp (slug, post_id, is_primary)
            SELECT slug, CAST(post_id AS INTEGER), is_primary FROM slug_mapping;
            
            DROP TABLE slug_mapping;
            
            ALTER TABLE slug_mapping_temp RENAME TO slug_mapping;
          `);
          
          console.log('[数据库] 成功修复slug_mapping表的post_id列类型');
        }
      } catch (error) {
        console.error('[数据库] 检查slug_mapping表结构失败:', error);
      }
    }
    
    console.log('[数据库] 表结构检查和修复完成');
  } catch (error) {
    console.error('[数据库] 检查和修复表结构失败:', error);
    // 不抛出错误，让初始化过程继续
  }
} 