import { getPosts } from '@/lib/github';
import { PostRepository } from '../repositories/posts';
import { CategoryRepository } from '../repositories/categories';
import { TagRepository } from '../repositories/tags';
import { PostCategoryRepository } from '../repositories/post-categories';
import { PostTagRepository } from '../repositories/post-tags';
import { getDb } from '..';

/**
 * 同步服务
 */
export class SyncService {
  private postRepo: PostRepository;
  private categoryRepo: CategoryRepository;
  private tagRepo: TagRepository;
  private postCategoryRepo: PostCategoryRepository;
  private postTagRepo: PostTagRepository;
  
  constructor() {
    this.postRepo = new PostRepository();
    this.categoryRepo = new CategoryRepository();
    this.tagRepo = new TagRepository();
    this.postCategoryRepo = new PostCategoryRepository();
    this.postTagRepo = new PostTagRepository();
  }
  
  /**
   * 同步所有文章
   */
  async syncAllPosts(): Promise<{ total: number; created: number; updated: number; failed: number; }> {
    const result = {
      total: 0,
      created: 0,
      updated: 0,
      failed: 0
    };
    
    try {
      // 从GitHub获取所有文章
      console.log('[同步] 开始从GitHub获取文章...');
      const githubPosts = await getPosts();
      result.total = githubPosts.length;
      console.log(`[同步] 获取到 ${githubPosts.length} 篇文章`);
      
      // 获取数据库连接
      const db = await getDb();
      console.log('[同步] 成功获取数据库连接');
      
      // 开始事务
      await db.run('BEGIN TRANSACTION');
      console.log('[同步] 开始数据库事务');
      
      try {
        // 检查表结构
        const columnsToCheck = [
          'id', 'slug', 'title', 'content', 'excerpt', 'published', 
          'date', 'updated', 'featured', 'yaml_valid', 'manually_edited', 
          'created_at', 'updated_at'
        ];
        const existingColumns: string[] = [];
        
        console.log('[同步] 检查posts表结构');
        for (const column of columnsToCheck) {
          try {
            await db.exec(`SELECT ${column} FROM posts LIMIT 0`);
            existingColumns.push(column);
          } catch (error) {
            // 列不存在，跳过
          }
        }
        console.log(`[同步] 检测到的列: ${existingColumns.join(', ')}`);
        
        // 处理每篇文章
        for (const post of githubPosts) {
          try {
            console.log(`[同步] 开始处理文章: ${post.slug}`);
            
            // 检查文章是否存在
            console.log(`[同步] 检查文章是否存在: ${post.slug}`);
            
            const checkResult = await db.run(
              `SELECT id, manually_edited FROM posts WHERE slug = ?`,
              [post.slug]
            );
            
            // 文章模型和YAML解析状态
            const yamlValid = Boolean(post.categories && post.categories.length > 0 && post.title && post.date);
            console.log(`[同步] 文章YAML解析状态: ${yamlValid ? '有效' : '无效'}`);
            
            // 直接创建需要的字段变量
            const now = new Date().toISOString();
            const columnValues: Record<string, any> = {
              slug: post.slug,
              title: post.title || '',
              content: post.content || '',
              excerpt: post.excerpt || '',
              published: post.published !== false ? 1 : 0,
              date: post.date || now,
              updated: post.updated || post.date || now,
              featured: post.featured ? 1 : 0,
              created_at: now,
              updated_at: now
            };
            
            // 如果存在yaml_valid列，添加值
            if (existingColumns.includes('yaml_valid')) {
              columnValues.yaml_valid = yamlValid ? 1 : 0;
            }
            
            // 如果存在manually_edited列，添加值
            if (existingColumns.includes('manually_edited')) {
              columnValues.manually_edited = 0;
            }
            
            // 文章ID
            let postId: number;
            
            // 文章是否存在
            if (checkResult && checkResult.changes && checkResult.changes > 0) {
              const existingPost = await this.postRepo.getPostBySlug(post.slug);
              
              if (existingPost && existingPost.manually_edited) {
                // 只更新内容，保留其他元数据
                console.log(`[同步] 文章已手动编辑，仅更新内容: ${post.slug}`);
                await this.postRepo.updatePostContent(existingPost.id!, post.content || '');
                postId = existingPost.id!;
                result.updated++;
              } else {
                // 完整更新文章 - 动态构建SQL
                console.log(`[同步] 更新现有文章: ${post.slug}`);
                
                // 构建SET子句
                const setClause: string[] = [];
                const values: any[] = [];
                
                for (const [column, value] of Object.entries(columnValues)) {
                  if (existingColumns.includes(column)) {
                    setClause.push(`${column} = ?`);
                    values.push(value);
                  }
                }
                
                values.push(existingPost?.id);
                
                // 更新文章
                await db.run(
                  `UPDATE posts SET ${setClause.join(', ')} WHERE id = ?`,
                  values
                );
                
                postId = existingPost!.id!;
                result.updated++;
              }
            } else {
              // 创建新文章 - 动态构建SQL
              console.log(`[同步] 创建新文章: ${post.slug}`);
              
              // 构建新文章SQL
              const columns: string[] = [];
              const placeholders: string[] = [];
              const values: any[] = [];
              
              for (const [column, value] of Object.entries(columnValues)) {
                if (existingColumns.includes(column)) {
                  columns.push(column);
                  placeholders.push('?');
                  values.push(value);
                }
              }
              
              // 插入文章
              const insertResult = await db.run(
                `INSERT INTO posts (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
                values
              );
              
              postId = insertResult.lastID!;
              result.created++;
            }
            
            // 同步分类
            if (post.categories && post.categories.length > 0) {
              console.log(`[同步] 同步文章分类: ${post.slug}, 分类: ${post.categories.join(', ')}`);
              await this.syncPostCategories(postId, post.categories);
            }
            
            // 同步标签
            if (post.tags && post.tags.length > 0) {
              console.log(`[同步] 同步文章标签: ${post.slug}, 标签: ${post.tags.join(', ')}`);
              await this.syncPostTags(postId, post.tags);
            }
            
            console.log(`[同步] 文章处理完成: ${post.slug}`);
          } catch (error) {
            console.error(`[同步] 同步文章失败: ${post.slug}`, error);
            console.error(`[同步] 错误详情:`, error instanceof Error ? error.stack : String(error));
            result.failed++;
          }
        }
        
        // 更新分类和标签的文章数量
        console.log('[同步] 开始更新分类文章数量');
        await this.updateCategoriesPostCount();
        
        console.log('[同步] 开始更新标签文章数量');
        await this.updateTagsPostCount();
        
        // 提交事务
        console.log('[同步] 提交数据库事务');
        await db.run('COMMIT');
        console.log('[同步] 同步完成');
      } catch (error) {
        // 回滚事务
        console.error('[同步] 同步失败，准备回滚事务:', error);
        await db.run('ROLLBACK');
        console.error('[同步] 事务已回滚, 详细错误:', error instanceof Error ? error.stack : String(error));
        throw error;
      }
      
      return result;
    } catch (error) {
      console.error('[同步] 同步文章过程中发生错误:', error);
      console.error('[同步] 错误详情:', error instanceof Error ? error.stack : String(error));
      result.failed = result.total;
      return result;
    }
  }
  
  /**
   * 同步文章分类
   */
  private async syncPostCategories(postId: number, categories: string[]): Promise<void> {
    try {
      console.log(`[同步] 开始同步文章(ID=${postId})的分类: ${categories.join(', ')}`);
      
      // 先删除现有关联
      await this.postCategoryRepo.deleteByPostId(postId);
      console.log(`[同步] 已删除文章(ID=${postId})的现有分类关联`);
      
      // 处理每个分类
      for (const categorySlug of categories) {
        try {
          console.log(`[同步] 处理分类: ${categorySlug}`);
          
          // 检查分类是否存在
          let category = await this.categoryRepo.getCategoryBySlug(categorySlug);
          
          if (!category) {
            // 创建新分类，使用slug作为名称（后续可以手动修改）
            console.log(`[同步] 创建新分类: ${categorySlug}`);
            const categoryId = await this.categoryRepo.createCategory({
              name: categorySlug,
              slug: categorySlug,
              description: '',
              post_count: 0
            });
            
            category = {
              id: categoryId,
              name: categorySlug,
              slug: categorySlug,
              description: '',
              post_count: 0
            };
            console.log(`[同步] 新分类创建成功: ${categorySlug}, ID=${categoryId}`);
          } else {
            console.log(`[同步] 找到已存在的分类: ${categorySlug}, ID=${category.id}`);
          }
          
          // 创建关联
          console.log(`[同步] 创建文章-分类关联: 文章ID=${postId}, 分类ID=${category.id}`);
          await this.postCategoryRepo.createPostCategory({
            post_id: postId,
            category_id: category.id!
          });
          console.log(`[同步] 文章-分类关联创建成功`);
        } catch (error) {
          console.error(`[同步] 处理分类失败: ${categorySlug}`, error);
          console.error(`[同步] 错误详情:`, error instanceof Error ? error.stack : String(error));
          // 继续处理下一个分类
        }
      }
      console.log(`[同步] 文章(ID=${postId})的分类同步完成`);
    } catch (error) {
      console.error(`[同步] 同步文章分类失败: postId=${postId}`, error);
      console.error(`[同步] 错误详情:`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
  
  /**
   * 同步文章标签
   */
  private async syncPostTags(postId: number, tags: string[]): Promise<void> {
    try {
      console.log(`[同步] 开始同步文章(ID=${postId})的标签: ${tags.join(', ')}`);
      
      // 先删除现有关联
      await this.postTagRepo.deleteByPostId(postId);
      console.log(`[同步] 已删除文章(ID=${postId})的现有标签关联`);
      
      // 处理每个标签
      for (const tagName of tags) {
        try {
          console.log(`[同步] 处理标签: ${tagName}`);
          
          // 检查标签是否存在
          let tag = await this.tagRepo.getTagByName(tagName);
          
          if (!tag) {
            // 创建新标签
            const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            console.log(`[同步] 创建新标签: ${tagName}, slug=${tagSlug}`);
            const tagId = await this.tagRepo.createTag({
              name: tagName,
              slug: tagSlug,
              post_count: 0
            });
            
            tag = {
              id: tagId,
              name: tagName,
              slug: tagSlug,
              post_count: 0
            };
            console.log(`[同步] 新标签创建成功: ${tagName}, ID=${tagId}`);
          } else {
            console.log(`[同步] 找到已存在的标签: ${tagName}, ID=${tag.id}`);
          }
          
          // 创建关联
          console.log(`[同步] 创建文章-标签关联: 文章ID=${postId}, 标签ID=${tag.id}`);
          await this.postTagRepo.createPostTag({
            post_id: postId,
            tag_id: tag.id!
          });
          console.log(`[同步] 文章-标签关联创建成功`);
        } catch (error) {
          console.error(`[同步] 处理标签失败: ${tagName}`, error);
          console.error(`[同步] 错误详情:`, error instanceof Error ? error.stack : String(error));
          // 继续处理下一个标签
        }
      }
      console.log(`[同步] 文章(ID=${postId})的标签同步完成`);
    } catch (error) {
      console.error(`[同步] 同步文章标签失败: postId=${postId}`, error);
      console.error(`[同步] 错误详情:`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
  
  /**
   * 更新分类的文章数量
   */
  private async updateCategoriesPostCount(): Promise<void> {
    await this.categoryRepo.updateAllCategoriesPostCount();
  }
  
  /**
   * 更新标签的文章数量
   */
  private async updateTagsPostCount(): Promise<void> {
    await this.tagRepo.updateAllTagsPostCount();
  }
} 