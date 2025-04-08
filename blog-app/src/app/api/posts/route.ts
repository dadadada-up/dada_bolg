import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/github';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const posts = await getPosts();
    
    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPosts = posts.slice(startIndex, endIndex);
    
    return Response.json({
      total: posts.length,
      page,
      limit,
      totalPages: Math.ceil(posts.length / limit),
      data: paginatedPosts,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return Response.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
} 