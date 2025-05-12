import { getDb, generateId, getTimestamp } from './db';
import { Post } from '@/types/post';
import { getDisplayCategoryName } from './github-client';

// 添加必要的接口定义
interface DbPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  updated: string | null;
  content: string;
  excerpt: string;
  description: string | null;
  published: number;
  featured: number;
  cover_image: string | null;
  reading_time: number | null;
  original_file: string | null;
  created_at: number;
  updated_at: number;
}

interface SlugMapping {
  slug: string;
  post_id: string;
  is_primary: number;
}

interface CategoryEntry {
  id: string;
  name: string;
  slug: string;
}

interface TagEntry {
  id: string;
  name: string;
  slug: string;
}

interface CountResult {
  count: number;
}

// 自定义元数据类型，修复类型兼容性问题
interface PostMetadata {
  wordCount: number;
  readingTime: number;
  originalFile?: string;
}

// 保存文章到数据库
export async function savePost(post: Post): Promise<string> {
  const db = await getDb();
  const now = getTimestamp();
  
  try {
    // 生成文章ID (如果没有)
    const postId = (post as any).id || generateId();
    
    // 检查是否已存在
    const existingPost = await db.get('SELECT id FROM posts WHERE slug = ?', [post.slug]);
    
    if (existingPost) {
      // 更新已有文章
      await db.run(`
        UPDATE posts SET 
          title = ?, 
          date = ?, 
          updated = ?, 
          content = ?, 
          excerpt = ?, 
          description = ?, 
          published = ?, 
          featured = ?,
          cover_image = ?,
          reading_time = ?,
          original_file = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        post.title,
        post.date,
        post.updated || null,
        post.content,
        post.excerpt || '',
        post.description || '',
        post.published ? 1 : 0,
        post.featured ? 1 : 0,
        post.coverImage || null,
        post.readingTime || null,
        post.metadata?.originalFile || null,
        now,
        existingPost.id
      ]);
      
      // 使用现有文章ID
      const id = existingPost.id;
      
      // 处理分类和标签
      await updatePostCategories(id, post.categories || []);
      await updatePostTags(id, post.tags || []);
      
      return id;
    } else {
      // 插入新文章
      await db.run(`
        INSERT INTO posts (
          id, slug, title, date, updated, content, excerpt, description, 
          published, featured, cover_image, reading_time, original_file,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        postId,
        post.slug,
        post.title,
        post.date,
        post.updated || null,
        post.content,
        post.excerpt || '',
        post.description || '',
        post.published ? 1 : 0,
        post.featured ? 1 : 0,
        post.coverImage || null,
        post.readingTime || null,
        post.metadata?.originalFile || null,
        now,
        now
      ]);
      
      // 添加主slug映射
      await db.run('INSERT INTO slug_mapping (slug, post_id, is_primary) VALUES (?, ?, 1)', 
        [post.slug, postId]);
      
      // 添加slug变体映射
      await addSlugVariants(postId, post.slug);
      
      // 处理分类和标签
      await updatePostCategories(postId, post.categories || []);
      await updatePostTags(postId, post.tags || []);
      
      return postId;
    }
  } catch (error) {
    console.error(`[DB] 保存文章 ${post.slug} 失败:`, error);
    throw error;
  }
}

