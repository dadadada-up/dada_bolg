/**
 * 数据库同步API
 * 
 * 此API用于触发Turso和SQLite之间的数据同步
 * 仅在开发环境中可用，生产环境将返回404
 */

import { NextResponse } from 'next/server';
import { performFullSync, backupSQLiteDatabase } from '@/lib/services/data/sync';

// 锁定机制，防止并发同步
let isSyncing = false;

// 最后同步状态
let lastSyncResult = null;

// 同步历史
export const syncHistory = [];

// 同步选项接口
interface SyncOptions {
  autoBackup?: boolean;
  options?: {
    categories?: boolean;
    tags?: boolean;
    posts?: boolean;
    postCategories?: boolean;
    postTags?: boolean;
    slugMappings?: boolean;
  };
}

export async function POST(request: Request) {
  // 仅在开发环境中可用
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: '此API仅在开发环境中可用' },
      { status: 404 }
    );
  }
  
  // 防止并发同步
  if (isSyncing) {
    return Response.json(
      { error: '同步操作已在进行中，请稍后再试' },
      { status: 409 }
    );
  }
  
  try {
    isSyncing = true;
    
    // 解析请求数据
    const data: SyncOptions = await request.json().catch(() => ({}));
    
    // 处理自动备份
    if (data.autoBackup !== false) { // 默认为true
      console.log('[SyncAPI] 同步前自动备份');
      const backupPath = await backupSQLiteDatabase();
      
      if (backupPath) {
        console.log(`[SyncAPI] 数据库已备份到: ${backupPath}`);
      } else {
        console.warn('[SyncAPI] 数据库备份失败或没有需要备份的数据库');
      }
    }
    
    console.log('[SyncAPI] 开始同步数据库');
    console.log('[SyncAPI] 同步选项:', data.options || '全部');
    
    const syncStartTime = new Date();
    const success = await performFullSync(data.options);
    
    // 记录同步结果
    const syncEndTime = new Date();
    const duration = (syncEndTime.getTime() - syncStartTime.getTime()) / 1000;
    
    lastSyncResult = {
      timestamp: syncEndTime.toISOString(),
      success,
      duration,
      options: data.options
    };
    
    // 添加到历史记录
    syncHistory.unshift({
      id: syncEndTime.getTime().toString(),
      timestamp: syncEndTime.toISOString(),
      success,
      duration,
      options: data.options
    });
    
    // 只保留最近10条记录
    if (syncHistory.length > 10) {
      syncHistory.pop();
    }
    
    if (success) {
      return Response.json({
        success: true,
        message: '数据库同步成功完成',
        duration,
        timestamp: syncEndTime.toISOString()
      });
    } else {
      return Response.json(
        { 
          success: false,
          error: '数据库同步失败，请查看服务器日志',
          duration,
          timestamp: syncEndTime.toISOString() 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[SyncAPI] 同步操作失败:', error);
    
    return Response.json(
      { 
        success: false,
        error: '同步操作失败',
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    isSyncing = false;
  }
}

// 获取同步状态
export async function GET() {
  // 仅在开发环境中可用
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: '此API仅在开发环境中可用' },
      { status: 404 }
    );
  }
  
  return Response.json({
    is_syncing: isSyncing,
    last_sync: lastSyncResult,
    history: syncHistory.slice(0, 5) // 只返回最近5条记录
  });
} 