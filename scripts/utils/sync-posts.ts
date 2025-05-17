import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'posts');

async function getDb() {
  return open({
    filename: path.join(process.cwd(), 'data', 'blog.db'),
    driver: sqlite3.Database
  });
}

async function getCacheDb() {
  const cacheDbPath = path.join(process.cwd(), 'data', 'blog-cache.db');
  
  // 如果缓存数据库不存在，创建它
  if (!fs.existsSync(cacheDbPath)) {
    fs.writeFileSync(cacheDbPath, '');
  }
  
  return open({
    filename: cacheDbPath,
    driver: sqlite3.Database
  });
}

async function initDb(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      content_html TEXT,
      excerpt TEXT,
      published BOOLEAN DEFAULT 0,
      featured BOOLEAN DEFAULT 0,
      reading_time INTEGER,
      source_path TEXT,
      yaml_valid BOOLEAN DEFAULT 1,
      manually_edited BOOLEAN DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      categories TEXT,
      tags TEXT,
      image TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
    CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(featured);
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at);
  `);
}

function calculateReadingTime(content: string): number {
  // 假设每分钟阅读 200 个汉字
  const charCount = content.length;
  return Math.ceil(charCount / 200);
}

function fixYamlContent(content: string): string {
  // 修复常见的 YAML 格式问题
  const lines = content.split('\n');
  const yamlLines: string[] = [];
  let inYaml = false;
  let contentLines: string[] = [];
  let yamlData: any = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    
    if (line.trim() === '---') {
      if (!inYaml) {
        inYaml = true;
        yamlLines.push(line);
      } else {
        inYaml = false;
        contentLines = lines.slice(i + 1);
        break;
      }
    } else if (inYaml) {
      // 处理 YAML 格式问题
      if (line.startsWith('- ') && !line.match(/^-\s+["']/)) {
        // 如果是列表项但没有引号，添加引号
        yamlLines.push(line.replace(/^-\s+(.+)$/, '- "$1"'));
      } else if (line.match(/^[\w-]+:\s*[^"'\s].*$/)) {
        // 如果值没有引号且包含特殊字符，添加引号
        yamlLines.push(line.replace(/^([\w-]+):\s*(.+)$/, '$1: "$2"'));
      } else {
        yamlLines.push(line);
      }
    }
  }
  
  // 确保 YAML 部分结束
  if (inYaml) {
    yamlLines.push('---');
  }
  
  // 尝试解析修复后的 YAML
  try {
    const yamlContent = yamlLines.slice(1, -1).join('\n');
    const { data } = matter('---\n' + yamlContent + '\n---');
    yamlData = data;
  } catch (error) {
    console.error('YAML 解析失败，使用基本格式');
    yamlData = {};
  }
  
  // 重新生成规范的 YAML
  const newYamlLines = ['---'];
  
  // 标题
  if (yamlData.title) {
    newYamlLines.push(`title: "${yamlData.title}"`);
  }
  
  // 创建时间
  if (yamlData.created_at || yamlData.date) {
    newYamlLines.push(`created_at: "${yamlData.created_at || yamlData.date}"`);
  }
  
  // 分类
  if (yamlData.categories) {
    newYamlLines.push('categories:');
    const categories = Array.isArray(yamlData.categories) ? yamlData.categories : [yamlData.categories];
    categories.forEach((category: string) => {
      newYamlLines.push(`  - "${category}"`);
    });
  }
  
  // 标签
  if (yamlData.tags) {
    newYamlLines.push('tags:');
    const tags = Array.isArray(yamlData.tags) ? yamlData.tags : [yamlData.tags];
    tags.forEach((tag: string) => {
      newYamlLines.push(`  - "${tag}"`);
    });
  }
  
  // 其他字段
  if (yamlData.published !== undefined) {
    newYamlLines.push(`published: ${yamlData.published}`);
  }
  if (yamlData.featured !== undefined) {
    newYamlLines.push(`featured: ${yamlData.featured}`);
  }
  if (yamlData.image) {
    newYamlLines.push(`image: "${yamlData.image}"`);
  }
  
  newYamlLines.push('---');
  
  return newYamlLines.join('\n') + '\n' + contentLines.join('\n');
}

async function syncPosts() {
  console.log('开始同步文章到数据库...');
  
  const db = await getDb();
  const cacheDb = await getCacheDb();
  
  // 初始化数据库
  await initDb(db);
  await initDb(cacheDb);
  
  // 开始事务
  await db.run('BEGIN TRANSACTION');
  await cacheDb.run('BEGIN TRANSACTION');
  
  try {
    // 递归读取所有 Markdown 文件
    async function processDirectory(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await processDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            // 读取文件内容
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // 修复 YAML 格式
            const fixedContent = fixYamlContent(content);
            
            // 解析 frontmatter
            const { data, content: markdownContent } = matter(fixedContent);
            
            // 获取父目录名作为分类
            const category = path.basename(path.dirname(fullPath));
            
            // 准备数据
            const postData = {
              title: data.title || '',
              slug: data.slug || entry.name.replace(/\.md$/, ''),
              content: markdownContent.trim(),
              excerpt: data.excerpt || '',
              published: data.published !== false,
              featured: data.featured === true,
              reading_time: calculateReadingTime(markdownContent),
              source_path: path.relative(CONTENT_DIR, fullPath),
              created_at: data.created_at || data.date || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              categories: JSON.stringify([category]),
              tags: JSON.stringify(Array.isArray(data.tags) ? data.tags : []),
              image: data.image || null
            };
            
            // 更新或插入文章
            const sql = `
              INSERT INTO posts (
                slug, title, content, excerpt, published, featured,
                reading_time, source_path, created_at, updated_at,
                categories, tags, image
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(slug) DO UPDATE SET
                title = excluded.title,
                content = excluded.content,
                excerpt = excluded.excerpt,
                published = excluded.published,
                featured = excluded.featured,
                reading_time = excluded.reading_time,
                source_path = excluded.source_path,
                updated_at = excluded.updated_at,
                categories = excluded.categories,
                tags = excluded.tags,
                image = excluded.image
            `;
            
            const params = [
              postData.slug,
              postData.title,
              postData.content,
              postData.excerpt,
              postData.published ? 1 : 0,
              postData.featured ? 1 : 0,
              postData.reading_time,
              postData.source_path,
              postData.created_at,
              postData.updated_at,
              postData.categories,
              postData.tags,
              postData.image
            ];
            
            // 同步到主数据库
            await db.run(sql, params);
            
            // 同步到缓存数据库
            await cacheDb.run(sql, params);
            
            // 写回修复后的文件
            fs.writeFileSync(fullPath, fixedContent);
            
            console.log(`处理文件: ${fullPath}`);
          } catch (error) {
            console.error(`处理文件 ${fullPath} 时出错:`, error);
          }
        }
      }
    }
    
    // 开始处理
    await processDirectory(CONTENT_DIR);
    
    // 提交事务
    await db.run('COMMIT');
    await cacheDb.run('COMMIT');
    
    console.log('同步完成！');
  } catch (error) {
    // 发生错误时回滚事务
    await db.run('ROLLBACK');
    await cacheDb.run('ROLLBACK');
    console.error('同步过程中出错:', error);
    throw error;
  } finally {
    // 关闭数据库连接
    await db.close();
    await cacheDb.close();
  }
}

// 执行同步
syncPosts().catch(console.error); 