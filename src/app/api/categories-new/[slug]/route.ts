/**
 * 单个分类API（新版）
 * 
 * 处理单个分类的更新和删除
 */

import { NextResponse } from 'next/server';
import { saveCategory, deleteCategory } from '@/lib/services/data';
import { getDataService } from '@/lib/services/data';

// 获取单个分类信息
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    // 获取数据服务
    const dataService = getDataService();
    
    // 获取所有分类
    const categories = await dataService.getCategories();
    
    // 查找指定slug的分类
    const category = categories.find(c => c.slug === slug);
    
    if (!category) {
      return Response.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }
    
    return Response.json(category);
  } catch (error) {
    console.error(`[分类API-新] 获取分类 ${params.slug} 失败:`, error);
    
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

// 更新分类
export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const data = await request.json();
    
    // 验证必要字段
    if (!data.name || !data.slug) {
      return Response.json(
        { error: '分类名称和标识是必须的' },
        { status: 400 }
      );
    }
    
    // 获取数据服务
    const dataService = getDataService();
    
    // 获取所有分类
    const categories = await dataService.getCategories();
    
    // 查找要更新的分类
    const category = categories.find(c => c.slug === slug);
    
    if (!category) {
      return Response.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }
    
    // 使用统一数据服务更新分类
    const result = await saveCategory({
      id: category.id,
      name: data.name,
      slug: data.slug,
      description: data.description || ''
    });
    
    console.log(`[分类API-新] 更新分类成功：${data.name}`);
    
    return Response.json(result);
  } catch (error) {
    console.error(`[分类API-新] 更新分类 ${params.slug} 失败:`, error);
    
    return Response.json(
      { 
        error: '更新分类失败', 
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 删除分类
export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    // 获取数据服务
    const dataService = getDataService();
    
    // 获取所有分类
    const categories = await dataService.getCategories();
    
    // 查找要删除的分类
    const category = categories.find(c => c.slug === slug);
    
    if (!category) {
      return Response.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }
    
    // 确保分类ID是数值类型
    const categoryId = typeof category.id === 'string' 
      ? parseInt(category.id, 10) 
      : category.id;
    
    if (isNaN(categoryId as number)) {
      return Response.json(
        { error: '无效的分类ID' },
        { status: 400 }
      );
    }
    
    // 使用统一数据服务删除分类
    const result = await deleteCategory(categoryId as number);
    
    if (result) {
      console.log(`[分类API-新] 删除分类成功：${slug}`);
      return Response.json({ success: true });
    } else {
      throw new Error('删除分类失败');
    }
  } catch (error) {
    console.error(`[分类API-新] 删除分类 ${params.slug} 失败:`, error);
    
    return Response.json(
      { 
        error: '删除分类失败', 
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 