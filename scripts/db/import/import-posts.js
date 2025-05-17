const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function importPosts() {
  // 打开数据库连接
  const db = await open({
    filename: path.join(process.cwd(), 'data', 'blog.db'),
    driver: sqlite3.Database
  });

  // 获取所有文章文件
  const postsDir = path.join(process.cwd(), 'content', 'posts');
  const files = getAllFiles(postsDir);

  // 开始事务
  await db.run('BEGIN TRANSACTION');

  try {
    // 清空所有表
    await db.run('DELETE FROM post_tags');
    await db.run('DELETE FROM post_categories');
    await db.run('DELETE FROM tags');
    await db.run('DELETE FROM categories');
    await db.run('DELETE FROM posts');

    const processedSlugs = new Set();
    let importCount = 0;

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      try {
        const content = fs.readFileSync(file, 'utf-8');
        const { data: frontmatter, content: markdownContent } = matter(content);
        
        const relativePath = path.relative(postsDir, file);
        let slug = path.basename(file, '.md');

        // 如果slug已经存在，添加一个唯一标识符
        if (processedSlugs.has(slug)) {
          const uniqueId = Math.random().toString(36).substring(2, 8);
          slug = `${slug}-${uniqueId}`;
        }
        processedSlugs.add(slug);
        
        // 准备文章数据
        const postData = {
          slug,
          title: frontmatter.title || slug,
          content: markdownContent,
          published: frontmatter.published !== false,
          date: frontmatter.date ? new Date(frontmatter.date).toISOString() : new Date().toISOString(),
          updated: frontmatter.updated ? new Date(frontmatter.updated).toISOString() : new Date().toISOString(),
          featured: frontmatter.featured || false,
          cover_image: frontmatter.cover_image || null,
          source_path: relativePath,
          yaml_valid: true,
          manually_edited: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // 插入文章
        const result = await db.run(`
          INSERT INTO posts (
            slug, title, content, published, date, updated, 
            featured, cover_image, source_path, yaml_valid, 
            manually_edited, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          postData.slug,
          postData.title,
          postData.content,
          postData.published ? 1 : 0,
          postData.date,
          postData.updated,
          postData.featured ? 1 : 0,
          postData.cover_image,
          postData.source_path,
          postData.yaml_valid ? 1 : 0,
          postData.manually_edited ? 1 : 0,
          postData.created_at,
          postData.updated_at
        ]);

        const postId = result.lastID;

        // 处理分类
        if (frontmatter.categories) {
          const categories = Array.isArray(frontmatter.categories) 
            ? frontmatter.categories 
            : [frontmatter.categories];

          for (const categoryName of categories) {
            if (!categoryName) continue;
            
            // 插入分类
            const categorySlug = slugify(categoryName);
            await db.run(`
              INSERT OR IGNORE INTO categories (name, slug, created_at, updated_at)
              VALUES (?, ?, ?, ?)
            `, [categoryName, categorySlug, postData.created_at, postData.updated_at]);

            // 获取分类ID
            const category = await db.get('SELECT id FROM categories WHERE slug = ?', [categorySlug]);

            // 关联文章和分类
            if (category) {
              await db.run(`
                INSERT OR IGNORE INTO post_categories (post_id, category_id)
                VALUES (?, ?)
              `, [postId, category.id]);
            }
          }
        }

        // 处理标签
        if (frontmatter.tags) {
          const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags];

          for (const tagName of tags) {
            if (!tagName) continue;

            // 插入标签
            const tagSlug = slugify(tagName);
            await db.run(`
              INSERT OR IGNORE INTO tags (name, slug, created_at, updated_at)
              VALUES (?, ?, ?, ?)
            `, [tagName, tagSlug, postData.created_at, postData.updated_at]);

            // 获取标签ID
            const tag = await db.get('SELECT id FROM tags WHERE slug = ?', [tagSlug]);

            // 关联文章和标签
            if (tag) {
              await db.run(`
                INSERT OR IGNORE INTO post_tags (post_id, tag_id)
                VALUES (?, ?)
              `, [postId, tag.id]);
            }
          }
        }

        console.log(`Imported: ${relativePath}`);
        importCount++;
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }

    // 更新分类和标签的文章计数
    await db.run(`
      UPDATE categories 
      SET post_count = (
        SELECT COUNT(*) 
        FROM post_categories 
        WHERE post_categories.category_id = categories.id
      )
    `);

    await db.run(`
      UPDATE tags 
      SET post_count = (
        SELECT COUNT(*) 
        FROM post_tags 
        WHERE post_tags.tag_id = tags.id
      )
    `);

    // 提交事务
    await db.run('COMMIT');
    console.log(`Import completed successfully. Imported ${importCount} posts.`);

  } catch (error) {
    // 如果出错，回滚事务
    await db.run('ROLLBACK');
    console.error('Import failed:', error);
    throw error;
  } finally {
    // 关闭数据库连接
    await db.close();
  }
}

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath));
    } else {
      results.push(filePath);
    }
  });
  
  return results;
}

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

importPosts().catch(console.error); 