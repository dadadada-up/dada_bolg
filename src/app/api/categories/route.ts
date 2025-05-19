import { NextResponse } from 'next/server';
import { fallbackCategories } from '@/lib/fallback-data';
import { query } from '@/lib/db/database';
import { initializeSchema } from '@/lib/db/init-schema';

export async function GET(request: Request) {
  try {
    console.log('[分类API] 接收到请求:', request.url);
    
    // 确保数据库表结构已初始化
    try {
      await initializeSchema();
      console.log('[分类API] 数据库表结构初始化成功');
    } catch (schemaError) {
      console.warn('[分类API] 数据库表结构初始化失败，但将继续尝试查询:', schemaError);
    }
    
    // 尝试从数据库获取分类
    try {
      console.log('[分类API] 开始查询数据库');
      
      // 从数据库获取分类
      const sql = `SELECT id, name, slug, description FROM categories ORDER BY name`;
      const dbCategories = await query(sql);
      
      if (dbCategories && dbCategories.length > 0) {
        console.log(`[分类API] 从数据库成功获取 ${dbCategories.length} 个分类`);
        return Response.json(dbCategories);
      } else {
        console.log('[分类API] 数据库中没有分类数据');
      }
    } catch (dbError) {
      console.error('[分类API] 从数据库获取分类失败:', dbError);
    }
    
    // 如果数据库查询失败，使用备用数据
    console.log('[分类API] 使用备用分类数据');
    return Response.json(fallbackCategories);
  } catch (error) {
    console.error('[分类API] 获取分类失败:', error);
    
    // 获取更详细的错误信息
    let errorMessage = '未知错误';
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack,
      };
    }
    
    // 最后的回退，即使发生错误也返回一些数据
    return Response.json(
      { 
        error: '获取分类失败', 
        message: errorMessage,
        details: errorDetails,
        data: fallbackCategories,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 