import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/github';
import { markdownToHtml } from '@/lib/markdown';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const posts = await getPosts();
    const post = posts.find((post) => post.slug === params.slug);
    
    if (!post) {
      return Response.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // 将 Markdown 转换为 HTML
    const html = await markdownToHtml(post.content);
    
    return Response.json({
      ...post,
      html,
    });
  } catch (error) {
    console.error(`Error fetching post ${params.slug}:`, error);
    return Response.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
} 