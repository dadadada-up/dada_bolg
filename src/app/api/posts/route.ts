import { NextResponse } from 'next/server';
import { getAllFallbackPosts } from '@/lib/fallback-data';
import { Post } from '@/types/post';

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
    
    // 使用备用数据
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
    
    // 排序
    if (sortBy && posts.length > 0 && posts[0][sortBy as keyof Post] !== undefined) {
      posts.sort((a, b) => {
        const aValue = a[sortBy as keyof Post];
        const bValue = b[sortBy as keyof Post];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        return 0;
      });
    } else {
      // 默认按日期降序排序
      posts.sort((a, b) => {
        const aDate = new Date(a.date || '').getTime();
        const bDate = new Date(b.date || '').getTime();
        return bDate - aDate;
      });
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
    apiCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });
    
    return Response.json(response);
  } catch (error) {
    console.error('[文章API] 获取文章失败:', error);
    
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

// 处理单篇文章获取
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    return Response.json({
      success: true,
      message: 'Vercel部署环境不支持文章创建，请使用本地开发环境'
    });
  } catch (error) {
    console.error('处理请求失败:', error);
    return Response.json(
      { error: '处理请求失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 