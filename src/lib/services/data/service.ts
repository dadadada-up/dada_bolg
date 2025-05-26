/**
 * 统一数据服务实现
 * 
 * 使用Turso数据库
 */

import { Post, Category, Tag } from '@/types/post';
import { isVercelEnv } from '@/lib/db/env-config';
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
import { TursoDatabase } from '@/lib/db/turso-adapter';
import { Database } from '@/lib/db/types';
import { 
  getAggregateFunction, 
  safeParseJsonArray, 
  buildSafeQuery, 
  safeCoalesce 
} from './service-fixes';

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
  searchPosts(query: string, options: {
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
  
  // 同步数据（已废弃）
  syncToSQLite(): Promise<boolean>;
}

// 实际数据服务实现
export class DataServiceImpl implements DataService {
  private db: Database;
  private isVercel: boolean;

  constructor() {
    // 使用Turso数据库
    this.isVercel = isVercelEnv;
    this.db = new TursoDatabase();
  }

  // 将数据库文章结果转换为Post对象
  private mapDbPostToPost(dbPost: any): Post {
    if (!dbPost) return null;
    
    // 处理分类和标签
    let categories = [];
    let tags = [];
    
    try {
      // 使用安全解析函数处理分类和标签
      if (dbPost.categories_json) {
        categories = safeParseJsonArray(dbPost.categories_json);
      } else if (dbPost.categories_str) {
        categories = safeParseJsonArray(dbPost.categories_str);
      }
      
      if (dbPost.tags_json) {
        tags = safeParseJsonArray(dbPost.tags_json);
      } else if (dbPost.tags_str) {
        tags = safeParseJsonArray(dbPost.tags_str);
      }
    } catch (e) {
      console.error('解析分类或标签失败:', e);
    }
    
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
      categories: categories,
      tags: tags
    };
  }

  // 获取所有文章
  async getAllPosts(options?: {
    includeUnpublished?: boolean;
    limit?: number;
    offset?: number;
    category?: string;
    tag?: string;
  }): Promise<{
    posts: Post[];
    total: number;
  }> {
    try {
      // 确保数据库已初始化
      await this.ensureDbInitialized();

      console.log(`[DataService] 开始获取文章列表: ${JSON.stringify(options)}`);

      // 根据数据库类型选择不同的聚合函数
      const groupConcatFn = getAggregateFunction();

      // 构建SQL查询
      let sql = `
        SELECT 
          p.id, p.title, p.slug, p.content, p.excerpt, p.description, 
          p.is_published, p.is_featured, 
          p.image_url as imageUrl, p.created_at, p.updated_at,
          ${safeCoalesce(`COALESCE(${groupConcatFn}(DISTINCT c.name), '[]')`)} as categories_str,
          ${safeCoalesce(`COALESCE(${groupConcatFn}(DISTINCT t.name), '[]')`)} as tags_str
        FROM posts p
        LEFT JOIN post_categories pc ON p.id = pc.post_id
        LEFT JOIN categories c ON pc.category_id = c.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
      `;

      const whereConditions = [];
      const params: any[] = [];

      // 尝试检测表结构
      try {
        // 检查是否使用旧列名
        const postsColumns = await dbQuery("PRAGMA table_info(posts)");
        const columnNames = postsColumns.map((col: any) => col.name);
        console.log(`[DataService] 文章表列名: ${columnNames.join(', ')}`);
        
        // 根据表结构调整查询条件
        if (columnNames.includes('is_published')) {
          // 使用新列名is_published
          if (!options?.includeUnpublished) {
            whereConditions.push('p.is_published = 1');
          }
        } else if (columnNames.includes('published')) {
          // 使用旧列名published
          console.log('[DataService] 使用旧列名published');
          sql = sql.replace('p.is_published', 'p.published as is_published');
          if (!options?.includeUnpublished) {
            whereConditions.push('p.published = 1');
          }
        } else {
          // 如果两者都不存在，使用默认条件
          console.log('[DataService] 文章表缺少发布状态列，使用默认条件');
          if (!options?.includeUnpublished) {
            whereConditions.push('1=1'); // 始终为真的条件
          }
        }
        
        // 检查图片URL列名
        if (columnNames.includes('image_url')) {
          // 使用新列名image_url
        } else if (columnNames.includes('cover_image')) {
          // 使用旧列名cover_image
          console.log('[DataService] 使用旧列名cover_image');
          sql = sql.replace('p.image_url as imageUrl', 'p.cover_image as imageUrl');
        }
      } catch (columnError) {
        console.error('[DataService] 检查表结构失败:', columnError);
        // 使用默认查询
        if (!options?.includeUnpublished) {
          whereConditions.push('p.is_published = 1');
        }
      }

      // 分类筛选
      if (options?.category) {
        whereConditions.push('c.slug = ?');
        params.push(options.category);
      }

      // 标签筛选
      if (options?.tag) {
        whereConditions.push('t.slug = ?');
        params.push(options.tag);
      }

      // 添加WHERE条件
      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // 分组和排序
      sql += `
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;

      // 分页
      if (options?.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);

        if (options?.offset !== undefined) {
          sql += ' OFFSET ?';
          params.push(options.offset);
        }
      }

      console.log(`[DataService] 执行SQL查询: ${sql}`);
      console.log(`[DataService] 参数: ${params.join(', ')}`);

      // 执行查询
      const result = await dbQuery(sql, params);
      console.log(`[DataService] 查询结果数量: ${result.length}`);
      
      // 获取总数
      let total = result.length;
      if (options?.limit) {
        // 如果有分页，需要单独查询总数
        const countSql = `
          SELECT COUNT(DISTINCT p.id) as total
          FROM posts p
          LEFT JOIN post_categories pc ON p.id = pc.post_id
          LEFT JOIN categories c ON pc.category_id = c.id
          LEFT JOIN post_tags pt ON p.id = pt.post_id
          LEFT JOIN tags t ON pt.tag_id = t.id
        `;
        
        let countWhere = '';
        if (whereConditions.length > 0) {
          countWhere = ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        const countResult = await dbQueryOne(countSql + countWhere, params.slice(0, -2));
        total = countResult?.total || 0;
      }
      
      // 转换结果
      const posts = result.map(item => this.mapDbPostToPost(item));
      
      return {
        posts,
        total
      };
    } catch (error) {
      console.error('[DataService] 获取文章列表失败:', error);
      throw new Error(`获取文章列表失败: ${error.message || error}`);
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
        // 根据数据库类型选择不同的聚合函数
        const groupConcatFn = getAggregateFunction();
        
        const postSql = `
          SELECT 
            p.id, p.slug, p.title, p.content, p.excerpt, p.description,
            p.is_published, p.is_featured, 
            p.image_url as imageUrl, p.reading_time,
            p.created_at, p.updated_at,
            ${safeCoalesce(`COALESCE(
              (SELECT ${groupConcatFn}(c.name) FROM post_categories pc 
               JOIN categories c ON pc.category_id = c.id 
               WHERE pc.post_id = p.id),
              '[]'
            )`)} as categories_json,
            ${safeCoalesce(`COALESCE(
              (SELECT ${groupConcatFn}(t.name) FROM post_tags pt 
               JOIN tags t ON pt.tag_id = t.id 
               WHERE pt.post_id = p.id),
              '[]'
            )`)} as tags_json,
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
      return await this.ensureDbInitialized().then(() => {
        return this.db.all(`SELECT id, name, slug, description FROM categories ORDER BY name`);
      });
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
      return await this.ensureDbInitialized().then(() => {
        return this.db.all(`SELECT id, name, slug FROM tags ORDER BY name`);
      });
    } catch (error) {
      console.error(`[DataService] 获取标签失败:`, error);
      throw new Error(`获取标签失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 搜索文章
  async searchPosts(query: string, options: {
    limit?: number;
    offset?: number;
  }): Promise<{
    posts: Post[];
    total: number;
  }> {
    try {
      // 确保数据库已初始化
      await this.ensureDbInitialized();

      // 解构选项
      const { limit = 20, offset = 0 } = options;
      
      // 根据数据库类型选择不同的聚合函数
      const groupConcatFn = getAggregateFunction();

      // 构建搜索SQL
      const searchSql = `
        SELECT 
          p.id, p.slug, p.title, p.content, p.excerpt, p.description,
          p.is_published, p.is_featured, 
          p.image_url as imageUrl, p.reading_time,
          p.created_at, p.updated_at,
          ${safeCoalesce(`COALESCE(
            (SELECT ${groupConcatFn}(c.name) FROM post_categories pc 
             JOIN categories c ON pc.category_id = c.id 
             WHERE pc.post_id = p.id),
            '[]'
          )`)} as categories_json,
          ${safeCoalesce(`COALESCE(
            (SELECT ${groupConcatFn}(t.name) FROM post_tags pt 
             JOIN tags t ON pt.tag_id = t.id 
             WHERE pt.post_id = p.id),
            '[]'
          )`)} as tags_json,
          substr(p.created_at, 1, 10) as date
        FROM posts p
        WHERE p.is_published = 1
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
        WHERE p.is_published = 1
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

  // 同步到SQLite数据库（占位方法）
  async syncToSQLite(): Promise<boolean> {
    console.log('[DataService] syncToSQLite方法已废弃，项目现在只使用Turso数据库');
    return true;
  }

  // 确保数据库已初始化
  private async ensureDbInitialized(): Promise<void> {
    try {
      // 初始化数据库
      await initializeDatabase();
    } catch (error) {
      console.error('[DataService] 数据库初始化失败:', error);
      throw error;
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
              is_published = ?,
              is_featured = ?,
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
              is_published, is_featured, cover_image,
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
        'UPDATE posts SET is_published = ?, updated_at = ? WHERE id = ?',
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
        'UPDATE posts SET is_featured = ?, updated_at = ? WHERE id = ?',
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
}

// 创建数据服务实例
export function createDataService(): DataService {
  return new DataServiceImpl();
} 