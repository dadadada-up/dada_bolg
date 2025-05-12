import { Tag } from '@/types/post';
import * as db from '../database';
import { slugify } from '@/lib/utils';

// 数据库中Tag对象的类型
interface DbTag {
  id: number;
  name: string;
  slug: string;
  post_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 获取所有标签
 */
export async function getAllTags(): Promise<Tag[]> {
  const query = `
    SELECT 
      t.id, t.name, t.slug, t.post_count, t.created_at, t.updated_at
    FROM tags t
    ORDER BY t.name ASC
  `;
  
  const tags = await db.query<DbTag>(query);
  
  return tags.map(mapDbTagToTag);
}

/**
 * 获取热门标签（按文章数量排序）
 */
export async function getPopularTags(limit: number = 10): Promise<Tag[]> {
  const query = `
    SELECT 
      t.id, t.name, t.slug, t.post_count, t.created_at, t.updated_at
    FROM tags t
    WHERE t.post_count > 0
    ORDER BY t.post_count DESC, t.name ASC
    LIMIT ?
  `;
  
  const tags = await db.query<DbTag>(query, [limit]);
  
  return tags.map(mapDbTagToTag);
}

/**
 * 根据slug获取标签
 */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const query = `
    SELECT 
      t.id, t.name, t.slug, t.post_count, t.created_at, t.updated_at
    FROM tags t
    WHERE t.slug = ?
  `;
  
  const tag = await db.queryOne<DbTag>(query, [slug]);
  
  if (!tag) {
    return null;
  }
  
  return mapDbTagToTag(tag);
}

/**
 * 保存标签
 */
export async function saveTag(tag: Tag): Promise<number> {
  const now = db.getCurrentTimestamp();
  
  // 如果未提供slug，则根据名称生成
  const slug = tag.slug || slugify(tag.name);
  
  // 检查是否已存在
  const existingTag = tag.id
    ? await db.queryOne<{ id: number }>('SELECT id FROM tags WHERE id = ?', [tag.id])
    : await db.queryOne<{ id: number }>('SELECT id FROM tags WHERE slug = ?', [slug]);
    
  if (existingTag) {
    // 更新现有标签
    const updateSql = `
      UPDATE tags SET
        name = ?,
        slug = ?,
        updated_at = ?
      WHERE id = ?
    `;
    
    await db.execute(updateSql, [
      tag.name,
      slug,
      now,
      existingTag.id
    ]);
    
    return existingTag.id;
  } else {
    // 创建新标签
    const insertSql = `
      INSERT INTO tags (
        name, slug, post_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `;
    
    await db.execute(insertSql, [
      tag.name,
      slug,
      tag.postCount || 0,
      now,
      now
    ]);
    
    // 获取新插入的ID
    const newTag = await db.queryOne<{ id: number }>('SELECT id FROM tags WHERE slug = ?', [slug]);
    if (!newTag) {
      throw new Error('插入标签失败');
    }
    
    return newTag.id;
  }
}

/**
 * 删除标签
 */
export async function deleteTag(id: number): Promise<boolean> {
  // 检查是否有关联的文章
  const postCount = await db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM post_tags WHERE tag_id = ?',
    [id]
  );
  
  if (postCount && postCount.count > 0) {
    throw new Error(`无法删除标签，有${postCount.count}篇文章与其关联`);
  }
  
  // 删除标签
  const result = await db.execute('DELETE FROM tags WHERE id = ?', [id]);
  
  return result > 0;
}

/**
 * 更新标签的文章计数
 */
export async function updateTagPostCounts(): Promise<void> {
  const sql = `
    UPDATE tags 
    SET post_count = (
      SELECT COUNT(DISTINCT pt.post_id) 
      FROM post_tags pt
      JOIN posts p ON pt.post_id = p.id AND p.is_published = 1
      WHERE pt.tag_id = tags.id
    )
  `;
  
  await db.execute(sql);
}

/**
 * 将数据库Tag对象转换为前端使用的Tag对象
 */
function mapDbTagToTag(dbTag: DbTag): Tag {
  return {
    id: dbTag.id,
    name: dbTag.name,
    slug: dbTag.slug,
    postCount: dbTag.post_count,
    createdAt: dbTag.created_at,
    updatedAt: dbTag.updated_at
  };
} 