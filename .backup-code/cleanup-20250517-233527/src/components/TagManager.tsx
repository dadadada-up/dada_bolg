'use client';

import { useState, useEffect } from 'react';
import { Tag } from '@/types/post';

interface TagManagerProps {
  onRefresh?: () => void;
}

export function TagManager({ onRefresh }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [renamingTagName, setRenamingTagName] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('获取标签失败');
      const data = await response.json();
      setTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取标签失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (oldName: string) => {
    if (!renamingTagName.trim()) {
      setError('标签名称不能为空');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/tags/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: renamingTagName })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '重命名标签失败');
      }
      
      setSuccess(`标签"${oldName}"已成功重命名为"${renamingTagName}"`);
      setEditingTag(null);
      
      // 刷新标签列表
      fetchTags();
      
      // 通知父组件刷新
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '重命名标签失败');
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`确定要删除标签"${name}"吗？`)) return;
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/tags/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '删除标签失败');
      }
      
      setSuccess(`标签"${name}"已成功删除`);
      
      // 刷新标签列表
      fetchTags();
      
      // 通知父组件刷新
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除标签失败');
    }
  };

  const handleCreate = async () => {
    if (!newTagName.trim()) {
      setError('标签名称不能为空');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '创建标签失败');
      }
      
      setSuccess(`标签"${newTagName}"已成功创建`);
      setNewTagName('');
      setShowCreateModal(false);
      
      // 刷新标签列表
      fetchTags();
      
      // 通知父组件刷新
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建标签失败');
    }
  };

  if (loading && tags.length === 0) {
    return <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">加载中...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">标签管理</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button 
            className="text-red-700 font-bold" 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 flex justify-between items-center">
          <span>{success}</span>
          <button 
            className="text-green-700 font-bold" 
            onClick={() => setSuccess(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* 标签列表 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="py-2 px-4 text-left">名称</th>
              <th className="py-2 px-4 text-left">文章数</th>
              <th className="py-2 px-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">
                  暂无标签
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr key={tag.slug} className="border-t">
                  <td className="py-2 px-4 align-middle">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                      {tag.name}
                    </span>
                  </td>
                  <td className="py-2 px-4 align-middle">{tag.postCount}</td>
                  <td className="py-2 px-4 text-right space-x-2 whitespace-nowrap">
                    <button 
                      onClick={() => {
                        setEditingTag(tag);
                        setRenamingTagName(tag.name);
                      }}
                      className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-sm"
                    >
                      重命名
                    </button>
                    {tag.postCount === 0 && (
                      <button 
                        onClick={() => handleDelete(tag.name)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-sm"
                      >
                        删除
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* 新建标签按钮 */}
      <div className="mt-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          新建标签
        </button>
      </div>
      
      {/* 新建标签模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">新建标签</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                标签名称
              </label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入标签名称"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 重命名标签模态框 */}
      {editingTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">重命名标签</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                原名称
              </label>
              <input
                type="text"
                value={editingTag.name}
                disabled
                className="w-full p-2 border rounded bg-gray-100 text-gray-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                新名称
              </label>
              <input
                type="text"
                value={renamingTagName}
                onChange={(e) => setRenamingTagName(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入新的标签名称"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingTag(null)}
                className="px-4 py-2 border rounded"
              >
                取消
              </button>
              <button
                onClick={() => handleRename(editingTag.name)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                确认重命名
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 