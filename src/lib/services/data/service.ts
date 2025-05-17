/**
 * 统一数据服务实现
 * 
 * 提供对数据库操作的实际实现，按照以下优先级尝试数据库连接：
 * 1. Turso云数据库
 * 2. 本地SQLite数据库
 */

import { Post } from '@/types/post';
import { isTursoEnabled } from '@/lib/db/turso-client-new';
import { query, queryOne, execute } from '@/lib/db/database';
import { initializeDatabase } from '@/lib/db/database';

// 数据服务接口定义
export interface DataService {
  // 获取所有文章
  getAllPosts(options?: {
    includeUnpublished?: boolean;
    limit?: number;
    offset?: number;
    category?: string;
    tag?: string;
  }): Promise<{
    posts: Post[];
    total: number;
  }>;

  // 根据slug获取单篇文章
  getPostBySlug(slug: string): Promise<Post | null>;

  // 获取所有分类
  getCategories(): Promise<Array<{
    id?: string;
    name: string;
    slug: string;
    description?: string;
  }>>;

  // 获取所有标签
  getTags(): Promise<Array<{
    id?: string;
    name: string;
    slug: string;
  }>>;

  // 搜索文章
  searchPosts(query: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    posts: Post[];
    total: number;
  }>;
}

// 实际数据服务实现
class DataServiceImpl implements DataService {
  private dbInitialized: boolean = false;

  // 初始化数据库连接
  private async ensureDbInitialized(): Promise<void> {
    if (!this.dbInitialized) {
      await initializeDatabase();
      this.dbInitialized = true;
    }
  }

  // 将数据库文章结果转换为Post对象
  private mapDbPostToPost(dbPost: any): Post {
    return {
      id: dbPost.id,
      slug: dbPost.slug,
      title: dbPost.title,
      content: dbPost.content,
      excerpt: dbPost.excerpt || dbPost.description,
      description: dbPost.description,
      is_published: !!dbPost.is_published,
      is_featured: !!dbPost.is_featured,
      imageUrl: dbPost.imageUrl,
      date: dbPost.date,
      created_at: dbPost.created_at,
      updated_at: dbPost.updated_at,
      categories: JSON.parse(dbPost.categories_json || '[]'),
      tags: JSON.parse(dbPost.tags_json || '[]')
    };
  }

