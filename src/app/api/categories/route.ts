import { NextResponse } from 'next/server';
import { Category } from '@/types/post';
import { categoryRepository } from '@/lib/db/repositories';
import { initializeDatabase } from '@/lib/db/database';

// 添加内存缓存
let categoriesCache: Category[] | null = null;
let categoriesCacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存

// 初始化数据库连接
console.log('[分类API] 初始化数据库连接...');
try {
  initializeDatabase().catch(error => {
    console.error('[分类API] 数据库初始化失败:', error);
  });
  console.log('[分类API] 数据库初始化请求已发送');
} catch (error) {
  console.error('[分类API] 数据库初始化请求失败:', error);
}

export async function GET(request: Request) {
  try {
    console.log(`[分类API] 接收到请求: ${request.url}`);
    
    // 检查缓存是否有效
    const now = Date.now();
    if (categoriesCache && (now - categoriesCacheTimestamp < CACHE_TTL)) {
      console.log('[分类API] 使用缓存的分类数据');
      return Response.json(categoriesCache);
    }
    
    // 从数据库获取分类数据
    console.log('[分类API] 从数据库获取分类数据');
    try {
      const categories = await categoryRepository.getAllCategories();
      
      console.log(`[分类API] 返回 ${categories.length} 个分类`);
      
      // 更新缓存
      categoriesCache = categories;
      categoriesCacheTimestamp = now;
      
      return Response.json(categories);
    } catch (dbError) {
      console.error('[分类API] 数据库查询失败:', dbError);
      throw new Error(`数据库查询分类失败: ${dbError instanceof Error ? dbError.message : '未知错误'}`);
    }
  } catch (error) {
    console.error('[分类API] 获取分类失败:', error);
    console.error('[分类API] 错误详情:', error instanceof Error ? error.stack : '无堆栈信息');
    
    // 出错时返回错误信息和500状态码
    return Response.json(
      { error: '获取分类失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// 清除分类缓存 - 改为内部函数，非导出
function clearCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTimestamp = 0;
} 