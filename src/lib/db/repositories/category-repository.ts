import { Category } from '@/types/post';
import * as db from '../database';
import { slugify } from '@/lib/utils';
import { query, queryOne, execute } from '../database';

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
  try {
    // 检查表是否存在
    const tableCheck = await query("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'");
    
    if (!tableCheck || tableCheck.length === 0) {
      console.log('[DB] 分类表不存在');
      return [];
    }
    
    // 获取所有表字段
    const columnsQuery = await query("PRAGMA table_info(categories)");
    const columns = columnsQuery.map(col => col.name);
    
    // 动态构建SQL查询，根据表中实际存在的字段
    let sql = 'SELECT ';
    const selectFields = ['id', 'name', 'slug', 'description'];
    
    // 如果post_count字段存在，也选择它
    if (columns.includes('post_count')) {
      selectFields.push('post_count');
    }
    
    // 添加字段到SQL
    sql += selectFields.join(', ');
    sql += ' FROM categories';
    
    // 查询所有分类
    const categories = await query<any>(sql);
    
    // 转换为Category对象
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      postCount: c.post_count || 0
    }));
  } catch (error) {
    console.error('[DB] 获取分类失败:', error);
    throw error;
  }
}

/**
 * 获取指定slug的分类
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const category = await queryOne<any>(`
      SELECT id, name, slug, description, post_count 
      FROM categories 
      WHERE slug = ?
    `, [slug]);
    
    if (!category) {
      return null;
    }
    
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      postCount: category.post_count || 0
    };
  } catch (error) {
    console.error(`[DB] 获取分类失败: ${slug}`, error);
    return null;
  }
}

/**
 * 获取分类数量
 */
export async function getCategoryCount(): Promise<number> {
  try {
    const result = await queryOne<{count: number}>(`
      SELECT COUNT(*) as count FROM categories
    `);
    
    return result?.count || 0;
  } catch (error) {
    console.error('[DB] 获取分类数量失败:', error);
    return 0;
  }
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