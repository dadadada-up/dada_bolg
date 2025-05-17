import { NextResponse } from 'next/server';
import { Category } from '@/types/post';
import { categoryRepository } from '@/lib/db/repositories';
import { initializeDatabase } from '@/lib/db/database';

// 检测是否在Vercel环境中
const isVercel = process.env.VERCEL === '1';

// 添加内存缓存
let categoriesCache: Category[] | null = null;
let categoriesCacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存

// 在非Vercel环境中初始化数据库连接
if (!isVercel) {
  initializeDatabase().catch(console.error);
}

// 获取Vercel环境中的模拟分类数据
function getMockCategories(): Category[] {
  return [
    { name: '技术工具', slug: 'tech-tools', postCount: 0, description: '' },
    { name: '产品管理', slug: 'product-management', postCount: 0, description: '' },
    { name: '开源', slug: 'open-source', postCount: 0, description: '' },
    { name: '个人博客', slug: 'personal-blog', postCount: 0, description: '' },
    { name: '金融', slug: 'finance', postCount: 0, description: '' },
    { name: '保险', slug: 'insurance', postCount: 0, description: '' },
    { name: '家庭生活', slug: 'family-life', postCount: 0, description: '' },
    { name: '读书笔记', slug: 'reading', postCount: 0, description: '' }
  ];
}

/**
 * 获取所有数据库分类
 * 此API获取数据库中的分类数据
 */
export async function GET() {
  try {
    console.log('[API] 开始获取数据库分类数据');
    console.log(`[API] 当前环境: ${isVercel ? 'Vercel' : '本地开发'}`);
    
    // 在Vercel环境中返回模拟数据
    if (isVercel) {
      console.log('[API] Vercel环境，返回模拟分类数据');
      return Response.json(getMockCategories());
    }
    
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
    
    // 出错时返回模拟数据，避免前端出错
    if (isVercel) {
      console.log('[API] 在Vercel环境中出错，返回模拟分类数据');
      return Response.json(getMockCategories());
    }
    
    // 出错时返回空数组，避免前端出错
    return Response.json([]);
  }
}

/**
 * 清除分类缓存
 */
function clearCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTimestamp = 0;
}

// 保存或更新分类
export async function POST(request: Request) {
  try {
    // 在Vercel环境中返回成功但不执行实际操作
    if (isVercel) {
      console.log('[API] Vercel环境，跳过保存分类操作');
      return Response.json({ success: true, message: '分类保存成功（模拟）' });
    }
    
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
    
    // 在Vercel环境中返回成功但不执行实际操作
    if (isVercel) {
      console.log('[API] 在Vercel环境中出错，返回模拟成功响应');
      return Response.json({ success: true, message: '分类保存成功（模拟）' });
    }
    
    return Response.json(
      { error: error instanceof Error ? error.message : '保存分类失败' },
      { status: 500 }
    );
  }
}

// 更新分类
export async function PUT(request: Request) {
  try {
    // 在Vercel环境中返回成功但不执行实际操作
    if (isVercel) {
      console.log('[API] Vercel环境，跳过更新分类操作');
      return Response.json({ success: true, message: '分类更新成功（模拟）' });
    }
    
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
    
    // 在Vercel环境中返回成功但不执行实际操作
    if (isVercel) {
      console.log('[API] 在Vercel环境中出错，返回模拟成功响应');
      return Response.json({ success: true, message: '分类更新成功（模拟）' });
    }
    
    return Response.json(
      { error: error instanceof Error ? error.message : '更新分类失败' },
      { status: 500 }
    );
  }
}

// 删除分类
export async function DELETE(request: Request) {
  try {
    // 在Vercel环境中返回成功但不执行实际操作
    if (isVercel) {
      console.log('[API] Vercel环境，跳过删除分类操作');
      return Response.json({ success: true, message: '分类删除成功（模拟）' });
    }
    
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
    
    // 在Vercel环境中返回成功但不执行实际操作
    if (isVercel) {
      console.log('[API] 在Vercel环境中出错，返回模拟成功响应');
      return Response.json({ success: true, message: '分类删除成功（模拟）' });
    }
    
    return Response.json(
      { error: error instanceof Error ? error.message : '删除分类失败' },
      { status: 500 }
    );
  }
} 