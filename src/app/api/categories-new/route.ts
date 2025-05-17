/**
 * 分类API（新版）
 * 
 * 使用统一数据服务获取分类数据
 */

import { NextResponse } from 'next/server';
import { getCategories, saveCategory } from '@/lib/services/data';

export async function GET() {
  try {
    // 使用统一数据服务获取分类
    const categories = await getCategories();
    
    console.log(`[分类API-新] 获取到 ${categories.length} 个分类`);
    
    return Response.json(categories);
  } catch (error) {
    console.error('[分类API-新] 获取分类失败:', error);
    
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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 验证必要字段
    if (!data.name || !data.slug) {
      return Response.json(
        { error: '分类名称和标识是必须的' },
        { status: 400 }
      );
    }
    
    // 使用统一数据服务保存分类
    const result = await saveCategory({
      name: data.name,
      slug: data.slug,
      description: data.description || ''
    });
    
    console.log(`[分类API-新] 创建分类成功：${data.name}`);
    
    return Response.json(result);
  } catch (error) {
    console.error('[分类API-新] 创建分类失败:', error);
    
    return Response.json(
      { 
        error: '创建分类失败', 
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 