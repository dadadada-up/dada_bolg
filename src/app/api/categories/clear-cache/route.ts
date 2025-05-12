import { NextResponse } from 'next/server';
import { clearCategoriesCache } from '../db-categories/route';
import { revalidatePath } from 'next/cache';

/**
 * 清除分类数据缓存
 * 当需要获取最新分类数据时使用
 */
export async function GET() {
  try {
    console.log('[API] 清除分类缓存');
    
    // 调用清除缓存函数
    clearCategoriesCache();
    
    // 同时也清除db-categories缓存（如果已导入）
    try {
      const dbCategoriesModule = await import('../db-categories/route');
      if (typeof dbCategoriesModule.clearCategoriesCache === 'function') {
        dbCategoriesModule.clearCategoriesCache();
      }
    } catch (e) {
      // 忽略导入错误
      console.log('[API] db-categories模块未加载，跳过清除');
    }
    
    // 重新验证分类页面
    revalidatePath('/admin/categories');
    
    return Response.json({
      success: true,
      message: '分类缓存已清除'
    });
  } catch (error) {
    console.error('[API] 清除分类缓存失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '清除分类缓存失败' },
      { status: 500 }
    );
  }
}

// 提供POST方法支持
export async function POST() {
  return GET();
} 