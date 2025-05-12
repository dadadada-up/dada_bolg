import { NextResponse } from 'next/server';
import { getChineseCategoryName, getEnglishCategorySlug } from '@/lib/category-service';

// 分类名称中英互译
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || '';
    const direction = searchParams.get('direction') || 'toChinese';
    
    if (!name) {
      return Response.json(
        { error: '必须提供分类名称' },
        { status: 400 }
      );
    }
    
    let translatedName = '';
    
    if (direction === 'toChinese') {
      // 从英文到中文
      translatedName = await getChineseCategoryName(name);
    } else {
      // 从中文到英文
      translatedName = await getEnglishCategorySlug(name);
    }
    
    return Response.json({ translatedName });
  } catch (error) {
    console.error('分类名称翻译失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '分类翻译失败' },
      { status: 500 }
    );
  }
} 