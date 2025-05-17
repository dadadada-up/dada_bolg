import { NextResponse } from 'next/server';
import { getEnglishCategorySlug } from '@/lib/category-service';

/**
 * 分类批量翻译API - 旧接口路径的重定向
 * 将请求重定向到标准接口: /api/categories-new/translate-batch
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { names } = data;
    
    if (!names || !Array.isArray(names)) {
      return Response.json(
        { error: '必须提供分类名称数组' },
        { status: 400 }
      );
    }
    
    const result = [];
    
    for (const name of names) {
      const slug = await getEnglishCategorySlug(name);
      result.push({
        name,
        slug
      });
    }
    
    return Response.json(result);
  } catch (error) {
    console.error('批量翻译分类失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '批量翻译分类失败' },
      { status: 500 }
    );
  }
} 