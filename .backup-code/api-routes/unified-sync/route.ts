import { NextResponse } from 'next/server';
import { executeSync, getSyncStatus, SyncDirection, SyncMode } from '@/lib/sync/unified';
import { clearContentCache } from '@/lib/github';
import initializeDatabase from '@/lib/db';
import logger from '@/lib/utils/logger';

// 同步锁
let syncInProgress = false;
let lastSyncTime: string | null = null;

// 确保数据库初始化
initializeDatabase().catch(err => {
  logger.error('unified-sync-api', '数据库初始化失败', err);
});

/**
 * 获取同步状态
 */
export async function GET(request: Request) {
  try {
    logger.debug('unified-sync-api', '接收到获取同步状态请求');
    const status = await getSyncStatus();
    
    logger.debug('unified-sync-api', '返回同步状态', status);
    return Response.json({
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('unified-sync-api', '获取同步状态失败', error);
    
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '获取同步状态失败',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

/**
 * 触发同步操作
 */
export async function POST(request: Request) {
  try {
    // 检查是否有同步操作正在进行
    if (syncInProgress) {
      logger.warn('unified-sync-api', '同步锁被占用，拒绝新的同步请求');
      return Response.json(
        { success: false, message: '同步操作正在进行，请稍后再试' },
        { status: 409 }
      );
    }
    
    // 设置同步锁
    syncInProgress = true;
    
    try {
      // 初始化数据库
      await initializeDatabase();
      
      // 解析请求参数
      const body = await request.json();
      const direction = (body.direction || 'bidirectional') as SyncDirection;
      const mode = (body.mode || 'standard') as SyncMode;
      
      logger.info('unified-sync-api', `开始同步，方向: ${direction}，模式: ${mode}`);
      
      // 清除GitHub内容缓存
      await clearContentCache();
      
      // 执行同步
      const result = await executeSync(direction, mode);
      
      // 更新上次同步时间
      lastSyncTime = new Date().toISOString();
      
      logger.info('unified-sync-api', '同步完成', {
        success: result.success,
        processed: result.processed,
        errors: result.errors
      });
      
      return Response.json({
        success: true,
        message: '同步完成',
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('unified-sync-api', '同步过程发生错误', error);
      return Response.json(
        { 
          success: false, 
          message: '同步失败',
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString()
        }, 
        { status: 500 }
      );
    } finally {
      // 确保始终释放同步锁
      syncInProgress = false;
      logger.debug('unified-sync-api', '释放同步锁');
    }
  } catch (error) {
    // 如果在外层处理请求参数时遇到错误
    syncInProgress = false;
    logger.error('unified-sync-api', '处理同步请求失败', error);
    
    return Response.json(
      { 
        success: false, 
        message: '处理同步请求失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      }, 
      { status: 400 }
    );
  }
} 