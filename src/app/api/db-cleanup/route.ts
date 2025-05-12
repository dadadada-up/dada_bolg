import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    console.log('[数据库清理] 开始清理分类表重复数据');
    
    const db = await getDb();
    const results = {
      success: false,
      cleanedRecords: 0,
      errors: [] as string[]
    };
    
    // 1. 获取所有分类
    const categories = await db.all(`
      SELECT id, slug, name, post_count, created_at 
      FROM categories 
      ORDER BY slug, created_at
    `);
    
    console.log(`[数据库清理] 找到 ${categories.length} 条分类记录`);
    
    // 2. 按slug分组
    const categoriesBySlug: Record<string, any[]> = {};
    for (const category of categories) {
      if (!categoriesBySlug[category.slug]) {
        categoriesBySlug[category.slug] = [];
      }
      categoriesBySlug[category.slug].push(category);
    }
    
    // 3. 对于每个slug，保留最新的一条记录，删除其他记录
    let cleanedCount = 0;
    
    try {
      // 开始事务
      await db.run('BEGIN TRANSACTION');
      
      for (const [slug, entries] of Object.entries(categoriesBySlug)) {
        if (entries.length > 1) {
          // 按创建时间排序，保留最新的记录
          entries.sort((a, b) => {
            if (!a.created_at) return 1;
            if (!b.created_at) return -1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          
          const keepEntry = entries[0]; // 保留最新的记录
          
          // 获取该分类下的所有文章-分类关联
          for (let i = 1; i < entries.length; i++) {
            const deleteEntry = entries[i];
            
            // 更新文章-分类关联
            await db.run(`
              UPDATE post_categories
              SET category_id = ?
              WHERE category_id = ?
            `, [keepEntry.id, deleteEntry.id]);
            
            // 删除重复记录
            await db.run('DELETE FROM categories WHERE id = ?', [deleteEntry.id]);
            cleanedCount++;
          }
          
          console.log(`[数据库清理] 清理分类 '${slug}': 保留ID ${keepEntry.id}, 删除 ${entries.length - 1} 条重复记录`);
        }
      }
      
      // 提交事务
      await db.run('COMMIT');
      
      // 更新分类的文章计数
      await db.run(`
        UPDATE categories
        SET post_count = (
          SELECT COUNT(DISTINCT p.id)
          FROM posts p
          JOIN post_categories pc ON p.id = pc.post_id
          WHERE pc.category_id = categories.id AND p.published = 1
        )
      `);
      
      results.cleanedRecords = cleanedCount;
      results.success = true;
      
    } catch (error) {
      // 回滚事务
      await db.run('ROLLBACK');
      
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error(`[数据库清理] 清理过程中出错: ${errorMsg}`);
      results.errors.push(errorMsg);
      results.success = false;
    }
    
    // 清除分类缓存
    revalidatePath('/api/categories/db-categories');
    revalidatePath('/api/categories-new/db-categories');
    revalidatePath('/admin/categories');
    
    console.log(`[数据库清理] 完成清理分类表, 共清理 ${cleanedCount} 条记录`);
    
    return Response.json({
      success: results.success,
      message: `共清理 ${cleanedCount} 条重复分类记录`,
      details: results
    });
  } catch (error) {
    console.error('[数据库清理] 处理请求时出错:', error);
    return Response.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : '清理数据库失败',
        stack: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
} 