import { NextResponse } from 'next/server';
import { 
  syncFromGitHub, 
  syncToGitHub, 
  syncBidirectional, 
  syncFromLocal,
  syncToLocal,
  getSyncStatus 
} from '@/lib/sync-service';
import { getDatabase } from '@/lib/db/database';
import { SyncService } from '@/lib/db/sync';

// 检测是否在Vercel环境中
const isVercel = process.env.VERCEL === '1';

// 同步锁，防止并发同步操作
let syncInProgress = false;
let lastSyncTime: string | null = null;

// 获取同步状态
export async function GET() {
  // 在Vercel环境中返回模拟数据
  if (isVercel) {
    console.log('[API] Vercel环境，返回模拟同步状态');
    return Response.json({
      status: {
        status: 'idle',
        lastSync: new Date().toISOString(),
        pendingOperations: 0,
        environment: 'vercel'
      }
    });
  }
  
  // 构造与客户端期望格式一致的响应
  const status = {
    status: syncInProgress ? 'syncing' : 'idle',
    lastSync: lastSyncTime,
    pendingOperations: 0  // 可以在未来实现从队列获取
  };
  
  return Response.json({ status });
}

// 触发同步
export async function POST(request: Request) {
  try {
    // 在Vercel环境中返回模拟数据
    if (isVercel) {
      console.log('[API] Vercel环境，返回模拟同步结果');
      return Response.json({
        success: true,
        message: 'Vercel环境中的模拟同步操作',
        result: {
          added: 0,
          updated: 0,
          deleted: 0,
          skipped: 0,
          environment: 'vercel'
        }
      });
    }
    
    // 检查是否有同步操作正在进行
    if (syncInProgress) {
      return Response.json(
        { success: false, message: '同步操作正在进行，请稍后再试' },
        { status: 409 }
      );
    }
    
    // 设置同步锁
    syncInProgress = true;
    
    // 初始化数据库
    try {
      await getDatabase();
    } catch (error) {
      console.error('[API] 数据库初始化失败:', error);
      syncInProgress = false;
      return Response.json(
        { 
          success: false, 
          message: '数据库初始化失败', 
          error: error instanceof Error ? error.message : String(error) 
        },
        { status: 500 }
      );
    }
    
    // 获取同步方向参数
    const { direction = 'bidirectional' } = await request.json();
    
    console.log(`[API] 开始同步文章，方向: ${direction}...`);
    
    let result;
    
    // 根据同步方向执行不同的同步操作
    switch (direction) {
      case 'bidirectional':
        result = await syncBidirectional();
        break;
      case 'to-github':
        result = await syncToGitHub();
        break;
      case 'from-github':
        result = await syncFromGitHub();
        break;
      case 'to-local':
        result = await syncToLocal();
        break;
      case 'from-local':
        result = await syncFromLocal();
        break;
      default:
        // 默认使用SyncService进行同步
        const syncService = new SyncService();
        result = await syncService.syncAllPosts();
        break;
    }
    
    console.log(`[API] 同步完成: `, result);
    
    // 更新上次同步时间
    lastSyncTime = new Date().toISOString();
    
    // 释放同步锁
    syncInProgress = false;
    
    return Response.json({
      success: true,
      message: '同步完成',
      result
    });
  } catch (error) {
    // 释放同步锁
    syncInProgress = false;
    
    console.error('[API] 同步失败:', error);
    return Response.json(
      { 
        success: false, 
        message: '同步失败',
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
} 