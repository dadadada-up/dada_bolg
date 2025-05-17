/**
 * 文章API（新版）
 * 
 * 使用统一数据服务获取文章数据
 */

import { NextResponse } from 'next/server';
import { getAllPosts, searchPosts } from '@/lib/services/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = searchParams.get('sort') || undefined;
    const order = searchParams.get('order') as 'asc' | 'desc' | undefined;
    const admin = searchParams.get('admin') === 'true'; // 管理员模式，包含未发布的文章
    
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