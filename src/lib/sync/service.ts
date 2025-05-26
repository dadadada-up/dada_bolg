import { Post } from '@/types/post';
import { getAllFallbackPosts, getFallbackPostBySlug } from '@/lib/fallback-data';
import { isTursoEnabled } from '@/lib/db/turso-client';
import { query, queryOne, execute } from '@/lib/db/database';

/**
 * 同步服务 - 支持Turso数据库和备用数据
 * 
 * 优先尝试使用Turso数据库，失败时回退到备用数据
 */

// 同步状态类型
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

// 同步方向
export type SyncDirection = 'to-github' | 'from-github' | 'bidirectional' | 'to-local' | 'from-local';

// 同步操作类型
export type SyncOperation = 'create' | 'update' | 'delete';

// 获取当前同步状态 - 优先使用数据库，失败时返回默认状态
export async function getSyncStatus(): Promise<{
  status: SyncStatus;
  lastSync: string | null;
  pendingOperations: number;
}> {
  try {
    // 检查是否启用了Turso
    if (isTursoEnabled()) {
      console.log('[Turso] 尝试从Turso数据库获取同步状态');
      
      // 从数据库获取同步状态
      const syncStatus = await queryOne(`SELECT * FROM sync_status WHERE id = 1`);
      
      if (syncStatus) {
        console.log(`[Turso] 成功获取同步状态`);
        
        // 获取待同步项数量
        const pendingCountResult = await queryOne(`SELECT COUNT(*) as count FROM sync_queue WHERE status = ?`, ['pending']);
        const pendingCount = pendingCountResult?.count || 0;
        
        return {
          status: syncStatus.sync_in_progress ? 'syncing' : 'idle',
          lastSync: syncStatus.last_sync_time ? new Date(syncStatus.last_sync_time * 1000).toISOString() : null,
          pendingOperations: pendingCount
        };
      }
    }
    
    // 如果Turso未启用或查询失败，返回默认状态
    console.log('[同步服务] 从Turso获取同步状态失败，返回默认状态');
    return {
      status: 'idle',
      lastSync: new Date().toISOString(),
      pendingOperations: 0
    };
  } catch (error) {
    console.error('[同步服务] 获取同步状态失败:', error);
    
    // 失败时返回默认状态
    return {
      status: 'idle',
      lastSync: new Date().toISOString(),
      pendingOperations: 0
    };
  }
}

// 添加同步项到队列 - 优先使用数据库，失败时返回模拟ID
export async function addToSyncQueue(
  operation: SyncOperation,
  slug?: string,
  path?: string
): Promise<string> {
  try {
    // 检查是否启用了Turso
    if (isTursoEnabled()) {
      console.log(`[Turso] 尝试添加同步队列项: ${operation} ${slug}`);
      
      // 确保sync_queue表存在
      await execute(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          operation TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          error TEXT,
          path TEXT,
          slug TEXT,
          retry_count INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL
        )
      `);
      
      // 生成ID
      const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      const now = Math.floor(Date.now() / 1000);
      
      // 添加到队列
      await execute(`
        INSERT INTO sync_queue (id, operation, status, path, slug, created_at)
        VALUES (?, ?, 'pending', ?, ?, ?)
      `, [id, operation, path, slug, now]);
      
      console.log(`[Turso] 成功添加同步队列项: ${id}`);
      return id;
    }
    
    // 如果Turso未启用或操作失败，返回模拟ID
    console.log(`[同步服务] 添加同步队列功能被禁用: ${operation} ${slug}`);
    return 'mock-id-' + Date.now();
  } catch (error) {
    console.error(`[同步服务] 添加同步队列项失败:`, error);
    
    // 失败时返回模拟ID
    return 'mock-id-' + Date.now();
  }
}

// 从数据库同步到GitHub - 只在Vercel环境中禁用
export async function syncToGitHub(): Promise<{
  success: boolean;
  processed: number;
  errors: number;
}> {
  console.log('[Vercel环境] 同步到GitHub功能被禁用');
  return {
    success: false,
    processed: 0,
    errors: 0
  };
}

// 从GitHub同步到数据库 - 只在Vercel环境中禁用
export async function syncFromGitHub(): Promise<{
  success: boolean;
  processed: number;
  errors: number;
}> {
  console.log('[Vercel环境] 从GitHub同步功能被禁用');
  return {
    success: false,
    processed: 0,
    errors: 0
  };
}

// 从本地同步到数据库 - 只在Vercel环境中禁用
export async function syncFromLocal(): Promise<{
  success: boolean;
  processed: number;
  errors: number;
}> {
  console.log('[Vercel环境] 从本地同步功能被禁用');
  return {
    success: false,
    processed: 0,
    errors: 0
  };
}

// 从数据库同步到本地 - 只在Vercel环境中禁用
export async function syncToLocal(): Promise<{
  success: boolean;
  processed: number;
  errors: number;
}> {
  console.log('[Vercel环境] 同步到本地功能被禁用');
  return {
    success: false,
    processed: 0,
    errors: 0
  };
}

// 双向同步 - 只在Vercel环境中禁用
export async function syncBidirectional(): Promise<{
  success: boolean;
  toGitHub: { processed: number; errors: number; };
  fromGitHub: { processed: number; errors: number; };
}> {
  console.log('[Vercel环境] 双向同步功能被禁用');
  return {
    success: false,
    toGitHub: { processed: 0, errors: 0 },
    fromGitHub: { processed: 0, errors: 0 }
  };
}

// 将文章变更添加到队列 - 委托给addToSyncQueue
export async function queuePostChange(
  operation: SyncOperation,
  post: Post
): Promise<string> {
  console.log(`[同步服务] 添加文章变更到队列: ${operation} ${post.slug}`);
  // 获取文件路径
  const path = post.metadata?.originalFile || `content/posts/${post.categories[0] || 'uncategorized'}/${post.slug}.md`;
  return addToSyncQueue(operation, post.slug, path);
}

// 初始化同步 - 优先使用数据库，失败时返回false
export async function initializeSync(): Promise<boolean> {
  try {
    // 检查是否启用了Turso
    if (isTursoEnabled()) {
      console.log('[Turso] 尝试初始化同步');
      
      // 确保sync_queue表存在
      await execute(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          operation TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          error TEXT,
          path TEXT,
          slug TEXT,
          retry_count INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL
        )
      `);
      
      // 确保sync_status表存在
      await execute(`
        CREATE TABLE IF NOT EXISTS sync_status (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          last_sync_time INTEGER,
          sync_in_progress BOOLEAN DEFAULT false
        )
      `);
      
      // 检查同步状态表是否有记录
      const syncStatus = await queryOne('SELECT * FROM sync_status WHERE id = 1');
      if (!syncStatus) {
        await execute('INSERT INTO sync_status (id, last_sync_time, sync_in_progress) VALUES (1, NULL, 0)');
      }
      
      console.log('[Turso] 同步初始化完成');
      return true;
    }
    
    // 如果Turso未启用，返回false
    console.log('[同步服务] 初始化同步功能被禁用');
    return false;
  } catch (error) {
    console.error('[同步服务] 初始化同步失败:', error);
    return false;
  }
}

// 创建初始标志 - 只在Vercel环境中禁用
export async function createInitialFlag(): Promise<boolean> {
  console.log('[Vercel环境] 创建初始同步标志功能被禁用');
  return false;
} 