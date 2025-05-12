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

// 清除分类缓存
export async function clearCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTimestamp = 0;
} 