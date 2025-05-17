import { Category } from '@/types/post';
import * as db from '../database';
import { slugify } from '@/lib/utils';

// 数据库中Category对象的类型
interface DbCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  post_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 获取所有分类
 */
export async function getAllCategories(): Promise<Category[]> {
  const query = `
    SELECT 
      c.id, c.name, c.slug, c.description, c.parent_id, 
      c.post_count, c.created_at, c.updated_at
    FROM categories c
    ORDER BY c.name ASC
  `;
  
  const categories = await db.query<DbCategory>(query);
  
  return categories.map(mapDbCategoryToCategory);
}

/**
 * 根据slug获取分类
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const query = `
    SELECT 
      c.id, c.name, c.slug, c.description, c.parent_id, 
      c.post_count, c.created_at, c.updated_at
    FROM categories c
    WHERE c.slug = ?
  `;
  
  const category = await db.queryOne<DbCategory>(query, [slug]);
  
  if (!category) {
    return null;
  }
  
  return mapDbCategoryToCategory(category);
}

/**
 * 保存分类
 */
export async function saveCategory(category: Category): Promise<number> {
  const now = db.getCurrentTimestamp();
  
  // 如果未提供slug，则根据名称生成
  const slug = category.slug || slugify(category.name);
  
  // 检查是否已存在
  const existingCategory = category.id
    ? await db.queryOne<{ id: number }>('SELECT id FROM categories WHERE id = ?', [category.id])
    : await db.queryOne<{ id: number }>('SELECT id FROM categories WHERE slug = ?', [slug]);
    
  if (existingCategory) {
    // 更新现有分类
    const updateSql = `
      UPDATE categories SET
        name = ?,
        slug = ?,
        description = ?,
        parent_id = ?,
        updated_at = ?
      WHERE id = ?
    `;
    
    await db.execute(updateSql, [
      category.name,
      slug,
      category.description || null,
      category.parentId || null,
      now,
      existingCategory.id
    ]);
    
    return existingCategory.id;
  } else {
    // 创建新分类
    const insertSql = `
      INSERT INTO categories (
        name, slug, description, parent_id, post_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.execute(insertSql, [
      category.name,
      slug,
      category.description || null,
      category.parentId || null,
      category.postCount || 0,
      now,
      now
    ]);
    
    // 获取新插入的ID
    const newCategory = await db.queryOne<{ id: number }>('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (!newCategory) {
      throw new Error('插入分类失败');
    }
    
    return newCategory.id;
  }
}

/**
 * 删除分类
 */
export async function deleteCategory(id: number): Promise<boolean> {
  // 检查是否有关联的文章
  const postCount = await db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM post_categories WHERE category_id = ?',
    [id]
  );
  
  if (postCount && postCount.count > 0) {
    throw new Error(`无法删除分类，有${postCount.count}篇文章与其关联`);
  }
  
  // 删除分类
  const result = await db.execute('DELETE FROM categories WHERE id = ?', [id]);
  
  return result > 0;
}

/**
 * 更新分类的文章计数
 */
export async function updateCategoryPostCounts(): Promise<void> {
  const sql = `
    UPDATE categories 
    SET post_count = (
      SELECT COUNT(DISTINCT pc.post_id) 
      FROM post_categories pc
      JOIN posts p ON pc.post_id = p.id AND p.is_published = 1
      WHERE pc.category_id = categories.id
    )
  `;
  
  await db.execute(sql);
}

/**
 * 将数据库Category对象转换为前端使用的Category对象
 */
function mapDbCategoryToCategory(dbCategory: DbCategory): Category {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    slug: dbCategory.slug,
    description: dbCategory.description,
    parentId: dbCategory.parent_id,
    postCount: dbCategory.post_count,
    createdAt: dbCategory.created_at,
    updatedAt: dbCategory.updated_at
  };
} 