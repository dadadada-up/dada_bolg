import { NextResponse } from 'next/server';
import { Category } from '@/types/post';
import { categoryRepository } from '@/lib/db/repositories';
import { initializeDatabase } from '@/lib/db/database';

// 添加内存缓存
let categoriesCache: Category[] | null = null;
let categoriesCacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存

// 初始化数据库连接
initializeDatabase().catch(console.error);

/**
 * 获取所有数据库分类
 * 此API获取数据库中的分类数据
 */
export async function GET() {
  try {
    console.log('[API] 开始获取数据库分类数据');
    
    // 检查缓存是否有效
    const now = Date.now();
    if (categoriesCache && (now - categoriesCacheTimestamp < CACHE_TTL)) {
      console.log('[API] 使用缓存的分类数据');
      return Response.json(categoriesCache);
    }
    
    // 从数据库获取分类数据
    console.log('[API] 从数据库获取分类数据');
    const categories = await categoryRepository.getAllCategories();
    
    console.log(`[API] 返回 ${categories.length} 个分类`);
    
    // 更新缓存
    categoriesCache = categories;
    categoriesCacheTimestamp = now;
    
    return Response.json(categories);
    
  } catch (error) {
    console.error('[API] 获取分类失败:', error);
    
    // 出错时返回空数组，避免前端出错
    return Response.json([]);
  }
}

/**
 * 清除分类缓存
 */
export function clearCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTimestamp = 0;
}

// 保存或更新分类
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.name) {
      return Response.json({ error: '分类名称是必需的' }, { status: 400 });
    }
    
    // 保存分类
    await categoryRepository.saveCategory({
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      postCount: data.postCount || 0,
      parentId: data.parentId
    });
    
    // 清除缓存
    clearCategoriesCache();
    
    return Response.json({ success: true, message: '分类保存成功' });
  } catch (error) {
    console.error('[API] 保存分类失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '保存分类失败' },
      { status: 500 }
    );
  }
}

// 更新分类
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.name) {
      return Response.json({ error: '分类ID和名称是必需的' }, { status: 400 });
    }
    
    // 保存分类（该方法会处理更新）
    await categoryRepository.saveCategory({
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      postCount: data.postCount || 0,
      parentId: data.parentId
    });
    
    // 清除缓存
    clearCategoriesCache();
    
    return Response.json({ success: true, message: '分类更新成功' });
  } catch (error) {
    console.error('[API] 更新分类失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '更新分类失败' },
      { status: 500 }
    );
  }
}

// 删除分类
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    
    if (!idParam) {
      return Response.json({ error: '分类ID是必需的' }, { status: 400 });
    }
    
    const id = parseInt(idParam, 10);
    
    if (isNaN(id)) {
      return Response.json({ error: '无效的分类ID' }, { status: 400 });
    }
    
    await categoryRepository.deleteCategory(id);
    
    // 清除缓存
    clearCategoriesCache();
    
    return Response.json({ success: true, message: '分类删除成功' });
  } catch (error) {
    console.error('[API] 删除分类失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '删除分类失败' },
      { status: 500 }
    );
  }
} 