import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST() {
  try {
    // 重置系统缓存
    // 清除所有可能的revalidation路径
    revalidatePath('/api/categories/db-categories');
    revalidatePath('/api/categories-new/db-categories');
    revalidatePath('/admin/categories');
    revalidatePath('/api/admin/db-status');
    revalidatePath('/api/admin/db-status-new');
    
    return Response.json({ 
      success: true, 
      message: '系统缓存已重置',
      paths: [
        '/api/categories/db-categories',
        '/api/categories-new/db-categories',
        '/admin/categories',
        '/api/admin/db-status',
        '/api/admin/db-status-new'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] 重置失败:', error);
    return Response.json(
      { 
        success: false, 
        message: '重置失败',
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 