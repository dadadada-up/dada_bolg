'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// 同步状态类型
type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// 同步历史记录项
interface SyncHistoryItem {
  id: string;
  timestamp: string;
  operation: string;
  status: 'success' | 'error';
  details: string;
}

// 同步状态接口
interface SyncState {
  status: SyncStatus;
  lastSync: string | null;
}

export default function SyncPage() {
  // 状态管理
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    lastSync: null
  });
  const [autoBackup, setAutoBackup] = useState(true);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 同步选项
  const [syncOptions, setSyncOptions] = useState({
    categories: true,
    tags: true,
    posts: true,
    postCategories: true,
    postTags: true,
    slugMappings: true
  });

  // 获取同步状态
  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/admin/sync-db');
      
      if (!response.ok) {
        throw new Error(`获取同步状态失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      setSyncState({
        status: data.is_syncing ? 'syncing' : 'idle',
        lastSync: localStorage.getItem('lastSyncTime') || null
      });
    } catch (error) {
      console.error('获取同步状态失败:', error);
      setError(error instanceof Error ? error.message : '获取同步状态失败');
    }
  };

  // 获取同步历史
  const fetchSyncHistory = async () => {
    // TODO: 实现历史API时替换
    // 目前使用本地存储的模拟数据
    const historyString = localStorage.getItem('syncHistory');
    if (historyString) {
      try {
        setSyncHistory(JSON.parse(historyString));
      } catch (e) {
        console.error('解析同步历史失败:', e);
        setSyncHistory([]);
      }
    }
  };

  // 执行同步
  const startSync = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/admin/sync-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          autoBackup,
          options: syncOptions
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `同步失败: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('同步操作已成功启动，请等待完成');
        
        // 保存本次同步时间
        const now = new Date().toISOString();
        localStorage.setItem('lastSyncTime', now);
        
        // 添加到历史记录
        const newHistoryItem: SyncHistoryItem = {
          id: Date.now().toString(),
          timestamp: now,
          operation: 'Turso→SQLite',
          status: 'success',
          details: '已开始同步'
        };
        
        const history = [...syncHistory, newHistoryItem];
        setSyncHistory(history);
        localStorage.setItem('syncHistory', JSON.stringify(history));
        
        // 更新状态
        setSyncState({
          status: 'success',
          lastSync: now
        });
      } else {
        throw new Error(result.error || '同步请求失败');
      }
    } catch (error) {
      console.error('触发同步失败:', error);
      setError(error instanceof Error ? error.message : '触发同步失败');
      
      setSyncState({
        ...syncState,
        status: 'error'
      });
    } finally {
      setLoading(false);
      
      // 稍后刷新状态
      setTimeout(fetchSyncStatus, 2000);
    }
  };

  // 初始化
  useEffect(() => {
    fetchSyncStatus();
    fetchSyncHistory();
    
    // 定期刷新状态
    const timer = setInterval(fetchSyncStatus, 5000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">数据库同步管理</h1>
          <p className="text-gray-500 mt-1">在Turso云数据库和本地SQLite之间同步数据</p>
        </div>
      </div>

      {/* 状态指示器 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">同步状态</h2>
        
        <div className="flex items-center mb-4">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            syncState.status === 'idle' ? 'bg-gray-400' :
            syncState.status === 'syncing' ? 'bg-blue-500 animate-pulse' :
            syncState.status === 'success' ? 'bg-green-500' :
            'bg-red-500'
          }`}></div>
          <span className="font-medium">
            {syncState.status === 'idle' && '空闲'}
            {syncState.status === 'syncing' && '正在同步中...'}
            {syncState.status === 'success' && '同步成功'}
            {syncState.status === 'error' && '同步失败'}
          </span>
        </div>
        
        {syncState.lastSync && (
          <div className="text-sm text-gray-500">
            上次同步时间: {new Date(syncState.lastSync).toLocaleString()}
          </div>
        )}
      </div>

      {/* 同步控制面板 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Turso → SQLite 同步</h2>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Turso是您的主数据库。此操作将把Turso云数据库中的数据同步到本地SQLite。
              适用于本地开发环境，确保您在本地有与云端相同的数据。
            </p>
          </div>
          
          {/* 备份选项 */}
          <div className="mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>同步前自动备份当前SQLite数据库</span>
            </label>
          </div>
          
          {/* 同步项目选择 */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">同步项目:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncOptions.categories}
                  onChange={(e) => setSyncOptions({...syncOptions, categories: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>分类</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncOptions.tags}
                  onChange={(e) => setSyncOptions({...syncOptions, tags: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>标签</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncOptions.posts}
                  onChange={(e) => setSyncOptions({...syncOptions, posts: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>文章</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncOptions.postCategories}
                  onChange={(e) => setSyncOptions({...syncOptions, postCategories: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>分类关联</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncOptions.postTags}
                  onChange={(e) => setSyncOptions({...syncOptions, postTags: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>标签关联</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncOptions.slugMappings}
                  onChange={(e) => setSyncOptions({...syncOptions, slugMappings: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Slug映射</span>
              </label>
            </div>
          </div>
          
          {/* 错误和成功消息 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p>{success}</p>
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="flex space-x-4">
            <button
              onClick={startSync}
              disabled={loading || syncState.status === 'syncing'}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                loading || syncState.status === 'syncing'
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? '处理中...' : 
               syncState.status === 'syncing' ? '同步中...' : 
               '开始同步'}
            </button>
            
            <button
              onClick={fetchSyncStatus}
              className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              刷新状态
            </button>
          </div>
        </div>
      </div>

      {/* 同步历史记录 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">同步历史</h2>
          
          {syncHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">详情</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {syncHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.operation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.status === 'success' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {item.status === 'success' ? '成功' : '失败'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">暂无同步历史记录</p>
          )}
        </div>
      </div>
    </div>
  );
} 