import { NextResponse } from 'next/server';
import { getPosts as getGithubPosts, createPost as createGithubPost, clearContentCache } from '@/lib/github';
import { getAllPosts, getPostBySlug, deletePost } from '@/lib/db/posts';
import { savePostSafe } from '@/lib/db/posts-patch';
import { queuePostChange } from '@/lib/sync/service';
import { Post } from '@/types/post';
import { slugify, enhancedSlugify } from '@/lib/utils';
import initializeDatabase from '@/lib/db';

// 确保数据库初始化
initializeDatabase();

// 内存缓存，用于服务器端缓存
interface ApiCache {
  data: any;
  timestamp: number;
}

// 添加接口层面的缓存，减轻对数据库和GitHub API的压力
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
    const isAdmin = searchParams.get('admin') === 'true'; // 添加管理员参数
    
    // 构建缓存键
    const cacheKey = `posts-page${page}-limit${limit}-category${category}-tag${tag}-sort${sortBy}-order${sortOrder}-admin${isAdmin}`;
    
    // 检查缓存
    const now = Date.now();
    const cached = apiCache.get(cacheKey);
    if (cached && (now - cached.timestamp < API_CACHE_TTL)) {
      return Response.json(cached.data);
    }
    
    console.log(`[API] 获取文章列表: 分类=${category}, 标签=${tag}, 管理员=${isAdmin}`);
    
    // 如果是按分类或标签筛选，且不是管理员模式，则只返回已发布的文章
    const includeUnpublished = isAdmin;
    console.log(`[API] 是否包含未发布文章: ${includeUnpublished}`);
    
    // 缓存未命中，从数据库获取数据
    const result = await getAllPosts({ 
      limit, 
      offset: (page - 1) * limit,
      category,
      tag,
      sortBy,
      sortOrder,
      includeUnpublished // 只有管理员可以看到未发布文章
    });
    
    console.log(`[API] 查询返回文章数: ${result.posts.length}, 总数: ${result.total}`);
    
    const response = {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
      data: result.posts,
    };
    
    // 更新缓存
    apiCache.set(cacheKey, {
      data: response,
      timestamp: now
    });
    
    return Response.json(response);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return Response.json(
      { error: '获取文章失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
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
    const post = await getPostBySlug(data.slug);
    
    // 添加文章到同步队列
    if (post) {
      await queuePostChange('create', post);
    }
    
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