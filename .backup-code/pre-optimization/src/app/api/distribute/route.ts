import { NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/github";
import { publishToMultiplePlatforms } from "@/lib/utils/platforms";

export async function POST(request: Request) {
  try {
    const { slug, platforms } = await request.json();
    
    // 验证输入
    if (!slug) {
      return Response.json(
        { error: '缺少文章slug参数' },
        { status: 400 }
      );
    }
    
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return Response.json(
        { error: '缺少平台参数或格式不正确' },
        { status: 400 }
      );
    }
    
    // 获取文章
    const post = await getPostBySlug(slug);
    if (!post) {
      return Response.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }
    
    // 分发到选定的平台
    console.log(`正在分发文章 "${post.title}" 到以下平台: ${platforms.join(', ')}`);
    const results = await publishToMultiplePlatforms(post, platforms);
    
    // 统计成功和失败的平台数
    const successCount = Object.values(results).filter(r => r.success).length;
    const failureCount = Object.values(results).filter(r => !r.success).length;
    
    return Response.json({
      success: true,
      message: `文章已分发到 ${successCount} 个平台${failureCount > 0 ? `，${failureCount} 个平台失败` : ''}`,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('内容分发失败:', error);
    
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '内容分发失败',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 