import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { clearCategoriesCache } from '../db-categories/route';
import { revalidatePath } from 'next/cache';

// 定义分类记录的接口
interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  post_count: number;
}

// 定义文章计数结果的接口
interface CountResult {
  count: number;
}

/**
 * 更新所有分类的文章计数
 * 计算每个分类下的已发布文章数量，更新到分类记录中
 */
export async function POST() {
  try {
    const db = await getDb();
    
    // 开始事务
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // 获取所有分类
      const categories = db.prepare(`
        SELECT id, name, slug, description, post_count
        FROM categories
        ORDER BY name, slug
      `).all() as CategoryRecord[];
      
      // 记录更新的分类计数
      let updatedCount = 0;
      
      // 更新每个分类的文章计数
      for (const category of categories) {
        // 计算该分类关联的已发布文章数量
        const result = db.prepare(`
          SELECT COUNT(DISTINCT pc.post_id) as count
          FROM post_categories pc
          JOIN posts p ON pc.post_id = p.id
          WHERE pc.category_id = ? AND p.published = 1
        `).get(category.id) as CountResult;
        
        const postCount = result.count || 0;
        
        // 如果计数不同，则更新
        if (postCount !== category.post_count) {
          db.prepare(`
            UPDATE categories
            SET post_count = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(postCount, category.id);
          
          updatedCount++;
        }
      }
      
      // 提交事务
      db.prepare('COMMIT').run();
      
      // 清除缓存
      clearCategoriesCache();
      
      // 重新验证分类页面
      revalidatePath('/admin/categories');
      
      return Response.json({
        success: true,
        message: `已更新 ${updatedCount} 个分类的文章计数`,
        updatedCount
      });
    } catch (error) {
      // 回滚事务
      db.prepare('ROLLBACK').run();
      throw error;
    }
    
  } catch (error) {
    console.error('[API] 更新分类文章计数失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '更新分类文章计数失败' },
      { status: 500 }
    );
  }
} 