  // 获取所有文章
  async getAllPosts(options: {
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
      // 确保数据库已初始化
      await this.ensureDbInitialized();

      // 解构选项
      const {
        includeUnpublished = false,
        limit = 100,
        offset = 0,
        category,
        tag
      } = options;

      // 构建基本SQL查询
      let sql = `
        SELECT 
          p.id, p.slug, p.title, p.content, p.excerpt, p.description,
          p.published as is_published, p.featured as is_featured, 
          p.cover_image as imageUrl, p.reading_time,
          p.created_at, p.updated_at,
          COALESCE(
            (SELECT json_group_array(c.name) FROM post_categories pc 
             JOIN categories c ON pc.category_id = c.id 
             WHERE pc.post_id = p.id),
            '[]'
          ) as categories_json,
          COALESCE(
            (SELECT json_group_array(t.name) FROM post_tags pt 
             JOIN tags t ON pt.tag_id = t.id 
             WHERE pt.post_id = p.id),
            '[]'
          ) as tags_json,
          substr(p.created_at, 1, 10) as date
        FROM posts p
        WHERE ` + (includeUnpublished ? '1=1' : 'p.published = 1');

      let countSql = `
        SELECT COUNT(*) as count
        FROM posts p
        WHERE ` + (includeUnpublished ? '1=1' : 'p.published = 1');

      const params: any[] = [];
      const countParams: any[] = [];

      // 添加分类筛选
      if (category) {
        sql += `
          AND EXISTS (
            SELECT 1 FROM post_categories pc 
            JOIN categories c ON pc.category_id = c.id 
            WHERE pc.post_id = p.id AND (c.name = ? OR c.slug = ?)
          )
        `;
        countSql += `
          AND EXISTS (
            SELECT 1 FROM post_categories pc 
            JOIN categories c ON pc.category_id = c.id 
            WHERE pc.post_id = p.id AND (c.name = ? OR c.slug = ?)
          )
        `;
        params.push(category, category);
        countParams.push(category, category);
      }

      // 添加标签筛选
      if (tag) {
        sql += `
          AND EXISTS (
            SELECT 1 FROM post_tags pt 
            JOIN tags t ON pt.tag_id = t.id 
            WHERE pt.post_id = p.id AND (t.name = ? OR t.slug = ?)
          )
        `;
        countSql += `
          AND EXISTS (
            SELECT 1 FROM post_tags pt 
            JOIN tags t ON pt.tag_id = t.id 
            WHERE pt.post_id = p.id AND (t.name = ? OR t.slug = ?)
          )
        `;
        params.push(tag, tag);
        countParams.push(tag, tag);
      }

      // 添加排序和分页
      sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      // 执行查询
      const dbPosts = await query(sql, params);
      const countResult = await queryOne(countSql, countParams);
      const total = countResult ? (countResult.count || 0) : 0;

      // 转换结果
      const posts = dbPosts.map((post) => this.mapDbPostToPost(post));

      return {
        posts,
        total
      };
    } catch (error) {
      console.error(`[DataService] 获取文章列表失败:`, error);
      throw new Error(`获取文章列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 根据slug获取单篇文章
  async getPostBySlug(slug: string): Promise<Post | null> {
    try {
      // 确保数据库已初始化
      await this.ensureDbInitialized();

      // 首先查询slug_mapping表，获取post_id
      const slugMapping = await queryOne(`
        SELECT post_id FROM slug_mapping 
        WHERE slug = ? 
        ORDER BY is_primary DESC 
        LIMIT 1
      `, [slug]);

      let postId: number | null = null;

      if (slugMapping && slugMapping.post_id) {
        postId = slugMapping.post_id;
        console.log(`[DataService] 找到slug映射: ${slug} -> post_id: ${postId}`);
      } else {
        // 如果在映射表中找不到，直接在posts表中查找
        const postIdQuery = await queryOne(`
          SELECT id FROM posts WHERE slug = ? LIMIT 1
        `, [slug]);

        if (postIdQuery && postIdQuery.id) {
          postId = postIdQuery.id;
          console.log(`[DataService] 在posts表中直接找到文章: ${slug}, id: ${postId}`);
        }
      }

      // 如果找到了post_id，获取完整文章信息
      if (postId) {
        const postSql = `
          SELECT 
            p.id, p.slug, p.title, p.content, p.excerpt, p.description,
            p.published as is_published, p.featured as is_featured, 
            p.cover_image as imageUrl, p.reading_time,
            p.created_at, p.updated_at,
            COALESCE(
              (SELECT json_group_array(c.name) FROM post_categories pc 
               JOIN categories c ON pc.category_id = c.id 
               WHERE pc.post_id = p.id),
              '[]'
            ) as categories_json,
            COALESCE(
              (SELECT json_group_array(t.name) FROM post_tags pt 
               JOIN tags t ON pt.tag_id = t.id 
               WHERE pt.post_id = p.id),
              '[]'
            ) as tags_json,
            substr(p.created_at, 1, 10) as date
          FROM posts p
          WHERE p.id = ?
        `;

        const dbPost = await queryOne(postSql, [postId]);

        if (dbPost) {
          return this.mapDbPostToPost(dbPost);
        }
      }

      return null;
    } catch (error) {
      console.error(`[DataService] 获取文章${slug}失败:`, error);
      throw new Error(`获取文章失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 获取所有分类
  async getCategories(): Promise<Array<{
    id?: string;
    name: string;
    slug: string;
    description?: string;
  }>> {
    try {
      // 确保数据库已初始化
      await this.ensureDbInitialized();

      // 从数据库获取分类
      const sql = `SELECT id, name, slug, description FROM categories ORDER BY name`;
      const dbCategories = await query(sql);

      return dbCategories;
    } catch (error) {
      console.error(`[DataService] 获取分类失败:`, error);
      throw new Error(`获取分类失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 获取所有标签
  async getTags(): Promise<Array<{
    id?: string;
    name: string;
    slug: string;
  }>> {
    try {
      // 确保数据库已初始化
      await this.ensureDbInitialized();

      // 从数据库获取标签
      const sql = `SELECT id, name, slug FROM tags ORDER BY name`;
      const dbTags = await query(sql);

      return dbTags;
    } catch (error) {
      console.error(`[DataService] 获取标签失败:`, error);
      throw new Error(`获取标签失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 搜索文章
  async searchPosts(query: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    posts: Post[];
    total: number;
  }> {
    try {
      // 确保数据库已初始化
      await this.ensureDbInitialized();

      // 解构选项
      const { limit = 20, offset = 0 } = options;

      // 构建搜索SQL
      const searchSql = `
        SELECT 
          p.id, p.slug, p.title, p.content, p.excerpt, p.description,
          p.published as is_published, p.featured as is_featured, 
          p.cover_image as imageUrl, p.reading_time,
          p.created_at, p.updated_at,
          COALESCE(
            (SELECT json_group_array(c.name) FROM post_categories pc 
             JOIN categories c ON pc.category_id = c.id 
             WHERE pc.post_id = p.id),
            '[]'
          ) as categories_json,
          COALESCE(
            (SELECT json_group_array(t.name) FROM post_tags pt 
             JOIN tags t ON pt.tag_id = t.id 
             WHERE pt.post_id = p.id),
            '[]'
          ) as tags_json,
          substr(p.created_at, 1, 10) as date
        FROM posts p
        WHERE p.published = 1
          AND (
            p.title LIKE ? OR
            p.content LIKE ? OR
            p.excerpt LIKE ? OR
            p.description LIKE ?
          )
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const countSql = `
        SELECT COUNT(*) as count
        FROM posts p
        WHERE p.published = 1
          AND (
            p.title LIKE ? OR
            p.content LIKE ? OR
            p.excerpt LIKE ? OR
            p.description LIKE ?
          )
      `;

      // 准备搜索参数
      const searchPattern = `%${query}%`;
      const searchParams = [
        searchPattern, searchPattern, searchPattern, searchPattern, 
        limit, offset
      ];
      const countParams = [
        searchPattern, searchPattern, searchPattern, searchPattern
      ];

      // 执行查询
      const dbPosts = await query(searchSql, searchParams);
      const countResult = await queryOne(countSql, countParams);
      const total = countResult ? (countResult.count || 0) : 0;

      // 转换结果
      const posts = dbPosts.map((post) => this.mapDbPostToPost(post));

      return {
        posts,
        total
      };
    } catch (error) {
      console.error(`[DataService] 搜索文章失败:`, error);
      throw new Error(`搜索文章失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

// 创建数据服务实例
export function createDataService(): DataService {
  console.log(`[DataService] 创建数据服务实例，Turso数据库${isTursoEnabled() ? '已启用' : '未启用'}`);
  return new DataServiceImpl();
} 