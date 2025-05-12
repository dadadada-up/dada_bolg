import { NextResponse } from 'next/server';
import { enhancedSyncFromGitHub } from '@/lib/sync-enhancer';
import { clearContentCache } from '@/lib/github';
import { getDb } from '@/lib/db';

// 接口定义
interface SyncStatus {
  sync_in_progress: number;
  last_sync: string | null;
  id: number;
}

interface CountResult {
  count: number;
}

/**
 * 触发增强同步
 */
export async function POST(request: Request) {
  try {
    console.log('[增强同步] 开始执行增强同步...');
    
    // 清除缓存
    await clearContentCache();
    
    // 执行增强同步
    const result = await enhancedSyncFromGitHub();
    
    console.log(`[增强同步] 同步完成：处理 ${result.processed} 篇文章，遇到 ${result.errors} 个错误`);
    
    // 如果有错误，记录详细信息
    if (result.errors > 0) {
      console.error('[增强同步] 同步错误详情:', result.errorDetails);
    }
    
    // 重置同步状态标记
    try {
      const db = getDb();
      const hasTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sync_status'").get();
      
      if (hasTable) {
        db.prepare('UPDATE sync_status SET sync_in_progress = 0 WHERE id = 1').run();
      }
    } catch (dbError) {
      console.error('[增强同步] 重置同步状态失败:', dbError);
    }
    
    return Response.json({
      success: result.success,
      message: `增强同步完成，处理 ${result.processed} 篇文章，遇到 ${result.errors} 个错误`,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[增强同步] 增强同步过程失败:', error);
    
    // 确保同步状态被重置
    try {
      const db = getDb();
      db.prepare('UPDATE sync_status SET sync_in_progress = 0 WHERE id = 1').run();
    } catch (dbError) {
      console.error('[增强同步] 重置同步状态失败:', dbError);
    }
    
    return Response.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

/**
 * 获取同步状态
 */
export async function GET(request: Request) {
  try {
    const db = getDb();
    
    // 检查同步状态表是否存在
    const hasTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sync_status'").get();
    
    let syncStatus = 'idle';
    let lastSync = null;
    let pendingOperations = 0;
    
    if (hasTable) {
      // 获取同步状态
      const status = db.prepare('SELECT * FROM sync_status WHERE id = 1').get() as SyncStatus | undefined;
      
      if (status) {
        syncStatus = status.sync_in_progress ? 'syncing' : 'idle';
        lastSync = status.last_sync;
      }
      
      // 获取待处理操作数量
      const countPending = db.prepare('SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending"').get() as CountResult | undefined;
      pendingOperations = countPending ? countPending.count : 0;
    }
    
    return Response.json({
      status: {
        status: syncStatus,
        lastSync,
        pendingOperations
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[增强同步] 获取同步状态失败:', error);
    
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '获取同步状态失败',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 