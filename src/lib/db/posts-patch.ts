import { getDb, generateId, getTimestamp } from './db';
import { Post } from '@/types/post';
import { enhancedSlugify } from './utils';

/**
 * 安全添加slug变体函数，处理冲突情况
 */
export function addSlugVariantsSafe(db: any, postId: string, slug: string, isPrimary: boolean = false): void {
  try {
    // 检查参数有效性
    if (!postId || !slug) {
      console.error('[DB] 无效的参数:', { postId, slug });
      return;
    }
    
    db.transaction(() => {
      const existingMapping = db.get('SELECT * FROM slug_mapping WHERE slug = ?', slug);
      
      if (existingMapping && typeof existingMapping === 'object' && 'post_id' in existingMapping) {
        // 如果已经存在但指向的不是当前文章，且是主slug，则无法添加
        if (existingMapping.post_id !== postId && isPrimary) {
          throw new Error(`无法将${slug}设为主Slug，因为它已经映射到另一篇文章`);
        }
        
        // 如果已经存在且指向的是当前文章，进行更新
        if (existingMapping.post_id === postId) {
          db.prepare('UPDATE slug_mapping SET is_primary = ? WHERE slug = ?').run(isPrimary ? 1 : 0, slug);
          return;
        }
        
        // 如果已经存在且指向其他文章，且不是主slug，忽略
        if (existingMapping.post_id !== postId && !isPrimary) {
          console.warn(`警告: 无法添加slug变体${slug}，它已经映射到另一篇文章`);
          return;
        }
      }
      
      // 如果不存在，创建新的映射
      db.prepare('INSERT INTO slug_mapping (slug, post_id, is_primary) VALUES (?, ?, ?)')
        .run(slug, postId, isPrimary ? 1 : 0);
      
      console.log(`[DB] 添加slug映射: ${slug} → ${postId} (主要: ${isPrimary})`);
    })();
  } catch (error) {
    console.error(`[DB] 添加slug变体失败: ${slug}`, error);
  }
}

/**
 * 安全保存文章函数
 */
