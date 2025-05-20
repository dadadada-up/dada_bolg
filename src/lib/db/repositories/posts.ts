import { Database } from 'sqlite';
import { getDb, getCurrentTimestamp } from '../index';
import { PostModel } from '../models';
import { Post } from '@/types/post';

/**
 * 文章数据库访问层
 */
export class PostRepository {
  /**
   * 创建文章
   */
  async createPost(post: Omit<PostModel, 'id'>): Promise<number> {
    try {
      console.log(`[PostRepo] 开始创建文章: ${post.slug}`);
      
      const db = await getDb();
      const now = getCurrentTimestamp();
      
      console.log(`[PostRepo] 参数准备: 标题="${post.title}", 已发布=${post.is_published}`);
      
      const result = await db.run(`
        INSERT INTO posts (
          slug, title, content, content_html, excerpt, description,
          is_published, is_featured, is_yaml_valid, is_manually_edited,
          reading_time, source_path, image_url, yuque_url,
          created_at, updated_at, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        post.slug,
        post.title,
        post.content || '',
        post.content_html || null,
        post.excerpt || '',
        post.description || '',
        post.is_published ? 1 : 0,
        post.is_featured ? 1 : 0,
        post.is_yaml_valid ? 1 : 0,
        post.is_manually_edited ? 1 : 0,
        post.reading_time || 0,
        post.source_path || null,
        post.image_url || null,
        post.yuque_url || null,
        post.created_at || now,
        post.updated_at || now,
        post.is_published ? (post.published_at || now) : null
      ]);
      
      console.log(`[PostRepo] 文章创建成功: ${post.slug}, ID=${result.lastID}`);
      return result.lastID!;
    } catch (error) {
      console.error(`[PostRepo] 创建文章失败: ${post.slug}`, error);
      console.error(`[PostRepo] 错误详情:`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
  
  /**
   * 更新文章
   */
  async updatePost(id: number, post: Partial<PostModel>): Promise<boolean> {
    const db = await getDb();
    const now = getCurrentTimestamp();
    
    // 构建更新字段
    const fields: string[] = [];
    const values: any[] = [];
    
    Object.entries(post).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        if (key === 'is_published' || key === 'is_featured' || key === 'is_yaml_valid' || key === 'is_manually_edited') {
          fields.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          values.push(value === undefined ? null : value);
        }
      }
    });
    
    // 添加更新时间
    fields.push('updated_at = ?');
    values.push(now);
    
    // 如果设置is_published=1，确保published_at有值
    if (post.is_published === true) {
      // 检查是否已经更新了published_at
      const publishedAtIndex = fields.findIndex(f => f.startsWith('published_at'));
      if (publishedAtIndex === -1) {
        // 首次发布，设置published_at
        fields.push('published_at = ?');
        values.push(now);
      }
    }
    
    // 添加ID作为条件
    values.push(id);
    
    const query = `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`;
    const result = await db.run(query, values);
    
    return result.changes! > 0;
  }
  
  /**
   * 更新文章内容
   */
  async updatePostContent(id: number, content: string): Promise<boolean> {
    const db = await getDb();
    const now = getCurrentTimestamp();
    
    const result = await db.run(`
      UPDATE posts 
      SET content = ?, updated_at = ? 
      WHERE id = ?
    `, [content, now, id]);
    
    return result.changes! > 0;
  }
  
  /**
   * 删除文章
   */
  async deletePost(id: number): Promise<boolean> {
    const db = await getDb();
    
    await db.run('DELETE FROM post_categories WHERE post_id = ?', [id]);
    await db.run('DELETE FROM post_tags WHERE post_id = ?', [id]);
    
    const result = await db.run('DELETE FROM posts WHERE id = ?', [id]);
    return result.changes! > 0;
  }
  
  /**
   * 根据slug获取文章
   */
  async getPostBySlug(slug: string): Promise<PostModel | null> {
    try {
      console.log(`[PostRepo] 开始获取文章: slug=${slug}`);
      
      const db = await getDb();
      
      const post = await db.get<PostModel>(`
        SELECT * FROM posts WHERE slug = ?
      `, [slug]);
      
      if (post) {
        console.log(`[PostRepo] 找到文章: slug=${slug}, id=${post.id}`);
      } else {
        console.log(`[PostRepo] 未找到文章: slug=${slug}`);
      }
      
      return post || null;
    } catch (error) {
      console.error(`[PostRepo] 获取文章失败: slug=${slug}`, error);
      console.error(`[PostRepo] 错误详情:`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
  
  /**
   * 获取文章总数
   */
  async getTotalPosts(options: { is_published?: boolean } = {}): Promise<number> {
    const db = await getDb();
    
    let query = 'SELECT COUNT(*) as count FROM posts';
    const params: any[] = [];
    
    if (options.is_published !== undefined) {
      query += ' WHERE is_published = ?';
      params.push(options.is_published ? 1 : 0);
    }
    
    const result = await db.get<{ count: number }>(query, params);
    return result?.count || 0;
  }
  
  /**
   * 获取文章列表
   */
  async getPosts(options: {
    page?: number;
    limit?: number;
    is_published?: boolean;
    is_featured?: boolean;
    category?: string;
    tag?: string;
    sort?: string;
  } = {}): Promise<{ posts: PostModel[], total: number }> {
    const db = await getDb();
    
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT p.* FROM posts p';
    let countQuery = 'SELECT COUNT(*) as count FROM posts p';
    
    const params: any[] = [];
    const countParams: any[] = [];
    
    const conditions: string[] = [];
    
    // 发布状态
    if (options.is_published !== undefined) {
      conditions.push('p.is_published = ?');
      params.push(options.is_published ? 1 : 0);
      countParams.push(options.is_published ? 1 : 0);
    }
    
    // 精选状态
    if (options.is_featured !== undefined) {
      conditions.push('p.is_featured = ?');
      params.push(options.is_featured ? 1 : 0);
      countParams.push(options.is_featured ? 1 : 0);
    }
    
    // 分类筛选
    if (options.category) {
      query = `
        SELECT p.* FROM posts p
        JOIN post_categories pc ON p.id = pc.post_id
        JOIN categories c ON pc.category_id = c.id
      `;
      countQuery = `
        SELECT COUNT(DISTINCT p.id) as count FROM posts p
        JOIN post_categories pc ON p.id = pc.post_id
        JOIN categories c ON pc.category_id = c.id
      `;
      
      conditions.push('c.slug = ?');
      params.push(options.category);
      countParams.push(options.category);
    }
    
    // 标签筛选
    if (options.tag) {
      query = `
        SELECT p.* FROM posts p
        JOIN post_tags pt ON p.id = pt.post_id
        JOIN tags t ON pt.tag_id = t.id
      `;
      countQuery = `
        SELECT COUNT(DISTINCT p.id) as count FROM posts p
        JOIN post_tags pt ON p.id = pt.post_id
        JOIN tags t ON pt.tag_id = t.id
      `;
      
      conditions.push('t.slug = ?');
      params.push(options.tag);
      countParams.push(options.tag);
    }
    
    // 添加条件到查询
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    // 排序
    const sortField = options.sort || '-created_at'; // 默认按创建时间倒序
    const sortDirection = sortField.startsWith('-') ? 'DESC' : 'ASC';
    const actualSortField = sortField.startsWith('-') ? sortField.substring(1) : sortField;
    
    const validSortFields = ['created_at', 'updated_at', 'published_at', 'title'];
    const finalSortField = validSortFields.includes(actualSortField) ? actualSortField : 'created_at';
    
    query += ` ORDER BY p.${finalSortField} ${sortDirection}`;
    
    // 分页
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    // 获取总数
    const countResult = await db.get<{ count: number }>(countQuery, countParams);
    const total = countResult?.count || 0;
    
    // 获取文章列表
    const posts = await db.all<PostModel>(query, params);
    
    return { posts, total };
  }
  
  /**
   * 将Post对象转换为PostModel
   */
  convertPostToModel(post: Post, yamlValid: boolean = true): Omit<PostModel, 'id'> {
    return {
      slug: post.slug,
      title: post.title,
      content: post.content || '',
      excerpt: post.excerpt || '',
      description: post.description || '',
      is_published: post.published !== false,
      is_featured: post.featured || false,
      is_yaml_valid: yamlValid,
      is_manually_edited: false,
      reading_time: post.readingTime || 0,
      source_path: post.metadata?.originalFile || undefined,
      image_url: post.coverImage || undefined,
      created_at: post.date,
      updated_at: post.updated || post.date,
      published_at: post.published !== false ? post.date : undefined,
    };
  }
  
  /**
   * 将PostModel转换为Post对象
   */
  async convertModelToPost(model: PostModel): Promise<Post> {
    const db = await getDb();
    
    interface CategoryResult {
      slug: string;
      name: string;
    }
    
    interface TagResult {
      name: string;
    }
    
    // 获取分类
    const categoriesResult = await db.all<CategoryResult>(`
      SELECT c.slug, c.name FROM categories c
      JOIN post_categories pc ON c.id = pc.category_id
      WHERE pc.post_id = ?
    `, [model.id]);
    
    const categories = categoriesResult.map((c) => c.slug);
    const displayCategories = categoriesResult.map((c) => c.name);
    
    // 获取标签
    const tagsResult = await db.all<TagResult>(`
      SELECT t.name FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ?
    `, [model.id]);
    
    const tags = tagsResult.map((t) => t.name);
    
    // 使用发布日期或创建日期
    const date = model.published_at || model.created_at || '';
    const updated = model.updated_at || date;
    
    return {
      slug: model.slug,
      title: model.title,
      content: model.content || '',
      excerpt: model.excerpt || '',
      description: model.description || '',
      date: date,
      updated: updated,
      categories,
      displayCategories,
      tags,
      published: model.is_published,
      featured: model.is_featured,
      coverImage: model.image_url || undefined,
      readingTime: model.reading_time || 0,
      metadata: {
        wordCount: model.content ? model.content.split(/\s+/).length : 0,
        readingTime: model.reading_time || 0,
        originalFile: model.source_path || '',
      },
    };
  }
}

/**
 * 获取所有文章
 * @param options 查询选项
 * @returns 文章数组和总数
 */
export async function getAllPosts(options: {
  includeUnpublished?: boolean;
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
} = {}): Promise<{
  posts: Post[];
  total: number;
}> {
  try {
    const repo = new PostRepository();
    const result = await repo.getPosts({
      limit: options.limit,
      page: options.offset ? Math.floor(options.offset / (options.limit || 10)) + 1 : 1,
      is_published: options.includeUnpublished ? undefined : true,
      category: options.category,
      tag: options.tag
    });
    
    // 转换为Post格式
    const posts: Post[] = [];
    for (const model of result.posts) {
      const post = await repo.convertModelToPost(model);
      posts.push(post);
    }
    
    return {
      posts,
      total: result.total
    };
  } catch (error) {
    console.error('[DB] 获取所有文章失败:', error);
    return { posts: [], total: 0 };
  }
}

/**
 * 根据slug获取单篇文章
 * @param slug 文章slug
 * @returns 文章对象或null
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const repo = new PostRepository();
    const model = await repo.getPostBySlug(slug);
    
    if (!model) return null;
    
    return await repo.convertModelToPost(model);
  } catch (error) {
    console.error(`[DB] 获取文章失败: ${slug}`, error);
    return null;
  }
}

/**
 * 删除文章
 * @param slug 文章slug
 * @returns 是否成功
 */
export async function deletePost(slug: string): Promise<boolean> {
  try {
    const repo = new PostRepository();
    const post = await repo.getPostBySlug(slug);
    
    if (!post) return false;
    
    return await repo.deletePost(post.id);
  } catch (error) {
    console.error(`[DB] 删除文章失败: ${slug}`, error);
    return false;
  }
} 