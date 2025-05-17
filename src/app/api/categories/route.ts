import { NextResponse } from 'next/server';
import { Category } from '@/types/post';
import { categoryRepository } from '@/lib/db/repositories';
import initializeDb from '@/lib/db';
import { query } from '@/lib/db/database';
import { fallbackCategories } from '@/lib/fallback-data';

// 添加内存缓存
let categoriesCache: Category[] | null = null;
let categoriesCacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存

// 初始化数据库连接
let dbInitialized = false;
async function ensureDbInitialized() {
  if (dbInitialized) return;
  
  console.log('[分类API] 初始化数据库连接...');
  try {
    await initializeDb();
    console.log('[分类API] 数据库初始化成功');
    dbInitialized = true;
  } catch (error) {
    console.error('[分类API] 数据库初始化失败:', error);
    throw error;
  }
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
    
    // 先确保数据库已初始化
    try {
      await ensureDbInitialized();
      
      // 调试：检查数据库表是否存在
      const tablesCheck = await query("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'");
      console.log(`[分类API] 数据库中的categories表:`, tablesCheck && tablesCheck.length > 0);
      
      if (!tablesCheck || tablesCheck.length === 0) {
        console.log('[分类API] categories表不存在，使用备用数据');
        return useBackupCategories();
      }
      
      // 从数据库获取分类数据
      console.log('[分类API] 从数据库获取分类数据');
      const categories = await categoryRepository.getAllCategories();
      
      console.log(`[分类API] 返回 ${categories.length} 个分类`);
      
      if (categories.length === 0) {
        console.log('[分类API] 数据库没有分类数据，使用备用数据');
        return useBackupCategories();
      }
      
      // 更新缓存
      categoriesCache = categories;
      categoriesCacheTimestamp = now;
      
      return Response.json(categories);
    } catch (dbError) {
      console.error('[分类API] 数据库查询失败:', dbError);
      console.error('[分类API] 错误详情:', dbError instanceof Error ? dbError.stack : '无堆栈信息');
      console.log('[分类API] 使用备用分类数据');
      
      return useBackupCategories();
    }
  } catch (error) {
    console.error('[分类API] 获取分类失败:', error);
    console.error('[分类API] 错误详情:', error instanceof Error ? error.stack : '无堆栈信息');
    
    // 出错时返回错误信息和500状态码
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

// 使用备用分类数据
function useBackupCategories() {
  console.log('[分类API] 使用备用分类数据');
  
  // 更新缓存
  categoriesCache = fallbackCategories;
  categoriesCacheTimestamp = Date.now();
  
  return Response.json(fallbackCategories);
}

// 清除分类缓存 - 改为内部函数，非导出
function clearCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTimestamp = 0;
} 