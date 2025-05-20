import { Database } from 'sqlite';
import { getDb, getCurrentTimestamp } from '../index';
import { TagModel } from '../models';

/**
 * 标签数据库访问层
 */
export class TagRepository {
  /**
   * 创建标签
   */
  async createTag(tag: Omit<TagModel, 'id'>): Promise<number> {
    const db = await getDb();
    const now = getCurrentTimestamp();
    
    const result = await db.run(`
      INSERT INTO tags (
        name, slug, post_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      tag.name,
      tag.slug,
      tag.post_count,
      now,
      now
    ]);
    
    return result.lastID!;
  }
  
  /**
   * 更新标签
   */
  async updateTag(id: number, tag: Partial<TagModel>): Promise<boolean> {
    const db = await getDb();
    const now = getCurrentTimestamp();
    
    // 构建更新字段
    const fields: string[] = [];
    const values: any[] = [];
    
    Object.entries(tag).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    // 添加更新时间
    fields.push('updated_at = ?');
    values.push(now);
    
    // 添加ID作为条件
    values.push(id);
    
    const query = `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`;
    const result = await db.run(query, values);
    
    return result.changes! > 0;
  }
  
  /**
   * 删除标签
   */
  async deleteTag(id: number): Promise<boolean> {
    const db = await getDb();
    
    // 删除标签关联
    await db.run('DELETE FROM post_tags WHERE tag_id = ?', [id]);
    
    // 删除标签
    const result = await db.run('DELETE FROM tags WHERE id = ?', [id]);
    return result.changes! > 0;
  }
  
  /**
   * 根据ID获取标签
   */
  async getTagById(id: number): Promise<TagModel | null> {
    const db = await getDb();
    
    const tag = await db.get<TagModel>(`
      SELECT * FROM tags WHERE id = ?
    `, [id]);
    
    return tag || null;
  }
  
  /**
   * 根据slug获取标签
   */
  async getTagBySlug(slug: string): Promise<TagModel | null> {
    const db = await getDb();
    
    const tag = await db.get<TagModel>(`
      SELECT * FROM tags WHERE slug = ?
    `, [slug]);
    
    return tag || null;
  }
  
  /**
   * 根据名称获取标签
   */
  async getTagByName(name: string): Promise<TagModel | null> {
    const db = await getDb();
    
    const tag = await db.get<TagModel>(`
      SELECT * FROM tags WHERE name = ?
    `, [name]);
    
    return tag || null;
  }
  
  /**
   * 获取所有标签
   */
  async getAllTags(): Promise<TagModel[]> {
    const db = await getDb();
    
    const tags = await db.all<TagModel>(`
      SELECT * FROM tags ORDER BY name ASC
    `);
    
    return tags;
  }
  
  /**
   * 更新标签的文章数量
   */
  async updateTagPostCount(id: number): Promise<boolean> {
    const db = await getDb();
    
    const result = await db.run(`
      UPDATE tags
      SET post_count = (
        SELECT COUNT(DISTINCT p.id)
        FROM posts p
        JOIN post_tags pt ON p.id = pt.post_id
        WHERE pt.tag_id = ? AND p.is_published = 1
      ), updated_at = ?
      WHERE id = ?
    `, [id, getCurrentTimestamp(), id]);
    
    return result.changes! > 0;
  }
  
  /**
   * 更新所有标签的文章数量
   */
  async updateAllTagsPostCount(): Promise<void> {
    const db = await getDb();
    const now = getCurrentTimestamp();
    
    await db.run(`
      UPDATE tags
      SET post_count = (
        SELECT COUNT(DISTINCT p.id)
        FROM posts p
        JOIN post_tags pt ON p.id = pt.post_id
        WHERE pt.tag_id = tags.id AND p.is_published = 1
      ), updated_at = ?
    `, [now]);
  }
} 