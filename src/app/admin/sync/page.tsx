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
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Navicat同步状态
  const [navicatSyncStatus, setNavicatSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [navicatSyncMessage, setNavicatSyncMessage] = useState<string>('');
  const [lastNavicatSyncTime, setLastNavicatSyncTime] = useState<string | null>(null);
  
  // 生产环境同步状态
  const [prodSyncStatus, setProdSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [prodSyncMessage, setProdSyncMessage] = useState<string>('');
  const [lastProdSyncTime, setLastProdSyncTime] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>(['posts', 'categories', 'tags', 'post_categories', 'post_tags', 'slug_mapping']);
  const [isDryRun, setIsDryRun] = useState<boolean>(true);

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

  // 同步数据库到Navicat
  const handleSyncToNavicat = async () => {
    setNavicatSyncStatus('loading');
    setNavicatSyncMessage('正在同步数据库到Navicat...');
    
    try {
      // 执行同步脚本
      const response = await fetch('/api/admin/sync-to-navicat', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`同步失败: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setNavicatSyncStatus('success');
        setNavicatSyncMessage(result.message || '同步成功！');
        setLastNavicatSyncTime(new Date().toLocaleString());
        
        // 添加到历史记录
        const now = new Date().toISOString();
        const newHistoryItem: SyncHistoryItem = {
          id: Date.now().toString(),
          timestamp: now,
          operation: 'Turso→Navicat',
          status: 'success',
          details: '已同步到Navicat'
        };
        
        const history = [...syncHistory, newHistoryItem];
        setSyncHistory(history);
        localStorage.setItem('syncHistory', JSON.stringify(history));
      } else {
        throw new Error(result.error || '同步失败，请重试');
      }
    } catch (error) {
      setNavicatSyncStatus('error');
      setNavicatSyncMessage(`同步失败: ${error.message}`);
      
      // 添加到历史记录
      const now = new Date().toISOString();
      const newHistoryItem: SyncHistoryItem = {
        id: Date.now().toString(),
        timestamp: now,
        operation: 'Turso→Navicat',
        status: 'error',
        details: `同步失败: ${error.message}`
      };
      
      const history = [...syncHistory, newHistoryItem];
      setSyncHistory(history);
      localStorage.setItem('syncHistory', JSON.stringify(history));
    }
  };
  
  // 同步数据库到生产环境
  const handleSyncToProd = async () => {
    setProdSyncStatus('loading');
    setProdSyncMessage('正在同步数据库到生产环境...');
    
    try {
      // 执行同步脚本
      const response = await fetch('/api/admin/sync-to-prod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tables: selectedTables,
          dryRun: isDryRun
        })
      });
      
      if (!response.ok) {
        throw new Error(`同步失败: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setProdSyncStatus('success');
        setProdSyncMessage(isDryRun 
          ? '试运行成功！请检查日志并关闭试运行模式以实际同步' 
          : result.message || '同步成功！');
        setLastProdSyncTime(new Date().toLocaleString());
        
        // 添加到历史记录
        if (!isDryRun) {
          const now = new Date().toISOString();
          const newHistoryItem: SyncHistoryItem = {
            id: Date.now().toString(),
            timestamp: now,
            operation: '本地→生产',
            status: 'success',
            details: `已同步表: ${selectedTables.join(', ')}`
          };
          
          const history = [...syncHistory, newHistoryItem];
          setSyncHistory(history);
          localStorage.setItem('syncHistory', JSON.stringify(history));
        }
      } else {
        throw new Error(result.error || '同步失败，请重试');
      }
    } catch (error) {
      setProdSyncStatus('error');
      setProdSyncMessage(`同步失败: ${error.message}`);
      
      // 添加到历史记录
      if (!isDryRun) {
        const now = new Date().toISOString();
        const newHistoryItem: SyncHistoryItem = {
          id: Date.now().toString(),
          timestamp: now,
          operation: '本地→生产',
          status: 'error',
          details: `同步失败: ${error.message}`
        };
        
        const history = [...syncHistory, newHistoryItem];
        setSyncHistory(history);
        localStorage.setItem('syncHistory', JSON.stringify(history));
      }
    }
  };
  
  // 处理表格选择变化
  const handleTableSelectionChange = (table: string) => {
    setSelectedTables(prev => 
      prev.includes(table) 
        ? prev.filter(t => t !== table) 
        : [...prev, table]
    );
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
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">数据库同步中心</h1>
          <p className="text-gray-500 mt-1">管理数据库同步操作</p>
        </div>
      </div>

      {/* 通知横幅 */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 text-blue-700 rounded mb-4 text-sm">
        <p className="font-medium">数据库同步说明</p>
        <p className="mt-1">
          此页面用于更新Navicat数据库文件和同步本地数据到生产环境。如需初始化开发环境，请使用命令行：<code className="bg-blue-100 px-1 py-0.5 rounded">node scripts/init-and-update.js</code>
        </p>
      </div>

      {/* Navicat同步面板 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3">更新Navicat数据库文件</h2>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mb-4 text-sm">
            <p className="text-blue-800 dark:text-blue-200">
              此操作将从本地Turso实例生成SQLite文件，方便使用Navicat等工具查看和分析数据。
              生成的SQLite文件位于 /navicat_import/blog_database.db
            </p>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
                navicatSyncStatus === 'idle' ? 'bg-gray-400' :
                navicatSyncStatus === 'loading' ? 'bg-blue-500 animate-pulse' :
                navicatSyncStatus === 'success' ? 'bg-green-500' :
                'bg-red-500'
              }`}></div>
              <span className="font-medium text-sm">
                {navicatSyncStatus === 'idle' && '准备就绪'}
                {navicatSyncStatus === 'loading' && '正在同步中...'}
                {navicatSyncStatus === 'success' && '同步成功'}
                {navicatSyncStatus === 'error' && '同步失败'}
              </span>
            </div>
          
            {navicatSyncMessage && (
              <div className={`text-sm ${
                navicatSyncStatus === 'error' ? 'text-red-500' :
                navicatSyncStatus === 'success' ? 'text-green-500' :
                'text-gray-500'
              }`}>
                {navicatSyncMessage}
              </div>
            )}
          
            {lastNavicatSyncTime && (
              <div className="text-xs text-gray-500 mt-1">
                上次同步时间: {lastNavicatSyncTime}
              </div>
            )}
          </div>
          
          <button
            onClick={handleSyncToNavicat}
            disabled={navicatSyncStatus === 'loading'}
            className={`px-3 py-1.5 text-sm rounded-md text-white ${
              navicatSyncStatus === 'loading' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {navicatSyncStatus === 'loading' ? '同步中...' : '更新Navicat数据库'}
          </button>
        </div>
      </div>
      
      {/* 生产环境同步面板 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3">同步数据到生产环境</h2>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg mb-4 text-sm">
            <p className="text-yellow-800 dark:text-yellow-200">
              <span className="font-bold">警告：</span> 此操作将本地开发环境的数据同步到生产环境。请确保您了解此操作的影响，并在必要时先进行备份。
            </p>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
                prodSyncStatus === 'idle' ? 'bg-gray-400' :
                prodSyncStatus === 'loading' ? 'bg-blue-500 animate-pulse' :
                prodSyncStatus === 'success' ? 'bg-green-500' :
                'bg-red-500'
              }`}></div>
              <span className="font-medium text-sm">
                {prodSyncStatus === 'idle' && '准备就绪'}
                {prodSyncStatus === 'loading' && '正在同步中...'}
                {prodSyncStatus === 'success' && '同步成功'}
                {prodSyncStatus === 'error' && '同步失败'}
              </span>
            </div>
          
            {prodSyncMessage && (
              <div className={`text-sm ${
                prodSyncStatus === 'error' ? 'text-red-500' :
                prodSyncStatus === 'success' ? 'text-green-500' :
                'text-gray-500'
              }`}>
                {prodSyncMessage}
              </div>
            )}
          
            {lastProdSyncTime && (
              <div className="text-xs text-gray-500 mt-1">
                上次同步时间: {lastProdSyncTime}
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">选择要同步的表</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={selectedTables.includes('posts')} 
                  onChange={() => handleTableSelectionChange('posts')}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">文章 (posts)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={selectedTables.includes('categories')} 
                  onChange={() => handleTableSelectionChange('categories')}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">分类 (categories)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={selectedTables.includes('tags')} 
                  onChange={() => handleTableSelectionChange('tags')}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">标签 (tags)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={selectedTables.includes('post_categories')} 
                  onChange={() => handleTableSelectionChange('post_categories')}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">文章分类 (post_categories)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={selectedTables.includes('post_tags')} 
                  onChange={() => handleTableSelectionChange('post_tags')}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">文章标签 (post_tags)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={selectedTables.includes('slug_mapping')} 
                  onChange={() => handleTableSelectionChange('slug_mapping')}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">链接映射 (slug_mapping)</span>
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={isDryRun} 
                onChange={() => setIsDryRun(!isDryRun)}
                className="rounded text-blue-600"
              />
              <span className="text-sm font-medium">试运行模式（不会实际修改生产数据库）</span>
            </label>
          </div>
          
          <button
            onClick={handleSyncToProd}
            disabled={prodSyncStatus === 'loading' || selectedTables.length === 0}
            className={`px-3 py-1.5 text-sm rounded-md text-white ${
              prodSyncStatus === 'loading' || selectedTables.length === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : isDryRun 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {prodSyncStatus === 'loading' 
              ? '同步中...' 
              : isDryRun 
                ? '试运行同步到生产环境' 
                : '同步到生产环境'}
          </button>
        </div>
      </div>

      {/* 数据库说明 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-3">数据库说明</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
              <h3 className="text-md font-medium text-blue-700 dark:text-blue-400 mb-2">Turso 云数据库</h3>
              <p className="text-xs mb-2">
                <span className="font-medium">作用：</span> 主数据库，存储所有博客数据的权威来源。
              </p>
              <ul className="list-disc pl-4 text-xs space-y-0.5">
                <li>生产环境使用的是Turso云数据库</li>
                <li>所有数据写入操作都应该直接针对Turso数据库</li>
                <li>基于分布式SQLite，高性能且支持边缘部署</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
              <h3 className="text-md font-medium text-green-700 dark:text-green-400 mb-2">本地Turso实例</h3>
              <p className="text-xs mb-2">
                <span className="font-medium">作用：</span> 开发环境的主数据库，在Docker容器中运行。
              </p>
              <ul className="list-disc pl-4 text-xs space-y-0.5">
                <li>开发环境使用的是本地Docker容器中的Turso实例 (URL: http://localhost:8080)</li>
                <li>可以通过初始化脚本从云端同步最新数据</li>
                <li>适合在开发环境中进行数据操作和测试</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
              <h3 className="text-md font-medium text-purple-700 dark:text-purple-400 mb-2">Navicat 数据库文件</h3>
              <p className="text-xs mb-2">
                <span className="font-medium">作用：</span> 用于在Navicat等GUI工具中查看和分析数据的SQLite文件。
              </p>
              <ul className="list-disc pl-4 text-xs space-y-0.5">
                <li>位置: /navicat_import/blog_database.db</li>
                <li>仅用于数据查看和分析，不应直接修改</li>
                <li>提供友好的图形界面查询和管理数据</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 同步历史记录 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-3">同步历史</h2>
          
          {syncHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">时间</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">详情</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {syncHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {item.operation}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.status === 'success' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {item.status === 'success' ? '成功' : '失败'}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {item.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">暂无同步历史记录</p>
          )}
        </div>
      </div>
    </div>
  );
} 