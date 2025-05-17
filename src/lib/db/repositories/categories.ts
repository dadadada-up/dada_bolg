import { Database } from 'sqlite';
import { getDb, getCurrentTimestamp } from '../index';
import { CategoryModel } from '../models';
import { query, queryOne, execute } from '../database';
import { Category } from '@/types/post';

/**
 * 分类数据库访问层
 */
export class CategoryRepository {
  /**
   * 创建分类
   */
  async createCategory(category: Omit<CategoryModel, 'id'>): Promise<number> {
    const db = await getDb();
    const now = getCurrentTimestamp();
    
    const result = await db.run(`
      INSERT INTO categories (
        name, slug, description, post_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      category.name,
      category.slug,
      category.description || '',
      category.post_count,
      now,
      now
    ]);
    
    return result.lastID!;
  }
  
  /**
   * 更新分类
   */
  async updateCategory(id: number, category: Partial<CategoryModel>): Promise<boolean> {
    const db = await getDb();
    const now = getCurrentTimestamp();
    
    // 构建更新字段
    const fields: string[] = [];
    const values: any[] = [];
    
    Object.entries(category).forEach(([key, value]) => {
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
    
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    const result = await db.run(query, values);
    
    return result.changes! > 0;
  }
  
  /**
   * 删除分类
   */
  async deleteCategory(id: number): Promise<boolean> {
    const db = await getDb();
    
    // 删除分类关联
    await db.run('DELETE FROM post_categories WHERE category_id = ?', [id]);
    
    // 删除分类
    const result = await db.run('DELETE FROM categories WHERE id = ?', [id]);
    return result.changes! > 0;
  }
  
  /**
   * 根据ID获取分类
   */
  async getCategoryById(id: number): Promise<CategoryModel | null> {
    const db = await getDb();
    
    const category = await db.get<CategoryModel>(`
      SELECT * FROM categories WHERE id = ?
    `, [id]);
    
    return category || null;
  }
  
  /**
   * 根据slug获取分类
   */
  async getCategoryBySlug(slug: string): Promise<CategoryModel | null> {
    const db = await getDb();
    
    const category = await db.get<CategoryModel>(`
      SELECT * FROM categories WHERE slug = ?
    `, [slug]);
    
    return category || null;
  }
  
  /**
   * 获取所有分类
   */
  async getAllCategories(): Promise<CategoryModel[]> {
    const db = await getDb();
    
    const categories = await db.all<CategoryModel>(`
      SELECT * FROM categories ORDER BY name ASC
    `);
    
    return categories;
  }
  
  /**
   * 更新分类的文章数量
   */
  async updateCategoryPostCount(id: number): Promise<boolean> {
    const db = await getDb();
    
    const result = await db.run(`
      UPDATE categories
      SET post_count = (
        SELECT COUNT(DISTINCT p.id)
        FROM posts p
        JOIN post_categories pc ON p.id = pc.post_id
        WHERE pc.category_id = ? AND p.published = 1
      ), updated_at = ?
      WHERE id = ?
    `, [id, getCurrentTimestamp(), id]);
    
    return result.changes! > 0;
  }
  
  /**
   * 更新所有分类的文章数量
   */
  async updateAllCategoriesPostCount(): Promise<void> {
    const db = await getDb();
    const now = getCurrentTimestamp();
    
    await db.run(`
      UPDATE categories
      SET post_count = (
        SELECT COUNT(DISTINCT p.id)
        FROM posts p
        JOIN post_categories pc ON p.id = pc.post_id
        WHERE pc.category_id = categories.id AND p.published = 1
      ), updated_at = ?
    `, [now]);
  }
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