'use client';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';
export type SyncDirection = 'to-github' | 'from-github' | 'bidirectional' | 'to-local' | 'from-local';
export type SyncMode = 'standard' | 'enhanced' | 'ssh-backup';

// 同步结果接口
export interface SyncResult {
  success: boolean;
  processed?: number;
  errors?: number;
  toGithub?: { processed: number; errors: number };
  fromGitHub?: { processed: number; errors: number };
  errorDetails?: any[];
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
  const response = await fetch('/api/unified-sync', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`获取同步状态失败: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  
  // 确保返回正确的数据格式
  return {
    status: data.status?.status || 'idle',
    lastSync: data.status?.lastSync || null,
    pendingOperations: data.status?.pendingOperations || 0
  };
}

/**
 * 触发同步
 * @param direction 同步方向
 * @param mode 同步模式
 */
export async function triggerSync(
  direction: SyncDirection = 'bidirectional',
  mode: SyncMode = 'standard'
): Promise<SyncResult> {
  const response = await fetch('/api/unified-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ direction, mode })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`触发同步失败: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  
  return data.result;
}

/**
 * 触发SSH备份
 */
export async function triggerSSHBackup(): Promise<SyncResult> {
  return await triggerSync('to-github', 'ssh-backup');
}

/**
 * 触发增强同步
 */
export async function triggerEnhancedSync(): Promise<SyncResult> {
  return await triggerSync('from-github', 'enhanced');
} 