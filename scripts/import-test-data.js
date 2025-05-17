/**
 * 导入测试数据到数据库
 * 该脚本将备用数据中的文章导入到数据库
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'data', 'blog.db');
console.log(`数据库路径: ${dbPath}`);

// 确保数据目录存在
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  console.log(`创建数据目录: ${dataDir}`);
  fs.mkdirSync(dataDir, { recursive: true });
}

// 打开数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('无法打开数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到SQLite数据库');
});

// 启用外键约束
db.run('PRAGMA foreign_keys = ON');

// 确保表结构存在
const createTables = () => {
  console.log('创建必要的表结构...');
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 创建文章表
      db.run(`
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
      `, (err) => {
        if (err) {
          console.error('创建posts表失败:', err.message);
          reject(err);
          return;
        }
      });

      // 创建文章-分类关联表
      db.run(`
        CREATE TABLE IF NOT EXISTS post_categories (
          post_id TEXT NOT NULL,
          category_id INTEGER NOT NULL,
          PRIMARY KEY (post_id, category_id),
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('创建post_categories表失败:', err.message);
          reject(err);
          return;
        }
      });

      // 创建文章-标签关联表
      db.run(`
        CREATE TABLE IF NOT EXISTS post_tags (
          post_id TEXT NOT NULL,
          tag_id INTEGER NOT NULL,
          PRIMARY KEY (post_id, tag_id),
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('创建post_tags表失败:', err.message);
          reject(err);
          return;
        }
      });

      // 创建标签表
      db.run(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          post_count INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('创建tags表失败:', err.message);
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
};

// 使用硬编码的备用数据
const getFallbackData = () => {
  // 直接在这里定义备用文章数据
  return [
    {
      slug: 'welcome-to-dada-blog',
      title: '欢迎来到Dada博客',
      description: '这是一个基于Next.js和Turso数据库构建的现代博客系统',
      content: `# 欢迎来到Dada博客\n\n这是一个使用Next.js和Turso数据库构建的博客系统。\n\n## 主要特性\n\n1. **现代技术栈**: Next.js、React、TailwindCSS\n2. **高性能**: 基于Turso分布式SQLite构建\n3. **SEO友好**: 静态生成与服务器端渲染\n4. **响应式设计**: 在任何设备上都有良好的浏览体验\n\n## 代码示例\n\n\`\`\`js\n// 一个简单的React组件\nfunction HelloWorld() {\n  return <h1>Hello, World!</h1>;\n}\n\`\`\``,
      date: '2023-12-01',
      created_at: '2023-12-01T00:00:00Z',
      updated_at: '2023-12-01T00:00:00Z',
      is_published: true,
      is_featured: true,
      categories: ['技术', '前端'],
      tags: ['Next.js', 'React', 'Turso'],
      imageUrl: '/images/blog-default.jpg'
    },
    {
      slug: 'getting-started',
      title: '开始使用Dada博客',
      description: '如何安装和配置Dada博客系统，快速搭建你自己的博客',
      content: `# 开始使用Dada博客\n\n按照以下步骤设置您自己的博客实例。\n\n## 安装\n\n1. 克隆仓库\n2. 安装依赖\n3. 配置数据库\n4. 启动服务器\n\n## 配置\n\n修改 \`.env.local\` 文件以设置您的个人配置。\n\n## 部署\n\n使用Vercel一键部署您的博客系统。`,
      date: '2023-12-05',
      created_at: '2023-12-05T00:00:00Z',
      updated_at: '2023-12-05T00:00:00Z',
      is_published: true,
      is_featured: true,
      categories: ['教程', '技术'],
      tags: ['部署', '配置', '入门'],
      imageUrl: '/images/get-started.jpg'
    },
    {
      slug: 'database-migration',
      title: 'Turso数据库迁移指南',
      description: '如何从SQLite迁移到Turso分布式数据库',
      content: `# Turso数据库迁移指南\n\n本指南介绍如何将现有的SQLite数据库迁移到Turso分布式SQLite。\n\n## 迁移步骤\n\n1. 安装Turso CLI\n2. 创建新的Turso数据库\n3. 运行迁移脚本\n4. 验证数据\n\n## 注意事项\n\n迁移前请备份您的数据。`,
      date: '2023-12-10',
      created_at: '2023-12-10T00:00:00Z',
      updated_at: '2023-12-10T00:00:00Z',
      is_published: true,
      is_featured: false,
      categories: ['技术', '开源'],
      tags: ['Turso', 'SQLite', '迁移'],
      imageUrl: '/images/database.jpg'
    }
  ];
};

// 导入文章数据
const importPosts = async (posts) => {
  console.log(`开始导入 ${posts.length} 篇文章...`);
  
  const insertPost = (post) => {
    return new Promise((resolve, reject) => {
      // 先检查文章是否已存在
      db.get('SELECT id FROM posts WHERE slug = ?', [post.slug], async (err, row) => {
        if (err) {
          console.error(`检查文章 ${post.slug} 是否存在时出错:`, err.message);
          reject(err);
          return;
        }
        
        // 如果文章已存在，跳过
        if (row) {
          console.log(`文章 ${post.title} (${post.slug}) 已存在，跳过导入`);
          resolve();
          return;
        }
        
        // 使用自增ID而不是文本ID
        const published = post.is_published ? 1 : 0;
        const featured = post.is_featured ? 1 : 0;
        const now = new Date().toISOString();

        db.run(
          `INSERT OR REPLACE INTO posts 
          (slug, title, content, description, published, featured, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [post.slug, post.title, post.content, post.description, published, featured, now, now],
          function(err) {
            if (err) {
              console.error(`导入文章 ${post.title} 失败:`, err.message);
              reject(err);
              return;
            }
            console.log(`成功导入文章: ${post.title}`);
            
            // 获取插入的文章ID
            const postId = this.lastID;
            
            // 处理分类
            if (post.categories && post.categories.length > 0) {
              processCategories(postId, post.categories).then(() => {
                // 处理标签
                if (post.tags && post.tags.length > 0) {
                  processTags(postId, post.tags).then(resolve).catch(reject);
                } else {
                  resolve();
                }
              }).catch(reject);
            } else {
              // 处理标签
              if (post.tags && post.tags.length > 0) {
                processTags(postId, post.tags).then(resolve).catch(reject);
              } else {
                resolve();
              }
            }
          }
        );
      });
    });
  };

  // 处理分类
  const processCategories = async (postId, categories) => {
    for (const categoryName of categories) {
      // 检查分类是否存在
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
      
      const getCategory = () => {
        return new Promise((resolve, reject) => {
          db.get('SELECT id FROM categories WHERE slug = ? OR name = ?', [slug, categoryName], (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(row);
          });
        });
      };
      
      const category = await getCategory();
      
      if (category) {
        // 添加文章与分类的关联
        await new Promise((resolve, reject) => {
          db.run('INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)', 
            [postId, category.id], (err) => {
            if (err) {
              console.error(`关联文章 ${postId} 到分类 ${categoryName} 失败:`, err.message);
              reject(err);
              return;
            }
            console.log(`关联文章到分类: ${categoryName}`);
            resolve();
          });
        });
        
        // 不再更新分类的文章数量，因为categories表没有post_count字段
      }
    }
  };
  
  // 处理标签
  const processTags = async (postId, tags) => {
    for (const tagName of tags) {
      const slug = tagName.toLowerCase().replace(/\s+/g, '-');
      const tagId = 'tag_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      
      // 检查标签是否存在
      const getTag = () => {
        return new Promise((resolve, reject) => {
          db.get('SELECT id FROM tags WHERE slug = ?', [slug], (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(row);
          });
        });
      };
      
      let tag = await getTag();
      
      // 如果标签不存在，创建它
      if (!tag) {
        await new Promise((resolve, reject) => {
          db.run('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)', 
            [tagId, tagName, slug], function(err) {
            if (err) {
              console.error(`创建标签 ${tagName} 失败:`, err.message);
              reject(err);
              return;
            }
            tag = { id: tagId };
            console.log(`创建标签: ${tagName}`);
            resolve();
          });
        });
      }
      
      // 添加文章与标签的关联
      await new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', 
          [postId, tag.id], (err) => {
          if (err) {
            console.error(`关联文章 ${postId} 到标签 ${tagName} 失败:`, err.message);
            reject(err);
            return;
          }
          console.log(`关联文章到标签: ${tagName}`);
          resolve();
        });
      });
    }
  };

  for (const post of posts) {
    await insertPost(post);
  }
  
  console.log('文章导入完成');
};

// 主函数
const main = async () => {
  try {
    // 创建表结构
    await createTables();
    
    // 获取备用数据
    const posts = getFallbackData();
    
    // 直接开始导入文章，跳过检查是否已有文章总数
    // 因为我们会在每篇文章插入前检查该文章是否已存在
    await importPosts(posts);
    
    console.log('所有数据导入完成');
    db.close();
  } catch (error) {
    console.error('导入失败:', error);
    db.close();
  }
};

// 执行主函数
main(); 