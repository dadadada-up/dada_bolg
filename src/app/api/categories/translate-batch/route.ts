import { NextResponse } from 'next/server';
import { getEnglishCategorySlug } from '@/lib/content/category-service';
import { dynamicConfig, shouldUseMockData } from '@/lib/api/route-config';

// 强制动态路由，防止静态生成
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    // 检查是否应该返回模拟数据
    if (shouldUseMockData('分类批量翻译API')) {
      // 返回模拟翻译结果
      return Response.json([
        { name: '技术', slug: 'tech' },
        { name: '生活', slug: 'life' },
        { name: '思考', slug: 'thoughts' }
      ]);
    }
    
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