import { NextResponse } from 'next/server';
import initializeDatabase from '@/lib/db';
import { createInitialFlag } from '@/lib/sync/service';
import { clearAllGithubCache } from '@/lib/cache/fs-cache';
import { forceRefreshAllData } from '@/lib/github';

// 系统初始化
export async function POST(request: Request) {
  try {
    console.log('[API] 开始系统初始化...');
    
    // 1. 初始化数据库
    initializeDatabase(); // 这是一个void函数，总是会执行
    const dbInitialized = true; // 假设成功，如果失败会抛出异常
    console.log(`[API] 数据库初始化: 成功`);
    
    // 2. 初始化本地文件系统
    const fsInitialized = await createInitialFlag();
    console.log(`[API] 文件系统初始化: ${fsInitialized ? '成功' : '失败'}`);
    
    // 3. 清除缓存
    const cacheCleared = await clearAllGithubCache();
    console.log(`[API] 缓存清除: ${cacheCleared ? '成功' : '失败'}`);
    
    // 4. 强制刷新GitHub数据
    console.log('[API] 强制刷新GitHub数据...');
    const dataRefreshed = await forceRefreshAllData();
    console.log(`[API] 数据刷新: ${dataRefreshed ? '成功' : '失败'}`);
    
    return Response.json({
      success: true,
      message: '系统初始化完成',
      results: {
        database: dbInitialized,
        filesystem: fsInitialized,
        cache: cacheCleared,
        dataRefresh: dataRefreshed
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] 系统初始化失败:', error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '系统初始化失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 