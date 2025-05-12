import { NextResponse } from 'next/server';
import { Post } from '@/types/post';
import { slugify } from '@/lib/utils';
import { postRepository } from '@/lib/db/repositories';
import { initializeDatabase } from '@/lib/db/database';

// 确保数据库初始化
initializeDatabase().catch(console.error);

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
    const search = searchParams.get('search') || undefined;
    const searchField = searchParams.get('searchField') || undefined; // 添加搜索字段限制参数
    const status = searchParams.get('status') || undefined;
    const sortBy = searchParams.get('sort') || undefined;
    const sortOrder = searchParams.get('order') as 'asc' | 'desc' | undefined;
    const isAdmin = searchParams.get('admin') === 'true';
    
    // 输出更详细的日志，帮助调试
    console.log(`[API] 收到请求参数:
    - 页码: ${page}
    - 每页数量: ${limit}
    - 分类: ${category || '无'}
    - 标签: ${tag || '无'}
    - 搜索关键词: ${search || '无'}
    - 搜索字段: ${searchField || '全部'}
    - 状态: ${status || '全部'}
    - 管理员模式: ${isAdmin}
    - 排序字段: ${sortBy || 'created_at'}
    - 排序方向: ${sortOrder || 'desc'}
    `);
    
    // 生成随机的缓存后缀，确保每次查询都是新鲜的结果
    const cacheSuffix = Math.random().toString(36).substring(2, 8);
    
    // 构建缓存键，确保每个不同的筛选组合有唯一的缓存键
    const cacheKey = `posts-page${page}-limit${limit}-category${category || 'all'}-tag${tag || 'all'}-search${search || 'none'}-searchField${searchField || 'all'}-status${status || 'all'}-sort${sortBy || 'updated_at'}-order${sortOrder || 'desc'}-admin${isAdmin ? 'yes' : 'no'}`;
    
    // 在开发环境中禁用缓存，在生产环境中启用
    const useCache = process.env.NODE_ENV === 'production';
    
    // 检查缓存
    const now = Date.now();
    const cached = useCache ? apiCache.get(cacheKey) : null;
    if (cached && (now - cached.timestamp < API_CACHE_TTL)) {
      console.log('[API] 使用缓存的文章数据');
      return Response.json(cached.data);
    }
    
    console.log(`[API] 获取文章列表: 分类=${category}, 标签=${tag}, 搜索=${search}, 搜索字段=${searchField}, 状态=${status}, 管理员=${isAdmin}`);
    
    // 如果是按分类或标签筛选，且不是管理员模式，则只返回已发布的文章
    const includeUnpublished = isAdmin;
    console.log(`[API] 是否包含未发布文章: ${includeUnpublished}`);
    
    // 根据状态参数设置发布状态过滤
    let publishedFilter: boolean | undefined = undefined;
    if (status === 'published') {
      publishedFilter = true;
    } else if (status === 'draft') {
      publishedFilter = false;
    }
    
    // 从数据库获取数据
    const result = await postRepository.getAllPosts({ 
      limit, 
      offset: (page - 1) * limit,
      category,
      tag,
      search,
      searchField, // 传递搜索字段限制
      published: publishedFilter,
      sortBy,
      sortOrder,
      includeUnpublished
    });
    
    console.log(`[API] 查询返回文章数: ${result.posts.length}, 总数: ${result.total}`);
    
    const response = {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
      data: result.posts,
    };
    
    // 结果列表中的标题（用于调试）
    if (result.posts.length > 0) {
      console.log(`[API] 返回文章标题: ${result.posts.map(p => p.title).join(', ')}`);
    }
    
    // 更新缓存
    apiCache.set(cacheKey, {
      data: response,
      timestamp: now
    });
    
    return Response.json(response);
    
  } catch (error) {
    console.error('Error fetching posts:', error);
    // 出错时返回空结果
    const response = {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      data: [],
    };
    return Response.json(response);
  }
}

// 当创建新文章时清除所有API缓存
function clearApiCache() {
  apiCache.clear();
}

export async function POST(request: Request) {
  try {
    const postData = await request.json();
    
    // 验证必要字段
    if (!postData.title || !postData.content) {
      return Response.json(
        { error: '标题和内容是必需的' },
        { status: 400 }
      );
    }
    
    // 添加默认字段
    const post: Post = {
      ...postData,
      slug: postData.slug || slugify(postData.title),
      date: postData.date || new Date().toISOString(),
      published: postData.published !== undefined ? postData.published : true,
      categories: postData.categories || [],
      tags: postData.tags || []
    };
    
    // 保存文章
    const postId = await postRepository.savePost(post);
    
    // 清除缓存
    clearApiCache();
    
    // 获取保存后的完整文章数据
    const savedPost = await postRepository.getPostBySlug(post.slug);
    
    return Response.json({
      success: true,
      postId,
      post: savedPost
    });
  } catch (error) {
    console.error('创建文章失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '创建文章失败' },
      { status: 500 }
    );
  }
} 