import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * 清除分类数据缓存
 * 当需要获取最新分类数据时使用
 */
export async function GET() {
  try {
    console.log('[API] 清除分类缓存');
    
    // 使用路径重新验证方式清除缓存
    revalidatePath('/api/categories/db-categories');
    revalidatePath('/api/categories-new/db-categories');
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