import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getDb } from '../src/lib/db';
import { getCacheDb } from '../src/lib/cache';

async function importPosts() {
  try {
    console.log('开始导入文章...');
    
    // 获取数据库连接
    const db = await getDb();
    const cacheDb = await getCacheDb();
    
    // 读取文章文件
    const postsDir = path.join(process.cwd(), 'content', 'posts');
    const files = fs.readdirSync(postsDir, { recursive: true, encoding: 'utf-8' });
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const filePath = path.join(postsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, content: markdownContent } = matter(content);
      
      // 生成 slug
      const slug = file.replace(/\.md$/, '');
      
      // 转换日期格式
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        console.error(`无效的日期格式: ${data.date} in ${file}`);
        continue;
      }
      const createdAt = date.toISOString();
      const updatedAt = new Date().toISOString();
      
      // 转换布尔值
      const published = data.published !== false;
      const featured = data.featured === true;
      
      // 计算阅读时间（假设每分钟阅读 200 字）
      const readingTime = Math.ceil(markdownContent.length / 200);
      
      // 插入到主数据库
      await db.run(`
        INSERT INTO posts (
          slug, title, content, excerpt, description,
          published, featured, reading_time, original_file,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        slug,
        data.title,
        markdownContent,
        data.excerpt || null,
        data.description || null,
        published,
        featured,
        readingTime,
        file,
        createdAt,
        updatedAt
      ]);
      
      // 插入到缓存数据库
      await cacheDb.run(`
        INSERT INTO posts (
          slug, title, content, excerpt, description,
          published, featured, reading_time, original_file,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        slug,
        data.title,
        markdownContent,
        data.excerpt || null,
        data.description || null,
        published,
        featured,
        readingTime,
        file,
        createdAt,
        updatedAt
      ]);
      
      // 处理分类
      if (data.categories) {
        const categories = Array.isArray(data.categories) ? data.categories : [data.categories];
        for (const category of categories) {
          const categoryId = category.toLowerCase().replace(/\s+/g, '-');
          
          // 插入分类
          await db.run(`
            INSERT OR IGNORE INTO categories (id, name, slug)
            VALUES (?, ?, ?)
          `, [categoryId, category, categoryId]);
          
          await cacheDb.run(`
            INSERT OR IGNORE INTO categories (id, name, slug)
            VALUES (?, ?, ?)
          `, [categoryId, category, categoryId]);
          
          // 获取文章 ID
          const post = await db.get('SELECT id FROM posts WHERE slug = ?', [slug]);
          
          // 关联文章和分类
          await db.run(`
            INSERT INTO post_categories (post_id, category_id)
            VALUES (?, ?)
          `, [post.id, categoryId]);
          
          await cacheDb.run(`
            INSERT INTO post_categories (post_id, category_id)
            VALUES (?, ?)
          `, [post.id, categoryId]);
        }
      }
      
      // 处理标签
      if (data.tags) {
        const tags = Array.isArray(data.tags) ? data.tags : [data.tags];
        for (const tag of tags) {
          const tagId = tag.toLowerCase().replace(/\s+/g, '-');
          
          // 插入标签
          await db.run(`
            INSERT OR IGNORE INTO tags (id, name, slug)
            VALUES (?, ?, ?)
          `, [tagId, tag, tagId]);
          
          await cacheDb.run(`
            INSERT OR IGNORE INTO tags (id, name, slug)
            VALUES (?, ?, ?)
          `, [tagId, tag, tagId]);
          
          // 获取文章 ID
          const post = await db.get('SELECT id FROM posts WHERE slug = ?', [slug]);
          
          // 关联文章和标签
          await db.run(`
            INSERT INTO post_tags (post_id, tag_id)
            VALUES (?, ?)
          `, [post.id, tagId]);
          
          await cacheDb.run(`
            INSERT INTO post_tags (post_id, tag_id)
            VALUES (?, ?)
          `, [post.id, tagId]);
        }
      }
      
      console.log(`导入文章: ${slug}`);
    }
    
    console.log('文章导入完成！');
  } catch (error) {
    console.error('导入文章失败:', error);
    process.exit(1);
  }
}

importPosts(); 