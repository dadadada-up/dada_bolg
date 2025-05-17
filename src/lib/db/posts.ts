/**
 * 文章数据库访问层
 */

import { Post } from '@/types/post';
import { query, queryOne, execute, getDatabase } from './database';

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
  is_published: number;
  is_featured: number;
  image_url: string | null;
  source_path: string | null;
}

/**
 * 保存文章到数据库
 */
export async function savePost(post: Post): Promise<string> {
  try {
    console.log(`[DB] 保存文章: ${post.slug}`);
    
    // 生成唯一ID
    const postId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const now = new Date().toISOString();
    
    // 检查文章是否已存在
    const existingPost = await queryOne<{id: string}>(`
      SELECT id FROM posts WHERE slug = ?
    `, [post.slug]);
    
    if (existingPost) {
      // 更新已有文章
      await execute(`
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
        post.description || null,
        post.published ? 1 : 0,
        post.featured ? 1 : 0,
        post.coverImage || null,
        post.readingTime || null,
        post.metadata?.originalFile || null,
        now,
        existingPost.id
      ]);
      
      return existingPost.id;
    }
    
    // 插入新文章
    await execute(`
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
      post.description || null,
      post.published ? 1 : 0,
      post.featured ? 1 : 0,
      post.coverImage || null,
      post.readingTime || null,
      post.metadata?.originalFile || null,
      now,
      now
    ]);
    
    return postId;
  } catch (error) {
    console.error(`[DB] 保存文章失败: ${post.slug}`, error);
    throw error;
  }
}

/**
 * 获取指定slug的文章
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const post = await queryOne<any>(`
      SELECT * FROM posts WHERE slug = ?
    `, [slug]);
    
    if (!post) {
      return null;
    }
    
    // 构造Post对象，使用正确的字段映射
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content || '',
      excerpt: post.excerpt || '',
      // 使用正确的字段名映射
      date: post.created_at || new Date().toISOString(), // 使用created_at而不是date
      updated: post.updated_at, // 使用updated_at而不是updated
      // 使用数据库中对应字段
      is_published: post.is_published === 1,
      is_featured: post.is_featured === 1,
      // 兼容旧字段
      published: post.is_published === 1,
      featured: post.is_featured === 1,
      // 使用image_url而不是cover_image
      coverImage: post.image_url || undefined,
      imageUrl: post.image_url || undefined,
      categories: [],  // 简化处理，不获取分类和标签
      tags: [],
      description: post.description || '',
      // 元数据
      metadata: {
        wordCount: post.content ? post.content.split(/\s+/).length : 0,
        readingTime: post.reading_time || 0,
        originalFile: post.source_path || '', // 使用source_path而不是original_file
      }
    };
  } catch (error) {
    console.error(`[DB] 获取文章失败: ${slug}`, error);
    return null;
  }
}

/**
 * 获取所有文章
 */
export async function getAllPosts(options: {
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeUnpublished?: boolean;
} = {}): Promise<{ posts: Post[], total: number }> {
  const {
    limit = 10,
    offset = 0,
    category,
    tag,
    sortBy = 'date',
    sortOrder = 'desc',
    includeUnpublished = false
  } = options;
  
  try {
    console.log(`[DB] 获取文章列表: limit=${limit}, offset=${offset}, category=${category}, tag=${tag}, sortBy=${sortBy}, sortOrder=${sortOrder}, includeUnpublished=${includeUnpublished}`);
    
    // 检查数据库连接
    const db = await getDatabase();
    console.log('[DB] 数据库连接成功');
    
    // 构建基本查询
    let sql = `SELECT * FROM posts`;
    let countSql = `SELECT COUNT(*) as total FROM posts`;
    
    // 构建WHERE条件
    const conditions = [];
    const params = [];
    
    // 只包含已发布文章 - 使用正确的字段名
    if (!includeUnpublished) {
      conditions.push(`is_published = 1`);
    }
    
    // 添加条件到SQL
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      sql += whereClause;
      countSql += whereClause;
    }
    
    // 添加排序 - 使用正确的字段名
    const validSortFields = ['created_at', 'updated_at', 'published_at', 'title'];
    const orderBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${orderBy} ${order}`;
    
    // 添加分页
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    console.log('[DB] 执行SQL查询统计:', countSql);
    
    // 获取总数
    const countResult = await queryOne<{total: number}>(countSql, []);
    const total = countResult?.total || 0;
    
    console.log(`[DB] 文章总数: ${total}`);
    
    // 如果没有结果，直接返回空数组
    if (total === 0) {
      console.log('[DB] 未找到文章记录');
      return { posts: [], total: 0 };
    }
    
    console.log('[DB] 执行文章查询:', sql, params);
    
    // 获取文章列表
    const postsData = await query<any>(sql, params);
    
    console.log(`[DB] 查询返回 ${postsData.length} 篇文章`);
    
    if (postsData.length === 0) {
      console.log('[DB] 查询返回空结果，但总数不为0，可能是分页参数问题');
      return { posts: [], total };
    }
    
    // 打印第一篇文章的详细信息
    if (postsData.length > 0) {
      console.log('[DB] 第一篇文章详情:', JSON.stringify(postsData[0]));
    }
    
    // 检查字段映射问题
    const firstPost = postsData[0];
    if (firstPost) {
      console.log('[DB] 字段检查:');
      console.log(`- slug: ${firstPost.slug}`);
      console.log(`- title: ${firstPost.title}`);
      console.log(`- date: ${firstPost.date}`);
      console.log(`- published: ${firstPost.published}`);
      console.log(`- excerpt: ${firstPost.excerpt?.substr(0, 50)}...`);
    }
    
    // 转换为Post对象
    const posts = postsData.map((post, index) => {
      // 在开发环境中详细记录处理过程
      if (process.env.NODE_ENV === 'development' && index < 2) {
        console.log(`[DB] 处理第${index+1}篇文章: ${post.slug}`);
      }
      
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content || '',
        excerpt: post.excerpt || '',
        date: post.created_at || new Date().toISOString(),
        updated: post.updated_at,
        is_published: post.is_published === 1,
        is_featured: post.is_featured === 1,
        published: post.is_published === 1,
        featured: post.is_featured === 1,
        coverImage: post.image_url || undefined,
        imageUrl: post.image_url || undefined,
        categories: [],
        tags: [],
        description: post.description || '',
        metadata: {
          wordCount: post.content ? post.content.split(/\s+/).length : 0,
          readingTime: post.reading_time || 0,
          originalFile: post.source_path || '',
        }
      };
    });
    
    console.log(`[DB] 成功处理并返回 ${posts.length} 篇文章`);
    
    return { posts, total };
  } catch (error) {
    console.error(`[DB] 获取文章列表失败:`, error);
    console.error('[DB] 错误详情:', error instanceof Error ? error.stack : '无堆栈信息');
    return { posts: [], total: 0 };
  }
}

/**
 * 删除文章
 */
export function deletePost(slug: string): boolean {
  try {
    execute(`DELETE FROM posts WHERE slug = ?`, [slug]);
    return true;
  } catch (error) {
    console.error(`[DB] 删除文章失败: ${slug}`, error);
    return false;
  }
} 