/**
 * 统一数据服务实现
 * 
 * 提供对数据库操作的实际实现，按照以下优先级尝试数据库连接：
 * 1. Turso云数据库
 * 2. 本地SQLite数据库
 */

import { Post } from '@/types/post';
import { isTursoEnabled } from '@/lib/db/turso-client-new';
import { 
  query as dbQuery, 
  queryOne as dbQueryOne, 
  execute as dbExecute, 
  initializeDatabase,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  withTransaction,
  getCurrentTimestamp
} from '@/lib/db/database';

// 数据服务接口定义
export interface DataService {
  // 查询操作
  // ----------------------------
  
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
  
  // 修改操作
  // ----------------------------
  
  // 创建或更新文章
  savePost(post: Post): Promise<{ id: number; slug: string }>;
  
  // 更新文章发布状态
  updatePostStatus(id: number, isPublished: boolean): Promise<boolean>;
  
  // 更新文章特色状态
  updatePostFeatured(id: number, isFeatured: boolean): Promise<boolean>;
  
  // 删除文章
  deletePost(id: number): Promise<boolean>;
  
  // 创建或更新分类
  saveCategory(category: { 
    id?: string | number; 
    name: string; 
    slug: string; 
    description?: string 
  }): Promise<{ id: number; slug: string }>;
  
  // 删除分类
  deleteCategory(id: number): Promise<boolean>;
  
  // 创建或更新标签
  saveTag(tag: { 
    id?: string | number; 
    name: string; 
    slug: string 
  }): Promise<{ id: number; slug: string }>;
  
  // 删除标签
  deleteTag(id: number): Promise<boolean>;
  
