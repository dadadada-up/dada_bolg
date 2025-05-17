import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { getDb, getTimestamp } from './db';
import { getAllPosts, savePost } from './db-posts';
import { getPosts, clearContentCache } from './github';
import { enhancedSyncFromGitHub } from './sync-enhancer';
import { 
  syncFromGitHub, 
  syncToGitHub, 
  syncBidirectional, 
  syncFromLocal,
  syncToLocal
} from './sync-service';
import logger from './logger';

const execAsync = promisify(exec);

// 同步模式
export type SyncMode = 'standard' | 'enhanced' | 'ssh-backup';

// 同步方向
export type SyncDirection = 'to-github' | 'from-github' | 'bidirectional' | 'to-local' | 'from-local';

// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

// 错误详情接口
export interface ErrorDetail {
  message: string;
  post?: string;
  recoverable?: boolean;
}

// 同步结果接口
export interface SyncResult {
  success: boolean;
  processed?: number;
  errors?: number;
  toGithub?: { processed: number; errors: number };
  fromGitHub?: { processed: number; errors: number };
  errorDetails?: ErrorDetail[] | string[];
  details?: string;
}

/**
 * 获取同步状态
 */
export async function getSyncStatus(): Promise<{
  status: SyncStatus;
  lastSync: string | null;
  pendingOperations: number;
}> {
  try {
    const db = await getDb();
    
    // 检查同步状态表是否存在
    const hasTable = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='sync_status'");
    
    let syncStatus = 'idle';
    let lastSync = null;
    let pendingOperations = 0;
    
    if (hasTable) {
      // 获取同步状态
      const status = await db.get('SELECT * FROM sync_status WHERE id = 1');
      
      if (status) {
        syncStatus = status.sync_in_progress ? 'syncing' : 'idle';
        lastSync = status.last_sync_time ? new Date(status.last_sync_time * 1000).toISOString() : null;
      }
      
      // 获取待处理操作数量
      const countPending = await db.get('SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending"');
      pendingOperations = countPending ? countPending.count : 0;
    }

    logger.debug('sync-unified', `获取同步状态: ${syncStatus}, 上次同步: ${lastSync}, 待处理项: ${pendingOperations}`);
    
    return {
      status: syncStatus as SyncStatus,
      lastSync,
      pendingOperations
    };
  } catch (error) {
    logger.error('sync-unified', '获取同步状态失败', error);
    return {
      status: 'error',
      lastSync: null,
      pendingOperations: 0
    };
  }
}

/**
 * 执行同步操作
 * @param direction 同步方向
 * @param mode 同步模式
 * @returns 同步结果
 */
export async function executeSync(
  direction: SyncDirection = 'bidirectional',
  mode: SyncMode = 'standard'
): Promise<SyncResult> {
  logger.info('sync-unified', `开始同步，方向: ${direction}，模式: ${mode}`);
  
  try {
    // 清除缓存以确保获取最新内容
    await clearContentCache();
    
    // 根据模式选择不同的同步方法
    let result: SyncResult;
    
    if (mode === 'enhanced') {
      logger.info('sync-unified', '使用增强同步模式');
      result = await enhancedSyncFromGitHub();
    } else if (mode === 'ssh-backup') {
      logger.info('sync-unified', '使用SSH备份模式');
      result = await executeSSHBackup();
    } else {
      // 标准模式下根据方向执行不同的同步操作
      logger.info('sync-unified', `使用标准同步模式，方向: ${direction}`);
      
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
          const errorMsg = `不支持的同步方向: ${direction}`;
          logger.error('sync-unified', errorMsg);
          throw new Error(errorMsg);
      }
    }
    
    logger.info('sync-unified', '同步完成', {
      success: result.success,
      processed: result.processed,
      errors: result.errors
    });
    
    return result;
  } catch (error) {
    logger.error('sync-unified', '同步过程中发生错误', error);
    return {
      success: false,
      errors: 1,
      errorDetails: [{ 
        message: error instanceof Error ? error.message : '未知错误',
        recoverable: false
      }]
    };
  }
}

/**
 * 执行SSH备份
 */
async function executeSSHBackup(): Promise<SyncResult> {
  try {
    logger.info('sync-unified', '开始执行SSH备份...');
    
    // 获取项目根目录
    const projectRoot = process.cwd();
    
    // 执行手动备份命令
    const { stdout, stderr } = await execAsync('npm run manual-backup', {
      cwd: projectRoot
    });
    
    if (stderr && stderr.trim().length > 0) {
      logger.warn('sync-unified', 'SSH备份命令返回警告', stderr);
    }
    
    logger.info('sync-unified', 'SSH备份命令执行完成', stdout);
    
    return {
      success: true,
      processed: 1,
      errors: 0,
      details: stdout
    };
  } catch (error) {
    logger.error('sync-unified', 'SSH备份失败', error);
    
    return {
      success: false,
      processed: 0,
      errors: 1,
      errorDetails: [{ 
        message: error instanceof Error ? error.message : '未知错误',
        recoverable: false
      }]
    };
  }
} 