/**
 * 获取指定slug的文章（修复版本）
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const db = await getDb();
  
  try {
    // 查询文章基本信息
    const post = await db.get(`
      SELECT 
        p.id, p.slug, p.title, p.date, p.updated, p.content, p.excerpt, 
        p.description, p.published, p.featured, p.cover_image,
        p.reading_time, p.original_file, p.created_at, p.updated_at
      FROM posts p 
      WHERE p.slug = ?
    `, slug) as DbPost | undefined;

    if (!post) {
      return null;
    }

    // 查询文章分类
    const categoriesResult = await db.all(`
      SELECT c.slug 
      FROM categories c
      JOIN post_categories pc ON c.id = pc.category_id
      WHERE pc.post_id = ?
    `, post.id);
    const categories = categoriesResult.map((row) => row.slug);

    // 查询文章标签
    const tagsResult = await db.all(`
      SELECT t.name 
      FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ?
    `, post.id);
    const tags = tagsResult.map((row) => row.name);

    const published = post.published === 1;
    const featured = post.featured === 1;

    // 构建元数据对象
    const metadata: {
      wordCount: number;
      readingTime: number;
      originalFile?: string;
    } = {
      wordCount: post.content ? post.content.split(/\s+/).length : 0,
      readingTime: post.reading_time || 0,
    };

    if (post.original_file) {
      metadata.originalFile = post.original_file;
    }
    
    // 构造完整Post对象
    const result: Post = {
      slug: post.slug,
      title: post.title,
      date: post.date,
      updated: post.updated || undefined,
      content: post.content,
      excerpt: post.excerpt,
      description: post.description || undefined,
      categories,
      displayCategories: categories.map(category => getDisplayCategoryName(category)), // 添加中文分类名
      tags,
      published,
      featured,
      coverImage: post.cover_image || undefined,
      readingTime: post.reading_time || undefined,
      metadata
    };
    
    return result;
  } catch (error) {
    console.error(`[getPostBySlug] 获取文章失败(${slug}):`, error);
    return null;
  }
}

// 获取所有文章
export async function getAllPosts(options: {
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeUnpublished?: boolean;
} = {}): Promise<{ posts: Post[], total: number }> {
  const db = await getDb();
  const {
    limit = 100,
    offset = 0,
    category,
    tag,
    sortBy = 'created_at',
    sortOrder = 'desc',
    includeUnpublished = false
  } = options;
  
  // 构建查询条件
  let whereClause = includeUnpublished ? 'WHERE 1=1' : 'WHERE p.is_published = 1';
  const params: any[] = [];
  
  if (category) {
    whereClause += ' AND p.id IN (SELECT post_id FROM post_categories pc JOIN categories c ON pc.category_id = c.id WHERE c.name = ?)';
    params.push(category);
  }
  
  if (tag) {
    whereClause += ' AND p.id IN (SELECT post_id FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE t.name = ?)';
    params.push(tag);
  }
  
  // 构建排序条件
  const validSortFields = ['created_at', 'title', 'updated_at', 'published_at'];
  const orderBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
  
  // 获取总数
  const countQuery = `
    SELECT COUNT(*) as total FROM posts p ${whereClause}
  `;
  
  const countResult = await db.get(countQuery, ...params) as { total: number };
  const total = countResult?.total || 0;
  
  // 获取分页数据
  const query = `
    SELECT 
      p.id, p.slug, p.title, p.created_at, p.updated_at, p.content, 
      p.excerpt, p.description, p.is_published, p.is_featured,
      p.image_url as coverImage, p.reading_time as readingTime,
      p.source_path as originalFile
    FROM posts p
    ${whereClause}
    ORDER BY p.${orderBy} ${order}
    LIMIT ? OFFSET ?
  `;
  
  const posts = await db.all(query, ...params, limit, offset) as any[];
  
  // 处理每篇文章的分类和标签
  const result = [];
  
  for (const post of posts) {
    // 获取分类
    const categoryQuery = `
      SELECT c.name 
      FROM categories c
      JOIN post_categories pc ON c.id = pc.category_id
      WHERE pc.post_id = ?
    `;
    const categoriesResult = await db.all(categoryQuery, post.id);
    const categories = categoriesResult.map((c: any) => c.name) as string[];
    
    // 获取标签
    const tagQuery = `
      SELECT t.name 
      FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ?
    `;
    const tagsResult = await db.all(tagQuery, post.id);
    const tags = tagsResult.map((t: any) => t.name) as string[];
    
    // 构建元数据
    const metadata: any = {
      wordCount: estimateWordCount(post.content || ''),
      readingTime: post.readingTime || estimateReadingTime(post.content || '')
    };
    
    if (post.originalFile) {
      metadata.originalFile = post.originalFile;
    }
    
    // 构造完整Post对象
    result.push({
      slug: post.slug,
      title: post.title,
      date: post.created_at,
      updated: post.updated_at || undefined,
      content: post.content || '',
      excerpt: post.excerpt || '',
      description: post.description || undefined,
      categories,
      tags,
      published: !!post.is_published,
      featured: !!post.is_featured,
      coverImage: post.coverImage || undefined,
      readingTime: post.readingTime || undefined,
      metadata
    } as Post);
  }
  
  return { posts: result, total };
}

// 删除文章
export async function deletePost(slug: string): Promise<boolean> {
  const db = await getDb();
  
  try {
    // 查找文章ID
    const mapping = await db.get('SELECT post_id FROM slug_mapping WHERE slug = ?', [slug]);
    if (!mapping) return false;
    
    // 删除文章 (关联表会通过外键级联删除)
    const result = await db.run('DELETE FROM posts WHERE id = ?', [mapping.post_id]);
    return result.changes > 0;
  } catch (error) {
    console.error(`[DB] 删除文章 ${slug} 失败:`, error);
    return false;
  }
}

// 添加slug变体
async function addSlugVariants(postId: string, primarySlug: string): Promise<void> {
  const db = await getDb();
  
  // 如果slug包含hash (如 my-post-123abc)
  if (primarySlug.includes('-')) {
    // 尝试提取基础slug (不带hash部分)
    const parts = primarySlug.split('-');
    const lastPart = parts[parts.length - 1];
    
    // 如果最后一部分看起来像一个哈希 (纯字母数字且长度为8以内)
    if (/^[a-z0-9]{3,8}$/.test(lastPart)) {
      const baseSlug = parts.slice(0, -1).join('-');
      
      // 添加不带hash的slug变体
      try {
        await db.run(
          'INSERT INTO slug_mapping (slug, post_id, is_primary) VALUES (?, ?, 0)',
          [baseSlug, postId]
        );
      } catch (error) {
        // 可能已存在，忽略错误
        console.log(`[DB] 无法添加slug变体 ${baseSlug}:`, error);
      }
    }
  }
  
  // 为特定文章添加已知的变体 (如中文原始标题)
  if (primarySlug.includes('yi-wen-xiang-jie-fang-di-chan-tou-zi')) {
    try {
      await db.run(
        'INSERT INTO slug_mapping (slug, post_id, is_primary) VALUES (?, ?, 0)',
        ['一文详解房地产投资', postId]
      );
    } catch (error) {
      // 忽略错误
    }
  }
}

// 更新文章分类
async function updatePostCategories(postId: string, categories: string[]): Promise<void> {
  const db = await getDb();
  
  try {
    // 清除现有关联
    await db.run('DELETE FROM post_categories WHERE post_id = ?', [postId]);
    
    // 添加新关联
    for (const categoryName of categories) {
      // 查找或创建分类
      let category = await db.get('SELECT id FROM categories WHERE name = ?', [categoryName]);
      
      if (!category) {
        const categoryId = generateId();
        const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
        
        await db.run(
          'INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)',
          [categoryId, categoryName, slug]
        );
          
        category = { id: categoryId, name: categoryName, slug };
      }
      
      // 建立关联
      await db.run(
        'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
        [postId, category.id]
      );
    }
  } catch (error) {
    console.error(`[DB] 更新文章分类失败:`, error);
  }
}

// 更新文章标签
async function updatePostTags(postId: string, tags: string[]): Promise<void> {
  const db = await getDb();
  
  try {
    // 清除现有关联
    await db.run('DELETE FROM post_tags WHERE post_id = ?', [postId]);
    
    // 添加新关联
    for (const tagName of tags) {
      // 查找或创建标签
      let tag = await db.get('SELECT id FROM tags WHERE name = ?', [tagName]);
      
      if (!tag) {
        const tagId = generateId();
        const slug = tagName.toLowerCase().replace(/\s+/g, '-');
        
        await db.run(
          'INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)',
          [tagId, tagName, slug]
        );
          
        tag = { id: tagId, name: tagName, slug };
      }
      
      // 建立关联
      await db.run(
        'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
        [postId, tag.id]
      );
    }
  } catch (error) {
    console.error(`[DB] 更新文章标签失败:`, error);
  }
}

// 估算文章字数
function estimateWordCount(content: string): number {
  if (!content) return 0;
  
  // 去除markdown标记
  const cleanText = content.replace(/```[\s\S]*?```/g, '') // 代码块
                         .replace(/`.*?`/g, '') // 行内代码
                         .replace(/\[.*?\]\(.*?\)/g, '') // 链接
                         .replace(/\*\*.*?\*\*/g, '$1') // 粗体
                         .replace(/\*.*?\*/g, '$1') // 斜体
                         .replace(/#+\s/g, '') // 标题
                         .replace(/(?:^|\n)>[^\n]*/g, ''); // 引用
  
  // 按空白字符分割计算
  return cleanText.split(/\s+/).filter(Boolean).length;
}

// 估算阅读时间（分钟）
function estimateReadingTime(content: string): number {
  const wordCount = estimateWordCount(content);
  const wordsPerMinute = 200; // 假设平均阅读速度
  
  return Math.ceil(wordCount / wordsPerMinute) || 1; // 至少1分钟
} 