import { NextResponse } from 'next/server';
import { getAllFallbackPosts } from '@/lib/fallback-data';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log(`[API] 获取文章详情: ${slug}`);
    
    // 从备用数据中查找文章
    const posts = getAllFallbackPosts();
    const post = posts.find(p => p.slug === slug);
    
    if (!post) {
      console.log(`[API] 文章未找到: ${slug}`);
      return Response.json({ error: '文章未找到' }, { status: 404 });
    }
    
    return Response.json(post);
  } catch (error) {
    console.error(`[API] 获取文章失败 ${params.slug}:`, error);
    return Response.json(
      { error: error instanceof Error ? error.message : '获取文章失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  return Response.json(
    { error: 'Vercel部署环境不支持文章编辑，请使用本地开发环境' },
    { status: 403 }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  return Response.json(
    { error: 'Vercel部署环境不支持文章删除，请使用本地开发环境' },
    { status: 403 }
  );
} 