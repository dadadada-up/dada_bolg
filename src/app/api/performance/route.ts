import { NextResponse } from 'next/server';
import { 
  getPerformanceReport, 
  optimizeCaches,
  preloadHomePageData
} from '@/lib/performance-optimizer';
import { getCacheStats } from '@/lib/fs-cache';

/**
 * 性能优化API
 * 提供缓存管理、性能报告和优化功能
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'status';
    
    // 获取性能状态
    if (action === 'status') {
      // 获取各种缓存的状态
      const postsStats = await getCacheStats('github-posts');
      const contentStats = await getCacheStats('github-content');
      const treeStats = await getCacheStats('github-tree');
      
      const performanceMetrics = getPerformanceReport();
      
      return Response.json({
        success: true,
        performanceMetrics,
        cacheStats: {
          posts: {
            count: postsStats.count,
            size: formatSize(postsStats.size),
            oldestTimestamp: postsStats.oldestTimestamp 
              ? new Date(postsStats.oldestTimestamp).toISOString()
              : null,
            newestTimestamp: postsStats.newestTimestamp
              ? new Date(postsStats.newestTimestamp).toISOString()
              : null
          },
          content: {
            count: contentStats.count,
            size: formatSize(contentStats.size),
            oldestTimestamp: contentStats.oldestTimestamp
              ? new Date(contentStats.oldestTimestamp).toISOString()
              : null,
            newestTimestamp: contentStats.newestTimestamp
              ? new Date(contentStats.newestTimestamp).toISOString()
              : null
          },
          tree: {
            count: treeStats.count,
            size: formatSize(treeStats.size),
            oldestTimestamp: treeStats.oldestTimestamp
              ? new Date(treeStats.oldestTimestamp).toISOString()
              : null,
            newestTimestamp: treeStats.newestTimestamp
              ? new Date(treeStats.newestTimestamp).toISOString()
              : null
          }
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // 优化缓存
    if (action === 'optimize') {
      const result = await optimizeCaches();
      return Response.json({
        success: result.success,
        report: result.report,
        optimizedItems: result.optimizedItems,
        timestamp: new Date().toISOString()
      });
    }
    
    // 预热首页缓存
    if (action === 'preload-home') {
      const success = await preloadHomePageData();
      return Response.json({
        success,
        message: success ? '首页数据预热成功' : '首页数据预热失败',
        timestamp: new Date().toISOString()
      });
    }
    
    return Response.json({
      success: false,
      error: `未知操作: ${action}`,
      validActions: ['status', 'optimize', 'preload-home'],
      timestamp: new Date().toISOString()
    }, { status: 400 });
  } catch (error) {
    console.error('性能操作失败:', error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    );
  }
}

/**
 * 针对优化请求的POST方法支持
 */
export async function POST(request: Request) {
  // 支持通过POST调用相同的功能
  return GET(request);
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
} 