  // 同步数据到SQLite
  syncToSQLite(): Promise<boolean>;
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
      const dbPosts = await dbQuery(sql, params);
      const countResult = await dbQueryOne(countSql, countParams);
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
      const slugMapping = await dbQueryOne(`
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
        const postIdQuery = await dbQueryOne(`
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

        const dbPost = await dbQueryOne(postSql, [postId]);

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
      const dbCategories = await dbQuery(sql);

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
      const dbTags = await dbQuery(sql);

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
      const dbPosts = await dbQuery(searchSql, searchParams);
      const countResult = await dbQueryOne(countSql, countParams);
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

  // 创建或更新文章
  async savePost(post: Post): Promise<{ id: number; slug: string }> {
    try {
      await this.ensureDbInitialized();
      
      // 使用事务确保数据一致性
      return await withTransaction(async () => {
        const now = getCurrentTimestamp();
        let postId: number;
        
        // 确定是创建还是更新
        if (post.id) {
          // 更新文章
          const updateSql = `
            UPDATE posts SET
              title = ?,
              slug = ?,
              content = ?,
              excerpt = ?,
              description = ?,
              published = ?,
              featured = ?,
              cover_image = ?,
              updated_at = ?
            WHERE id = ?
          `;
          
          await dbExecute(updateSql, [
            post.title,
            post.slug,
            post.content,
            post.excerpt || null,
            post.description || null,
            post.is_published ? 1 : 0,
            post.is_featured ? 1 : 0,
            post.imageUrl || null,
            now,
            post.id
          ]);
          
          postId = Number(post.id);
          console.log(`[DataService] 更新文章, id = ${postId}`);
        } else {
          // 创建新文章
          const insertSql = `
            INSERT INTO posts (
              title, slug, content, excerpt, description,
              published, featured, cover_image,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          const result = await dbExecute(insertSql, [
            post.title,
            post.slug,
            post.content,
            post.excerpt || null,
            post.description || null,
            post.is_published ? 1 : 0,
            post.is_featured ? 1 : 0,
            post.imageUrl || null,
            now,
            now
          ]);
          
          // 获取插入的ID
          const idResult = await dbQueryOne('SELECT last_insert_rowid() as id');
          postId = idResult?.id;
          console.log(`[DataService] 创建新文章, id = ${postId}`);
          
          // 确保文章slug被映射
          await dbExecute(
            'INSERT INTO slug_mapping (post_id, slug, is_primary) VALUES (?, ?, 1)',
            [postId, post.slug]
          );
        }
        
        // 处理分类
        if (Array.isArray(post.categories)) {
          // 先删除现有关联
          await dbExecute('DELETE FROM post_categories WHERE post_id = ?', [postId]);
          
          // 添加新关联
          for (const categoryName of post.categories) {
            // 查找或创建分类
            let categoryId: number;
            const existingCategory = await dbQueryOne(
              'SELECT id FROM categories WHERE name = ?',
              [categoryName]
            );
            
            if (existingCategory) {
              categoryId = existingCategory.id;
            } else {
              // 创建新分类
              const slug = categoryName
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, '-');
                
              await dbExecute(
                'INSERT INTO categories (name, slug) VALUES (?, ?)',
                [categoryName, slug]
              );
              
              const newCategory = await dbQueryOne(
                'SELECT id FROM categories WHERE name = ?',
                [categoryName]
              );
              categoryId = newCategory.id;
            }
            
            // 添加关联
            await dbExecute(
              'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
              [postId, categoryId]
            );
          }
        }
        
        // 处理标签
        if (Array.isArray(post.tags)) {
          // 先删除现有关联
          await dbExecute('DELETE FROM post_tags WHERE post_id = ?', [postId]);
          
          // 添加新关联
          for (const tagName of post.tags) {
            // 查找或创建标签
            let tagId: number;
            const existingTag = await dbQueryOne(
              'SELECT id FROM tags WHERE name = ?',
              [tagName]
            );
            
            if (existingTag) {
              tagId = existingTag.id;
            } else {
              // 创建新标签
              const slug = tagName
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, '-');
                
              await dbExecute(
                'INSERT INTO tags (name, slug) VALUES (?, ?)',
                [tagName, slug]
              );
              
              const newTag = await dbQueryOne(
                'SELECT id FROM tags WHERE name = ?',
                [tagName]
              );
              tagId = newTag.id;
            }
            
            // 添加关联
            await dbExecute(
              'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
              [postId, tagId]
            );
          }
        }
        
        return { id: postId, slug: post.slug };
      });
    } catch (error) {
      console.error(`[DataService] 保存文章失败:`, error);
      throw new Error(`保存文章失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  // 更新文章发布状态
  async updatePostStatus(id: number, isPublished: boolean): Promise<boolean> {
    try {
      await this.ensureDbInitialized();
      
      const result = await dbExecute(
        'UPDATE posts SET published = ?, updated_at = ? WHERE id = ?',
        [isPublished ? 1 : 0, getCurrentTimestamp(), id]
      );
      
      return result > 0;
    } catch (error) {
      console.error(`[DataService] 更新文章状态失败:`, error);
      throw new Error(`更新文章状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  // 更新文章特色状态
  async updatePostFeatured(id: number, isFeatured: boolean): Promise<boolean> {
    try {
      await this.ensureDbInitialized();
      
      const result = await dbExecute(
        'UPDATE posts SET featured = ?, updated_at = ? WHERE id = ?',
        [isFeatured ? 1 : 0, getCurrentTimestamp(), id]
      );
      
      return result > 0;
    } catch (error) {
      console.error(`[DataService] 更新文章特色状态失败:`, error);
      throw new Error(`更新文章特色状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  // 删除文章
  async deletePost(id: number): Promise<boolean> {
    try {
      await this.ensureDbInitialized();
      
      return await withTransaction(async () => {
        // 删除相关的标签和分类关联
        await dbExecute('DELETE FROM post_tags WHERE post_id = ?', [id]);
        await dbExecute('DELETE FROM post_categories WHERE post_id = ?', [id]);
        
        // 删除slug映射
        await dbExecute('DELETE FROM slug_mapping WHERE post_id = ?', [id]);
        
        // 删除文章
        const result = await dbExecute('DELETE FROM posts WHERE id = ?', [id]);
        
        return result > 0;
      });
    } catch (error) {
      console.error(`[DataService] 删除文章失败:`, error);
      throw new Error(`删除文章失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  // 创建或更新分类
  async saveCategory(category: {
    id?: string | number;
    name: string;
    slug: string;
    description?: string;
  }): Promise<{ id: number; slug: string }> {
    try {
      await this.ensureDbInitialized();
      
      if (category.id) {
        // 更新分类
        await dbExecute(
          'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
          [category.name, category.slug, category.description || null, category.id]
        );
        
        return { id: Number(category.id), slug: category.slug };
      } else {
        // 创建分类
        await dbExecute(
          'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
          [category.name, category.slug, category.description || null]
        );
        
        const result = await dbQueryOne('SELECT last_insert_rowid() as id');
        const id = result?.id;
        
        return { id, slug: category.slug };
      }
    } catch (error) {
      console.error(`[DataService] 保存分类失败:`, error);
      throw new Error(`保存分类失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  // 删除分类
  async deleteCategory(id: number): Promise<boolean> {
    try {
      await this.ensureDbInitialized();
      
      return await withTransaction(async () => {
        // 删除分类关联
        await dbExecute('DELETE FROM post_categories WHERE category_id = ?', [id]);
        
        // 删除分类
        const result = await dbExecute('DELETE FROM categories WHERE id = ?', [id]);
        
        return result > 0;
      });
    } catch (error) {
      console.error(`[DataService] 删除分类失败:`, error);
      throw new Error(`删除分类失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  // 创建或更新标签
  async saveTag(tag: {
    id?: string | number;
    name: string;
    slug: string;
  }): Promise<{ id: number; slug: string }> {
    try {
      await this.ensureDbInitialized();
      
      if (tag.id) {
        // 更新标签
        await dbExecute(
          'UPDATE tags SET name = ?, slug = ? WHERE id = ?',
          [tag.name, tag.slug, tag.id]
        );
        
        return { id: Number(tag.id), slug: tag.slug };
      } else {
        // 创建标签
        await dbExecute(
          'INSERT INTO tags (name, slug) VALUES (?, ?)',
          [tag.name, tag.slug]
        );
        
        const result = await dbQueryOne('SELECT last_insert_rowid() as id');
        const id = result?.id;
        
        return { id, slug: tag.slug };
      }
    } catch (error) {
      console.error(`[DataService] 保存标签失败:`, error);
      throw new Error(`保存标签失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  // 删除标签
  async deleteTag(id: number): Promise<boolean> {
    try {
      await this.ensureDbInitialized();
      
      return await withTransaction(async () => {
        // 删除标签关联
        await dbExecute('DELETE FROM post_tags WHERE tag_id = ?', [id]);
        
        // 删除标签
        const result = await dbExecute('DELETE FROM tags WHERE id = ?', [id]);
        
        return result > 0;
      });
    } catch (error) {
      console.error(`[DataService] 删除标签失败:`, error);
      throw new Error(`删除标签失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  // 从Turso同步数据到SQLite
  async syncToSQLite(): Promise<boolean> {
    // 只在开发环境并且Turso启用时执行同步
    if (process.env.NODE_ENV === 'production' || !isTursoEnabled()) {
      console.log('[DataService] 跳过同步，当前环境不需要同步');
      return false;
    }
    
    try {
      console.log('[DataService] 开始同步数据从Turso到SQLite');
      
      // 调用同步模块执行同步
      const { syncFromTursoToSQLite } = require('./sync');
      
      // 所有选项默认为true
      const options = {
        categories: true,
        tags: true,
        posts: true,
        postCategories: true,
        postTags: true,
        slugMappings: true
      };
      
      const result = await syncFromTursoToSQLite(options);
      
      if (result) {
        console.log('[DataService] 同步完成');
      } else {
        console.log('[DataService] 同步失败');
      }
      
      return result;
    } catch (error) {
      console.error('[DataService] 同步数据失败:', error);
      return false;
    }
  }
}

// 创建数据服务实例
export function createDataService(): DataService {
  console.log(`[DataService] 创建数据服务实例，Turso数据库${isTursoEnabled() ? '已启用' : '未启用'}`);
  return new DataServiceImpl();
} 