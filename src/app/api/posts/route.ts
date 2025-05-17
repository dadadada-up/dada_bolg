import { NextResponse } from 'next/server';
import { getAllFallbackPosts } from '@/lib/fallback-data';
import { Post } from '@/types/post';
import { getAllPosts } from '@/lib/db/posts';
import { savePostSafe, getPostBySqlite } from '@/lib/db/posts-patch';
import initializeDb from '@/lib/db';
import { query } from '@/lib/db/database';

// 内存缓存，用于服务器端缓存
interface ApiCache {
  data: any;
  timestamp: number;
}

// 添加接口层面的缓存，减轻对数据库和GitHub API的压力
const API_CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存
const apiCache = new Map<string, ApiCache>();

// 初始化数据库连接
let dbInitialized = false;
async function ensureDbInitialized() {
  // 取消缓存机制，每次都重新初始化
  console.log('[文章API] 初始化数据库连接...');
  try {
    await initializeDb();
    console.log('[文章API] 数据库初始化成功');
    dbInitialized = true;
    return true;
  } catch (error) {
    console.error('[文章API] 数据库初始化失败:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const sortBy = searchParams.get('sort') || undefined;
    const sortOrder = searchParams.get('order') as 'asc' | 'desc' | undefined;
    const isAdmin = searchParams.get('admin') === 'true';
    const forceFallback = searchParams.get('fallback') === 'true'; 
    const useDb = searchParams.get('usedb') === 'true'; 
    
    // 如果强制使用备用数据，直接返回
    if (forceFallback) {
      console.log('[文章API] 强制使用备用数据');
      return useBackupData(page, limit, category, tag);
    }
    
    // 构建缓存键
    const cacheKey = `posts-page${page}-limit${limit}-category${category}-tag${tag}-sort${sortBy}-order${sortOrder}-admin${isAdmin}`;
    
    // 检查缓存 (仅当不强制使用数据库时)
    if (!useDb) {
      const now = Date.now();
      const cached = apiCache.get(cacheKey);
      if (cached && (now - cached.timestamp < API_CACHE_TTL)) {
        console.log('[文章API] 使用缓存数据');
        return Response.json(cached.data);
      }
    } else {
      console.log('[文章API] 强制使用数据库，跳过缓存');
    }
    
    console.log(`[文章API] 获取文章列表: 请求URL=${request.url}, 分类=${category}, 标签=${tag}, 管理员=${isAdmin}`);
    
    // 确保数据库已初始化
    try {
      await ensureDbInitialized();
      
      // 从数据库获取数据
      console.log('[文章API] 从数据库获取文章数据');
      const result = await getAllPosts({
        limit,
        offset: (page - 1) * limit,
        category,
        tag,
        sortBy,
        sortOrder,
        includeUnpublished: isAdmin
      });
      
      console.log(`[文章API] 数据库返回文章数: ${result.posts.length}, 总数: ${result.total}`);
      
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
      
      console.log('[文章API] 成功从数据库返回文章数据');
      return Response.json(response);
    } catch (dbError) {
      console.error('[文章API] 数据库查询失败:', dbError);
      console.error('[文章API] 错误详情:', dbError instanceof Error ? dbError.stack : '无堆栈信息');
      console.log('[文章API] 回退到备用数据');
      return useBackupData(page, limit, category, tag, cacheKey);
    }
  } catch (error) {
    console.error('[文章API] 获取文章失败:', error);
    console.error('[文章API] 错误详情:', error instanceof Error ? error.stack : '无堆栈信息');
    
    return Response.json(
      { 
        error: '获取文章失败', 
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 使用备用数据的内部函数
function useBackupData(page: number, limit: number, category?: string, tag?: string, cacheKey?: string) {
  console.log('[文章API] 使用备用数据');
  let posts = getAllFallbackPosts();
  
  // 根据分类过滤
  if (category) {
    posts = posts.filter(post => 
      post.categories && post.categories.some(cat => 
        cat.toLowerCase() === category.toLowerCase() || 
        cat.toLowerCase().replace(/\s+/g, '-') === category.toLowerCase()
      )
    );
  }
  
  // 根据标签过滤
  if (tag) {
    posts = posts.filter(post => 
      post.tags && post.tags.some(t => 
        t.toLowerCase() === tag.toLowerCase() || 
        t.toLowerCase().replace(/\s+/g, '-') === tag.toLowerCase()
      )
    );
  }
  
  // 计算总页数
  const total = posts.length;
  const totalPages = Math.ceil(total / limit);
  
  // 分页
  const start = (page - 1) * limit;
  const end = start + limit;
  const pagedPosts = posts.slice(start, end);
  
  const response = {
    total,
    page,
    limit,
    totalPages,
    data: pagedPosts,
    source: 'fallback'
  };
  
  // 更新缓存
  if (cacheKey) {
    apiCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });
  }
  
  return Response.json(response);
}

// 当创建新文章时清除所有API缓存
function clearApiCache() {
  apiCache.clear();
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 验证必要字段
    if (!data.title || !data.content) {
      return Response.json(
        { error: '标题和内容是必需的' },
        { status: 400 }
      );
    }
    
    // 添加默认字段
    if (!data.date) {
      data.date = new Date().toISOString();
    }
    
    if (!data.published && data.published !== false) {
      data.published = true;
    }
    
    // 使用安全版本保存文章
    const postId = savePostSafe(data as Post);
    
    // 获取完整的文章数据
    const post = await getPostBySqlite(data.slug);
    
    return Response.json({
      success: true,
      postId,
      post
    });
  } catch (error) {
    console.error('创建文章失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '创建文章失败' },
      { status: 500 }
    );
  }
} 