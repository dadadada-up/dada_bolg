import { NextResponse } from 'next/server';
import { fallbackCategories } from '@/lib/fallback-data';

export async function GET(request: Request) {
  try {
    console.log(`[分类API] 接收到请求: ${request.url}`);
    
    // 返回备用分类数据
    return Response.json(fallbackCategories);
  } catch (error) {
    console.error('[分类API] 获取分类失败:', error);
    
    return Response.json(
      { 
        error: '获取分类失败', 
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 