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

// 硬编码一些示例文章数据，作为临时解决方案
const HARDCODED_POSTS: Post[] = [
  {
    slug: 'notion-cursor-guide',
    title: 'Notion + Cursor 使用指南',
    date: '2023-05-07T13:38:08.166Z',
    updated: '2023-05-07T13:38:08.166Z',
    content: '这是关于Notion和Cursor使用指南的内容...',
    excerpt: 'Notion和Cursor如何结合使用的完整指南',
    description: 'Notion和Cursor如何结合使用的完整指南',
    categories: ['技术工具'],
    tags: ['notion', 'cursor', 'productivity'],
    published: true,
    featured: true,
    coverImage: '/images/notion-cursor.png',
    readingTime: 10,
    metadata: {
      wordCount: 2500,
      readingTime: 10,
      originalFile: 'notion-cursor-guide.md'
    }
  },
  {
    slug: 'blog-requirements',
    title: '个人博客项目需求说明书',
    date: '2024-03-20T00:00:00.000Z',
    content: '这是博客项目需求说明书的内容...',
    excerpt: '个人博客项目的详细需求说明和设计文档',
    description: '个人博客项目的详细需求说明和设计文档',
    categories: ['个人博客'],
    tags: ['博客', '项目文档'],
    published: false,
    featured: false,
    readingTime: 15,
    metadata: {
      wordCount: 3500,
      readingTime: 15,
      originalFile: 'blog-requirements.md'
    }
  },
  {
    slug: 'dingtalk-monitor',
    title: 'Dingtalk Monitor',
    date: '2024-03-18T00:00:00.000Z',
    updated: '2023-05-07T15:19:46.980Z',
    content: '这是关于钉钉监控工具的内容...',
    excerpt: '钉钉监控工具的使用说明和最佳实践',
    description: '钉钉监控工具的使用说明和最佳实践',
    categories: ['技术工具'],
    tags: ['钉钉', '监控', '工具'],
    published: true,
    featured: false,
    readingTime: 8,
    metadata: {
      wordCount: 1800,
      readingTime: 8,
      originalFile: 'dingtalk-monitor.md'
    }
  }
];

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
    
    // 使用硬编码的数据作为临时解决方案
    
    // 过滤数据
    let filteredPosts = [...HARDCODED_POSTS];
    
    // 是否包含未发布文章取决于是否是管理员模式
    if (!isAdmin) {
      filteredPosts = filteredPosts.filter(post => post.published);
    }
    
    // 按分类筛选
    if (category) {
      filteredPosts = filteredPosts.filter(post => post.categories.includes(category));
    }
    
    // 按标签筛选
    if (tag) {
      filteredPosts = filteredPosts.filter(post => post.tags.includes(tag));
    }
    
    // 计算总数和分页
    const total = filteredPosts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    
    const response = {
      total,
      page,
      limit,
      totalPages,
      data: paginatedPosts,
    };
    
    // 更新缓存
    apiCache.set(cacheKey, {
      data: response,
      timestamp: now
    });
    
    console.log(`[API] 查询返回文章数: ${paginatedPosts.length}, 总数: ${total}`);
    
    return Response.json(response);
    
    /*
    // 注释掉有问题的数据库代码，等待修复
    
    // 如果是按分类或标签筛选，且不是管理员模式，则只返回已发布的文章
    const includeUnpublished = isAdmin;
    console.log(`[API] 是否包含未发布文章: ${includeUnpublished}`);
    
    // 缓存未命中，从数据库获取数据
    const result = getAllPosts({ 
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
    */
  } catch (error) {
    console.error('Error fetching posts:', error);
    // 出错时也返回硬编码数据的第一页
    const response = {
      total: HARDCODED_POSTS.length,
      page: 1,
      limit: 10,
      totalPages: Math.ceil(HARDCODED_POSTS.length / 10),
      data: HARDCODED_POSTS.slice(0, 10),
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
    const post = getPostBySlug(data.slug);
    
    // 添加文章到同步队列
    const { queuePostChange } = await import('@/lib/sync-service');
    await queuePostChange('create', post as Post);
    
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