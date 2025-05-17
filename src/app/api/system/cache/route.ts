import { NextResponse } from 'next/server';
import { forceRefreshAllData } from '@/lib/github';
import { clearAllGithubCache } from '@/lib/cache/fs-cache';
import { syncBidirectional } from '@/lib/sync/service';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    console.log('[API] 开始强制刷新并重新同步...');
    
    // 1. 清理内存和文件系统缓存
    console.log('[API] 强制刷新缓存...');
    const cacheRefreshed = await clearAllGithubCache();
    
    // 2. 强制刷新所有GitHub数据
    console.log('[API] 强制刷新GitHub数据...');
    const dataRefreshed = await forceRefreshAllData();
    
    // 3. 执行双向同步
    console.log('[API] 开始强制执行同步...');
    const syncResult = await syncBidirectional();
    
    // 4. 重置同步状态
    console.log('[API] 重置同步状态...');
    const db = await getDb();
    await db.run('UPDATE sync_status SET sync_in_progress = 0 WHERE id = 1');
    
    return Response.json({
      success: true,
      message: '强制刷新和同步完成',
      results: {
        cacheRefreshed,
        dataRefreshed,
        syncResult
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] 强制刷新和同步失败:', error);
    
    // 确保同步状态被重置
    try {
      const db = await getDb();
      await db.run('UPDATE sync_status SET sync_in_progress = 0 WHERE id = 1');
    } catch (dbError) {
      console.error('[API] 重置同步状态失败:', dbError);
    }
    
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '强制刷新和同步失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 