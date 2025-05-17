import { Database } from 'sqlite';
import { getDb } from '../index';
import { PostCategoryModel } from '../models';

/**
 * 文章-分类关联数据库访问层
 */
export class PostCategoryRepository {
  /**
   * 创建文章-分类关联
   */
  async createPostCategory(postCategory: PostCategoryModel): Promise<boolean> {
    const db = await getDb();
    
    // 检查是否已存在
    const exists = await db.get(`
      SELECT 1
      FROM post_categories
      WHERE post_id = ? AND category_id = ?
    `, [postCategory.post_id, postCategory.category_id]);
    
    if (exists) {
      return true; // 已经存在，视为创建成功
    }
    
    const result = await db.run(`
      INSERT INTO post_categories (post_id, category_id)
      VALUES (?, ?)
    `, [postCategory.post_id, postCategory.category_id]);
    
    return result.changes! > 0;
  }
  
  /**
   * 删除文章-分类关联
   */
  async deletePostCategory(postCategory: PostCategoryModel): Promise<boolean> {
    const db = await getDb();
    
    const result = await db.run(`
      DELETE FROM post_categories
      WHERE post_id = ? AND category_id = ?
    `, [postCategory.post_id, postCategory.category_id]);
    
    return result.changes! > 0;
  }
  
  /**
   * 删除文章的所有分类关联
   */
  async deleteByPostId(postId: number): Promise<boolean> {
    const db = await getDb();
    
    const result = await db.run(`
      DELETE FROM post_categories
      WHERE post_id = ?
    `, [postId]);
    
    return result.changes! > 0;
  }
  
  /**
   * 删除分类的所有文章关联
   */
  async deleteByCategoryId(categoryId: number): Promise<boolean> {
    const db = await getDb();
    
    const result = await db.run(`
      DELETE FROM post_categories
      WHERE category_id = ?
    `, [categoryId]);
    
    return result.changes! > 0;
  }
  
  /**
   * 获取文章的所有分类ID
   */
  async getCategoryIdsByPostId(postId: number): Promise<number[]> {
    const db = await getDb();
    
    const results = await db.all<{ category_id: number }[]>(`
      SELECT category_id
      FROM post_categories
      WHERE post_id = ?
    `, [postId]);
    
    return results.map(row => row.category_id);
  }
  
  /**
   * 获取分类的所有文章ID
   */
  async getPostIdsByCategoryId(categoryId: number): Promise<number[]> {
    const db = await getDb();
    
    const results = await db.all<{ post_id: number }[]>(`
      SELECT post_id
      FROM post_categories
      WHERE category_id = ?
    `, [categoryId]);
    
    return results.map(row => row.post_id);
  }
  
  /**
   * 批量创建文章-分类关联
   */
  async batchCreatePostCategories(postId: number, categoryIds: number[]): Promise<void> {
    if (categoryIds.length === 0) {
      return;
    }
    
    const db = await getDb();
    
    // 使用事务确保原子性
    await db.run('BEGIN TRANSACTION');
    
    try {
      // 先删除现有关联
      await this.deleteByPostId(postId);
      
      // 插入新关联
      for (const categoryId of categoryIds) {
        await this.createPostCategory({
          post_id: postId,
          category_id: categoryId
        });
      }
      
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }
} 