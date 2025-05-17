import { NextResponse } from 'next/server';
import { fallbackCategories } from '@/lib/fallback-data';

export async function GET(request: Request) {
  try {
    console.log('[API] 获取所有分类');
    return Response.json(fallbackCategories);
  } catch (error) {
    console.error('获取分类失败:', error);
    return Response.json(
      { error: '获取分类失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 