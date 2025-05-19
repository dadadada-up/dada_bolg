import { NextResponse } from 'next/server';
import { Post } from '@/types/post';
import { getAllPosts } from '@/lib/services/data';
import { initializeSchema } from '@/lib/db/init-schema';

// 内存缓存，用于服务器端缓存
interface ApiCache {
  data: any;
  timestamp: number;
}

// 添加接口层面的缓存，减轻对API的压力
const API_CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存
const apiCache = new Map<string, ApiCache>();

export async function GET(request: Request) {
  try {
    console.log('[文章API] 接收到请求:', request.url);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const sortBy = searchParams.get('sort') || undefined;
    const sortOrder = searchParams.get('order') as 'asc' | 'desc' | undefined;
    
    // 构建缓存键
    const cacheKey = `posts-page${page}-limit${limit}-category${category}-tag${tag}-sort${sortBy}-order${sortOrder}`;
    
    // 检查缓存
    const now = Date.now();
    const cached = apiCache.get(cacheKey);
    if (cached && (now - cached.timestamp < API_CACHE_TTL)) {
      console.log('[文章API] 使用缓存数据');
      return Response.json(cached.data);
    }
    
    console.log(`[文章API] 获取文章列表: 页码=${page}, 限制=${limit}, 分类=${category}, 标签=${tag}`);
    
    // 计算偏移量
    const offset = (page - 1) * limit;
    
    try {
      // 确保数据库表结构已初始化
      try {
        await initializeSchema();
        console.log('[文章API] 数据库表结构初始化成功');
      } catch (schemaError) {
        console.warn('[文章API] 数据库表结构初始化失败，但将继续尝试查询:', schemaError);
      }
      
      // 使用统一数据服务查询
      console.log('[文章API] 开始查询数据库');
      const result = await getAllPosts({
        limit,
        offset,
        category,
        tag
      });
      
      console.log(`[文章API] 查询成功，获取到 ${result.posts.length} 篇文章，总数 ${result.total}`);
      
      const response = {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
        data: result.posts,
        source: 'database'
      };
      
      // 更新缓存
      apiCache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      return Response.json(response);
    } catch (dbError) {
      console.error('[文章API] 数据库查询失败:', dbError);
      
      // 数据库查询失败时抛出错误到上层处理
      throw dbError;
    }
  } catch (error) {
    console.error('[文章API] 获取文章失败:', error);
    
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
    
    return Response.json(
      { 
        error: '获取文章失败', 
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 处理单篇文章获取
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    return Response.json({
      success: false,
      message: '不支持文章创建，请使用本地开发环境'
    }, { status: 403 });
  } catch (error) {
    console.error('处理请求失败:', error);
    return Response.json(
      { error: '处理请求失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 