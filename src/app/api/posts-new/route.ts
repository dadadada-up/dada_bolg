/**
 * 文章API（新版）
 * 
 * 使用统一数据服务获取文章数据
 */

import { NextResponse } from 'next/server';
import { getAllPosts, searchPosts } from '@/lib/services/data';
import { 
  dynamicConfig, 
  getQueryParam, 
  getNumberQueryParam, 
  getBooleanQueryParam,
  handleApiError
} from '@/lib/api/route-config';

// 强制动态路由，防止静态生成
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // 使用安全的查询参数获取方法
    const page = getNumberQueryParam(request, 'page', 1);
    const limit = getNumberQueryParam(request, 'limit', 10);
    const category = getQueryParam(request, 'category');
    const tag = getQueryParam(request, 'tag');
    const status = getQueryParam(request, 'status');
    const search = getQueryParam(request, 'search');
    const sort = getQueryParam(request, 'sort');
    const order = getQueryParam(request, 'order') as 'asc' | 'desc' | undefined;
    const admin = getBooleanQueryParam(request, 'admin', false); // 管理员模式，包含未发布的文章
    
    // 计算偏移量
    const offset = (page - 1) * limit;
    
    try {
      let result;
      
      // 如果有搜索关键词，使用搜索接口
      if (search) {
        result = await searchPosts(search, { limit, offset });
      } else {
        // 否则获取所有文章
        result = await getAllPosts({
          includeUnpublished: admin, // 管理员模式下包含未发布的文章
          limit,
          offset,
          category,
          tag
        });
      }
      
      // 如果指定了状态筛选，在内存中进行筛选
      // 因为数据库层没有直接提供状态筛选的功能
      let filteredPosts = result.posts;
      if (status && status !== 'all') {
        filteredPosts = filteredPosts.filter(post => 
          (status === 'published' && post.is_published) || 
          (status === 'draft' && !post.is_published)
        );
      }
      
      // 构建响应
      const response = {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
        data: filteredPosts,
        source: 'unified-data-service'
      };
      
      return Response.json(response);
    } catch (dbError) {
      console.error('[文章API-新] 数据库查询失败:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('[文章API-新] 获取文章失败:', error);
    
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