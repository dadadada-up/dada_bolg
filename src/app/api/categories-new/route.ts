import { NextResponse } from 'next/server';
import { Category } from '@/types/post';
import { categoryRepository } from '@/lib/db/repositories';
import { initializeDatabase } from '@/lib/db/database';
import { slugify } from '@/lib/utils';

// 添加内存缓存
let categoriesCache: Category[] | null = null;
let categoriesCacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存

// 初始化数据库连接
initializeDatabase().catch(console.error);

/**
 * 获取所有分类
 */
export async function GET() {
  try {
    console.log('[API] 开始获取分类数据');
    
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
 * 创建新分类
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.name) {
      return Response.json({ error: '分类名称是必需的' }, { status: 400 });
    }
    
    const newCategoryId = await categoryRepository.saveCategory({
      name: data.name,
      slug: data.slug,
      description: data.description,
      postCount: 0,  // 新分类没有文章
      parentId: data.parentId
    });
    
    // 清除缓存
    categoriesCache = null;
    
    const newCategory = await categoryRepository.getCategoryBySlug(data.slug || slugify(data.name));
    
    return Response.json(newCategory);
  } catch (error) {
    console.error('[API] 创建分类失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '创建分类失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新分类（通过保存函数实现）
 */
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.name) {
      return Response.json({ error: '分类ID和名称是必需的' }, { status: 400 });
    }
    
    // 保存会处理更新
    await categoryRepository.saveCategory({
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      postCount: data.postCount || 0,
      parentId: data.parentId
    });
    
    // 清除缓存
    categoriesCache = null;
    
    // 获取更新后的分类
    const updatedCategory = await categoryRepository.getCategoryBySlug(data.slug || slugify(data.name));
    
    return Response.json(updatedCategory);
  } catch (error) {
    console.error('[API] 更新分类失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '更新分类失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除分类
 */
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
    categoriesCache = null;
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('[API] 删除分类失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '删除分类失败' },
      { status: 500 }
    );
  }
} 