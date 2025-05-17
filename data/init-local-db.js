/**
 * 本地SQLite数据库初始化脚本
 * 
 * 这个脚本会创建基本的数据表结构供本地开发使用
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, 'blog.db');

console.log(`准备初始化数据库: ${dbPath}`);

// 创建数据库连接
const db = new sqlite3.Database(dbPath);

// 开始事务
db.serialize(() => {
  try {
    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON');
    
    // 创建posts表
    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content TEXT,
        excerpt TEXT,
        description TEXT,
        is_published INTEGER DEFAULT 0,
        is_featured INTEGER DEFAULT 0,
        cover_image TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    
    // 创建categories表
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `);
    
    // 创建tags表
    db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE
      )
    `);
    
    // 创建post_categories关联表
    db.run(`
      CREATE TABLE IF NOT EXISTS post_categories (
        post_id INTEGER,
        category_id INTEGER,
        PRIMARY KEY (post_id, category_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    
    // 创建post_tags关联表
    db.run(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (post_id, tag_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
    
    // 创建slug_mapping表
    db.run(`
      CREATE TABLE IF NOT EXISTS slug_mapping (
        slug TEXT PRIMARY KEY,
        post_id INTEGER NOT NULL,
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);
    
    // 创建sync_status表
    db.run(`
      CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_sync_time INTEGER,
        sync_in_progress INTEGER DEFAULT 0
      )
    `);
    
    // 创建索引
    db.run('CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)');
    db.run('CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(is_published)');
    db.run('CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(is_featured)');
    db.run('CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)');
    db.run('CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug)');
    
    // 添加示例数据（次序很重要 - 先添加主表再添加关联）
    
    // 1. 添加示例分类
    db.run(`INSERT OR IGNORE INTO categories (id, name, slug, description) VALUES 
      (1, '技术', 'technology', '技术相关文章'),
      (2, '生活', 'life', '生活点滴'),
      (3, '随笔', 'essay', '随想随记')
    `);
    
    // 2. 添加示例标签
    db.run(`INSERT OR IGNORE INTO tags (id, name, slug) VALUES 
      (1, 'JavaScript', 'javascript'),
      (2, 'React', 'react'),
      (3, 'Next.js', 'nextjs'),
      (4, '旅行', 'travel'),
      (5, '读书', 'reading')
    `);
    
    // 3. 添加示例文章
    const now = Math.floor(Date.now() / 1000);
    db.run(`INSERT OR IGNORE INTO posts (id, title, slug, content, excerpt, is_published, is_featured, created_at, updated_at) VALUES 
      (1, 'Hello World', 'hello-world', '这是一篇示例文章', '示例摘要', 1, 1, ${now}, ${now}),
      (2, '开始使用Next.js', 'getting-started-with-nextjs', '学习Next.js的基础知识', 'Next.js入门指南', 1, 0, ${now}, ${now}),
      (3, '我的旅行日记', 'my-travel-diary', '记录我的旅行见闻', '旅行见闻', 0, 0, ${now}, ${now})
    `);
    
    // 4. 添加文章-分类关联
    db.run(`INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES 
      (1, 1),
      (2, 1),
      (3, 2)
    `);
    
    // 5. 添加文章-标签关联
    db.run(`INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES 
      (1, 1),
      (2, 1),
      (2, 3),
      (3, 4)
    `);
    
    // 6. 添加slug映射
    db.run(`INSERT OR IGNORE INTO slug_mapping (slug, post_id, is_primary) VALUES 
      ('hello-world', 1, 1),
      ('getting-started-with-nextjs', 2, 1),
      ('nextjs-tutorial', 2, 0),
      ('my-travel-diary', 3, 1)
    `);
    
    // 初始化同步状态记录
    db.get('SELECT * FROM sync_status WHERE id = 1', (err, row) => {
      if (err) {
        console.error('查询同步状态时出错:', err);
        return;
      }
      
      if (!row) {
        db.run('INSERT INTO sync_status (id, last_sync_time, sync_in_progress) VALUES (1, NULL, 0)', (err) => {
          if (err) {
            console.error('初始化同步状态记录时出错:', err);
          } else {
            console.log('初始化同步状态记录');
          }
        });
      } else {
        console.log('同步状态记录已存在');
      }
    });
    
    console.log('本地SQLite数据库初始化完成');
  } catch (error) {
    console.error('初始化数据库时出错:', error);
  }
});

// 在所有操作完成后关闭连接
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接时出错:', err);
    } else {
      console.log('数据库连接已关闭');
    }
  });
}, 1000); // 延迟1秒再关闭连接 