export function savePostSafe(post: Post): string {
  if (!post.title || !post.content) {
    throw new Error('文章缺少必要字段: title或content');
  }
  
  const db = getDb();
  
  // 首先尝试通过slug获取现有文章
  const existingPost = db.get('SELECT id FROM posts WHERE slug = ?', post.slug);
  
  // 如果已存在，使用更新逻辑
  if (existingPost && typeof existingPost === 'object' && 'id' in existingPost) {
    return updateExistingPost(post);
  }
  
  // 否则创建新文章
  try {
    return db.transaction((post: Post) => {
      // 生成ID和时间戳
      const id = generateId();
      const timestamp = getTimestamp();
      
      // 插入文章
      db.prepare(`
        INSERT INTO posts (
          id, slug, title, date, updated, content, excerpt, description,
          published, featured, cover_image, reading_time, original_file,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        post.slug,
        post.title,
        post.date,
        post.updated || null,
        post.content,
        post.excerpt || '',
        post.description || null,
        post.published ? 1 : 0,
        post.featured ? 1 : 0,
        post.coverImage || null,
        post.readingTime || null,
        post.metadata?.originalFile || null,
        timestamp,
        timestamp
      );
      
      // 添加slug变体
      const slugVariants = generateSlugVariants(post.title, post.slug);
      
      for (let i = 0; i < slugVariants.length; i++) {
        const variant = slugVariants[i];
        const isPrimary = i === 0; // 第一个变体是主要slug
        
        try {
          addSlugVariantsSafe(db, id, variant, isPrimary);
        } catch (error) {
          console.error(`[DB] 添加slug变体 ${variant} 失败:`, error);
        }
      }
      
      // 添加分类关联
      if (post.categories && post.categories.length > 0) {
        for (const category of post.categories) {
          // 获取或创建分类
          const categorySlug = enhancedSlugify(category);
          const categoryResult = db.get('SELECT id FROM categories WHERE slug = ?', categorySlug);
          let categoryId = categoryResult && typeof categoryResult === 'object' && 'id' in categoryResult ? categoryResult.id as string : null;
          
          if (!categoryId) {
            categoryId = generateId();
            db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)')
              .run(categoryId, category, categorySlug);
          }
          
          // 添加文章-分类关联
          db.prepare('INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)')
            .run(id, categoryId);
        }
      }
      
      // 添加标签关联
      if (post.tags && post.tags.length > 0) {
        for (const tag of post.tags) {
          // 获取或创建标签
          const tagSlug = enhancedSlugify(tag);
          const tagResult = db.get('SELECT id FROM tags WHERE slug = ?', tagSlug);
          let tagId = tagResult && typeof tagResult === 'object' && 'id' in tagResult ? tagResult.id as string : null;
          
          if (!tagId) {
            tagId = generateId();
            db.prepare('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)')
              .run(tagId, tag, tagSlug);
          }
          
          // 添加文章-标签关联
          db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)')
            .run(id, tagId);
        }
      }
      
      console.log(`[DB] 成功添加文章 ${post.title} (${post.slug}) 到数据库`);
      return id;
    })(post) as string;
  } catch (error) {
    // 如果是主键约束错误，可能是并发问题，尝试更新现有文章
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      console.warn(`[DB] 文章 ${post.slug} 在插入过程中出现主键冲突，尝试更新现有文章`);
      return updateExistingPost(post);
    }
    
    console.error(`[DB] 保存文章 ${post.slug} 失败:`, error);
    throw error;
  }
}

/**
 * 更新现有文章
 */
function updateExistingPost(post: Post): string {
  const db = getDb();
  
  try {
    return db.transaction((post: Post) => {
      // 获取现有文章ID
      const existingPostResult = db.get('SELECT id FROM posts WHERE slug = ?', post.slug);
      
      if (!existingPostResult || typeof existingPostResult !== 'object' || !('id' in existingPostResult)) {
        throw new Error(`找不到Slug为${post.slug}的文章`);
      }
      
      const id = existingPostResult.id as string;
      const timestamp = getTimestamp();
      
      // 更新文章
      db.prepare(`
        UPDATE posts 
        SET title = ?, date = ?, updated = ?, content = ?, excerpt = ?, 
            description = ?, published = ?, featured = ?, cover_image = ?, 
            reading_time = ?, updated_at = ?
        WHERE id = ?
      `).run(
        post.title,
        post.date,
        post.updated || null,
        post.content,
        post.excerpt || '',
        post.description || null,
        post.published ? 1 : 0,
        post.featured ? 1 : 0,
        post.coverImage || null,
        post.readingTime || null,
        timestamp,
        id
      );
      
      // 清除之前的分类关联
      db.prepare('DELETE FROM post_categories WHERE post_id = ?').run(id);
      
      // 重新添加分类
      if (post.categories && post.categories.length > 0) {
        for (const category of post.categories) {
          // 获取或创建分类
          const categorySlug = enhancedSlugify(category);
          const categoryResult = db.get('SELECT id FROM categories WHERE slug = ?', categorySlug);
          let categoryId = categoryResult && typeof categoryResult === 'object' && 'id' in categoryResult ? categoryResult.id as string : null;
          
          if (!categoryId) {
            categoryId = generateId();
            db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)')
              .run(categoryId, category, categorySlug);
          }
          
          // 关联文章和分类
          db.prepare('INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)')
            .run(id, categoryId);
        }
      }
      
      // 清除之前的标签关联
      db.prepare('DELETE FROM post_tags WHERE post_id = ?').run(id);
      
      // 重新添加标签
      if (post.tags && post.tags.length > 0) {
        for (const tag of post.tags) {
          // 获取或创建标签
          const tagSlug = enhancedSlugify(tag);
          const tagResult = db.get('SELECT id FROM tags WHERE slug = ?', tagSlug);
          let tagId = tagResult && typeof tagResult === 'object' && 'id' in tagResult ? tagResult.id as string : null;
          
          if (!tagId) {
            tagId = generateId();
            db.prepare('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)')
              .run(tagId, tag, tagSlug);
          }
          
          // 关联文章和标签
          db.prepare('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)')
            .run(id, tagId);
        }
      }
      
      console.log(`[DB] 成功更新文章 ${post.slug} (ID: ${id})`);
      return id;
    })(post) as string;
  } catch (error) {
    console.error(`[DB] 更新文章 ${post.slug} 失败:`, error);
    throw error;
  }
}

/**
 * 生成slug变体
 */
function generateSlugVariants(title: string, primarySlug: string): string[] {
  const variants = new Set<string>();
  
  // 添加主slug
  variants.add(primarySlug);
  
  // 从标题生成标准slug
  const standardSlug = enhancedSlugify(title);
  variants.add(standardSlug);
  
  // 生成不同长度的slug变体
  const maxLengths = [30, 50, 80];
  for (const maxLength of maxLengths) {
    const variant = enhancedSlugify(title, { maxLength });
    variants.add(variant);
  }
  
  // 移除空字符串和重复项
  return Array.from(variants).filter(Boolean);
}

/**
 * 临时修复：直接从数据库获取文章
 */
export async function getPostBySqlite(slug: string): Promise<Post | null> {
  try {
    const db = await getDb();
    
    // 直接使用SQL查询获取文章基本信息，修正列名匹配数据库表结构
    const postData = await db.get(`
      SELECT 
        p.id, p.slug, p.title, p.content, p.excerpt, 
        p.description, p.is_published, p.is_featured, p.image_url,
        p.reading_time, p.source_path, p.created_at, p.updated_at, p.published_at
      FROM posts p 
      WHERE p.slug = ?
    `, slug);
    
    if (!postData) {
      return null;
    }
    
    // 查询文章分类
    const categoriesResult = await db.all(`
      SELECT c.slug 
      FROM categories c
      JOIN post_categories pc ON c.id = pc.category_id
      WHERE pc.post_id = ?
    `, postData.id);
    const categories = categoriesResult.map((row: any) => row.slug);
    
    // 查询文章标签
    const tagsResult = await db.all(`
      SELECT t.name 
      FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ?
    `, postData.id);
    const tags = tagsResult.map((row: any) => row.name);
    
    // 构建完整Post对象，映射表字段到Post对象属性
    const post: Post = {
      slug: postData.slug,
      title: postData.title,
      date: postData.created_at || postData.published_at || new Date().toISOString(),
      updated: postData.updated_at || undefined,
      content: postData.content || '',
      excerpt: postData.excerpt || '',
      description: postData.description || undefined,
      categories,
      tags,
      published: postData.is_published === 1,
      featured: postData.is_featured === 1,
      coverImage: postData.image_url || undefined,
      readingTime: postData.reading_time || undefined,
      metadata: {
        wordCount: postData.content ? postData.content.split(/\s+/).length : 0,
        readingTime: postData.reading_time || 0,
        originalFile: postData.source_path || undefined
      }
    };
    
    return post;
  } catch (error) {
    console.error(`[getPostBySqlite] 获取文章失败(${slug}):`, error);
    return null;
  }
}