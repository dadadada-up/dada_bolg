import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/fs-cache';

export async function GET(request: Request) {
  try {
    // 获取各种缓存的状态
    const postsStats = await getCacheStats('github-posts');
    const contentStats = await getCacheStats('github-content');
    const treeStats = await getCacheStats('github-tree');
    
    return Response.json({
      success: true,
      cacheStats: {
        posts: {
          count: postsStats.count,
          size: Math.round(postsStats.size / 1024), // KB
          oldestTimestamp: postsStats.oldestTimestamp,
          newestTimestamp: postsStats.newestTimestamp
        },
        content: {
          count: contentStats.count,
          size: Math.round(contentStats.size / 1024), // KB
          oldestTimestamp: contentStats.oldestTimestamp,
          newestTimestamp: contentStats.newestTimestamp
        },
        tree: {
          count: treeStats.count,
          size: Math.round(treeStats.size / 1024), // KB
          oldestTimestamp: treeStats.oldestTimestamp,
          newestTimestamp: treeStats.newestTimestamp
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取缓存状态失败:', error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '获取缓存状态失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 