'use client';

import { Post } from '@/types/post';

// 同步状态类型
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

// 同步方向
export type SyncDirection = 'to-github' | 'from-github' | 'bidirectional' | 'to-local' | 'from-local';

// 同步结果接口
interface SyncResult {
  success: boolean;
  processed?: number;
  errors?: number;
  toGithub?: { processed: number; errors: number };
  fromGitHub?: { processed: number; errors: number };
}

// 获取同步状态
export async function getSyncStatus(): Promise<{
  status: SyncStatus;
  lastSync: string | null;
  pendingOperations: number;
}> {
  const response = await fetch('/api/sync', {
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

// 触发同步
export async function triggerSync(direction: SyncDirection = 'bidirectional'): Promise<any> {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ direction })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`触发同步失败: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  
  return data.result;
} 