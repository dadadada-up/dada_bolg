import { Database } from 'sqlite';
import { getDb } from '../index';
import { PostTagModel } from '../models';

/**
 * 文章-标签关联数据库访问层
 */
export class PostTagRepository {
  /**
   * 创建文章-标签关联
   */
  async createPostTag(postTag: PostTagModel): Promise<boolean> {
    const db = await getDb();
    
    // 检查是否已存在
    const exists = await db.get(`
      SELECT 1
      FROM post_tags
      WHERE post_id = ? AND tag_id = ?
    `, [postTag.post_id, postTag.tag_id]);
    
    if (exists) {
      return true; // 已经存在，视为创建成功
    }
    
    const result = await db.run(`
      INSERT INTO post_tags (post_id, tag_id)
      VALUES (?, ?)
    `, [postTag.post_id, postTag.tag_id]);
    
    return result.changes! > 0;
  }
  
  /**
   * 删除文章-标签关联
   */
  async deletePostTag(postTag: PostTagModel): Promise<boolean> {
    const db = await getDb();
    
    const result = await db.run(`
      DELETE FROM post_tags
      WHERE post_id = ? AND tag_id = ?
    `, [postTag.post_id, postTag.tag_id]);
    
    return result.changes! > 0;
  }
  
  /**
   * 删除文章的所有标签关联
   */
  async deleteByPostId(postId: number): Promise<boolean> {
    const db = await getDb();
    
    const result = await db.run(`
      DELETE FROM post_tags
      WHERE post_id = ?
    `, [postId]);
    
    return result.changes! > 0;
  }
  
  /**
   * 删除标签的所有文章关联
   */
  async deleteByTagId(tagId: number): Promise<boolean> {
    const db = await getDb();
    
    const result = await db.run(`
      DELETE FROM post_tags
      WHERE tag_id = ?
    `, [tagId]);
    
    return result.changes! > 0;
  }
  
  /**
   * 获取文章的所有标签ID
   */
  async getTagIdsByPostId(postId: number): Promise<number[]> {
    const db = await getDb();
    
    interface TagIdResult {
      tag_id: number;
    }
    
    const results = await db.all<TagIdResult>(`
      SELECT tag_id
      FROM post_tags
      WHERE post_id = ?
    `, [postId]);
    
    return results.map(row => row.tag_id);
  }
  
  /**
   * 获取标签的所有文章ID
   */
  async getPostIdsByTagId(tagId: number): Promise<number[]> {
    const db = await getDb();
    
    interface PostIdResult {
      post_id: number;
    }
    
    const results = await db.all<PostIdResult>(`
      SELECT post_id
      FROM post_tags
      WHERE tag_id = ?
    `, [tagId]);
    
    return results.map(row => row.post_id);
  }
  
  /**
   * 批量创建文章-标签关联
   */
  async batchCreatePostTags(postId: number, tagIds: number[]): Promise<void> {
    if (tagIds.length === 0) {
      return;
    }
    
    const db = await getDb();
    
    // 使用事务确保原子性
    await db.run('BEGIN TRANSACTION');
    
    try {
      // 先删除现有关联
      await this.deleteByPostId(postId);
      
      // 插入新关联
      for (const tagId of tagIds) {
        await this.createPostTag({
          post_id: postId,
          tag_id: tagId
        });
      }
      
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }
} 