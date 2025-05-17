import { NextResponse } from 'next/server';
import { clearContentCache } from '@/lib/github';
import { clearAllGithubCache, getCacheStats } from '@/lib/cache/fs-cache';

export async function GET(request: Request) {
  try {
    // 获取缓存状态（清除前）
    const beforeStats = {
      posts: await getCacheStats('github-posts'),
      content: await getCacheStats('github-content'),
      tree: await getCacheStats('github-tree')
    };
    
    // 清除所有缓存
    clearContentCache();
    
    // 等待 500ms 确保异步清除任务开始
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 获取清除后的缓存状态
    const afterStats = {
      posts: await getCacheStats('github-posts'),
      content: await getCacheStats('github-content'),
      tree: await getCacheStats('github-tree')
    };
    
    return Response.json({
      success: true,
      message: '缓存清除命令已执行',
      before: beforeStats,
      after: afterStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('清除缓存失败:', error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '清除缓存时发生未知错误', 
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    );
  }
}

// 添加 POST 方法支持，方便在无法使用 GET 时使用
export async function POST(request: Request) {
  return GET(request);
} 