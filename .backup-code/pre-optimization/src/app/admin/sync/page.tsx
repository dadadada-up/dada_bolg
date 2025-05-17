'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  SyncStatus, 
  SyncDirection,
  SyncMode, 
  SyncResult,
  getSyncStatus, 
  triggerSync,
  triggerSSHBackup,
  triggerEnhancedSync 
} from '@/lib/sync/unified-client';

// 同步状态接口
interface SyncState {
  status: SyncStatus;
  lastSync: string | null;
  pendingOperations: number;
  direction?: SyncDirection;
}

export default function SyncPage() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    lastSync: null,
    pendingOperations: 0
  });
  
  const [syncDirection, setSyncDirection] = useState<SyncDirection>('bidirectional');
  const [syncMode, setSyncMode] = useState<SyncMode>('standard');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 获取同步状态
  const fetchSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setSyncState(status);
    } catch (error) {
      console.error('获取同步状态失败:', error);
      setError(error instanceof Error ? error.message : '获取同步状态失败');
      // 设置一个默认状态，避免undefined错误
      setSyncState({
        status: 'error',
        lastSync: null,
        pendingOperations: 0
      });
    }
  };
  
  // 触发同步
  const handleTriggerSync = async () => {
    setLoading(true);
    setError(null);
    setSyncResult(null);
    
    try {
      const result = await triggerSync(syncDirection, syncMode);
      setSyncResult(result);
      // 同步成功后刷新状态
      fetchSyncStatus();
    } catch (error) {
      console.error('触发同步失败:', error);
      setError(error instanceof Error ? error.message : '触发同步失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理增强同步
  const handleEnhancedSync = async () => {
    setLoading(true);
    setError(null);
    setSyncResult(null);
    
    try {
      const result = await triggerEnhancedSync();
      setSyncResult(result);
      fetchSyncStatus();
    } catch (error) {
      console.error('增强同步失败:', error);
      setError(error instanceof Error ? error.message : '增强同步失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理SSH备份
  const handleSSHBackup = async () => {
    setLoading(true);
    setError(null);
    setSyncResult(null);
    
    try {
      const result = await triggerSSHBackup();
      setSyncResult(result);
      fetchSyncStatus();
    } catch (error) {
      console.error('SSH备份失败:', error);
      setError(error instanceof Error ? error.message : 'SSH备份失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载时获取同步状态
  useEffect(() => {
    fetchSyncStatus();
    
    // 设置定时器每30秒刷新一次
    const timer = setInterval(fetchSyncStatus, 30000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">同步管理</h1>
          <p className="text-gray-500 mt-1">管理数据库与GitHub之间的同步</p>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* 同步状态区域 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">同步状态</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">状态</p>
              <p className="text-lg font-medium mt-1">
                {syncState?.status === 'idle' && '空闲'}
                {syncState?.status === 'syncing' && '同步中...'}
                {syncState?.status === 'error' && '错误'}
                {syncState?.status === 'success' && '同步成功'}
                {!syncState?.status && '未知状态'}
              </p>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">上次同步时间</p>
              <p className="text-lg font-medium mt-1">
                {syncState.lastSync ? new Date(syncState.lastSync).toLocaleString() : '从未同步'}
              </p>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">待处理操作</p>
              <p className="text-lg font-medium mt-1">
                {syncState.pendingOperations}
              </p>
            </div>
          </div>
          
          {/* 同步控制 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">触发同步</h3>
            
            <div className="flex items-center space-x-4">
              <select
                value={syncDirection}
                onChange={(e) => setSyncDirection(e.target.value as SyncDirection)}
                className="px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                disabled={loading}
              >
                <option value="bidirectional">双向同步</option>
                <option value="to-github">数据库 → GitHub</option>
                <option value="from-github">GitHub → 数据库</option>
                <option value="to-local">数据库 → 本地文件系统</option>
                <option value="from-local">本地文件系统 → 数据库</option>
              </select>
              
              <button
                onClick={handleTriggerSync}
                disabled={loading || syncState.status === 'syncing'}
                className={`px-4 py-2 rounded-md text-white ${
                  loading || syncState.status === 'syncing'
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {loading ? '处理中...' : '开始同步'}
              </button>
              
              <button
                onClick={fetchSyncStatus}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                刷新状态
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
              </div>
            )}
            
            {syncResult && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <h4 className="font-medium mb-2">同步结果:</h4>
                
                {syncResult.toGithub && (
                  <div className="mb-2">
                    <p>数据库 → GitHub:</p>
                    <p>处理: {syncResult.toGithub.processed} 个项目, 错误: {syncResult.toGithub.errors}</p>
                  </div>
                )}
                
                {syncResult.fromGitHub && (
                  <div className="mb-2">
                    <p>GitHub → 数据库:</p>
                    <p>处理: {syncResult.fromGitHub.processed} 个项目, 错误: {syncResult.fromGitHub.errors}</p>
                  </div>
                )}
                
                {/* 单向同步结果 */}
                {!syncResult.toGithub && !syncResult.fromGitHub && syncResult.processed !== undefined && (
                  <div className="mb-2">
                    <p>处理: {syncResult.processed} 个项目, 错误: {syncResult.errors || 0}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 增强同步功能区 */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4">增强同步功能</h3>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                此功能提供增强版的同步机制，专注于解决以下问题：
              </p>
              <ul className="list-disc ml-5 mt-2 text-sm text-blue-700 dark:text-blue-300">
                <li>修复 YAML 前置元数据解析问题</li>
                <li>处理并减少重复文章生成</li>
                <li>改进 slug 生成算法，避免随机后缀</li>
                <li>提供更详细的错误报告和恢复机制</li>
              </ul>
            </div>
            
            <div className="flex items-start space-x-4">
              <button
                onClick={handleEnhancedSync}
                disabled={loading || syncState.status === 'syncing'}
                className={`px-4 py-2 rounded-md text-white ${
                  loading || syncState.status === 'syncing'
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {loading ? '处理中...' : '从 GitHub 增强同步'}
              </button>
              
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  此功能从GitHub同步到数据库，使用改进的算法处理复杂的文章格式与元数据。
                  推荐在常规同步失败时使用。
                </p>
              </div>
            </div>
          </div>
          
          {/* SSH备份区域 */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4">SSH备份选项</h3>
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg mb-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                此功能使用SSH方式备份，适用于以下情况：
              </p>
              <ul className="list-disc ml-5 mt-2 text-sm text-green-700 dark:text-green-300">
                <li>GitHub API访问受限或不稳定</li>
                <li>需要强制推送内容到GitHub</li>
                <li>处理较大规模的内容更新</li>
              </ul>
            </div>
            
            <div className="flex items-start space-x-4">
              <button
                onClick={handleSSHBackup}
                disabled={loading || syncState.status === 'syncing'}
                className={`px-4 py-2 rounded-md text-white ${
                  loading || syncState.status === 'syncing'
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? '备份中...' : '使用SSH方式备份'}
              </button>
              
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  此功能直接将数据库内容通过SSH方式备份到GitHub，适用于HTTPS连接不稳定的情况。
                  备份仅从数据库到GitHub，不会影响数据库中的内容。
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 同步说明 */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">关于同步</h2>
          
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>本博客系统使用SQLite数据库作为主要数据存储，同时将内容同步到GitHub进行版本控制和备份。</p>
            
            <h3 className="text-lg font-medium">同步类型说明:</h3>
            
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>双向同步</strong>: 先从GitHub同步最新内容到数据库，再将数据库中的更改同步回GitHub，并备份到本地文件系统。</li>
              <li><strong>数据库 → GitHub</strong>: 将数据库中的更改同步到GitHub，适用于已在本地进行了多项修改。</li>
              <li><strong>GitHub → 数据库</strong>: 从GitHub获取最新内容并更新数据库，适用于从其它设备修改了GitHub仓库。</li>
              <li><strong>数据库 → 本地文件系统</strong>: 将数据库内容同步到本地文件系统，作为备份或本地编辑使用。</li>
              <li><strong>本地文件系统 → 数据库</strong>: 从本地文件系统导入文章到数据库，当GitHub无法访问时使用。</li>
            </ul>
            
            <p className="text-sm text-gray-500 mt-4">
              注意: 同步过程可能需要一些时间，尤其是当有大量内容需要同步时。在同步完成前请勿关闭此页面。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 