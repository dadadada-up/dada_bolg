'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/types/post';

interface CategoryManagerProps {
  onRefresh?: () => void;
}

export function CategoryManager({ onRefresh }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [renamingCategoryName, setRenamingCategoryName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories-new');
      if (!response.ok) throw new Error('获取分类失败');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取分类失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (oldName: string) => {
    if (!renamingCategoryName.trim()) {
      setError('分类名称不能为空');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/categories-new/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: renamingCategoryName })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '重命名分类失败');
      }
      
      setSuccess(`分类"${oldName}"已成功重命名为"${renamingCategoryName}"`);
      setEditingCategory(null);
      
      // 刷新分类列表
      fetchCategories();
      
      // 通知父组件刷新
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '重命名分类失败');
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`确定要删除分类"${name}"吗？`)) return;
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/categories-new/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '删除分类失败');
      }
      
      setSuccess(`分类"${name}"已成功删除`);
      
      // 刷新分类列表
      fetchCategories();
      
      // 通知父组件刷新
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除分类失败');
    }
  };

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      setError('分类名称不能为空');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/categories-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '创建分类失败');
      }
      
      setSuccess(`分类"${newCategoryName}"已成功创建`);
      setNewCategoryName('');
      setShowCreateModal(false);
      
      // 刷新分类列表
      fetchCategories();
      
      // 通知父组件刷新
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建分类失败');
    }
  };

  if (loading && categories.length === 0) {
    return <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">加载中...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">分类管理</h2>
      
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
      
      {/* 分类列表 */}
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
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">
                  暂无分类
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.slug} className="border-t">
                  <td className="py-2 px-4 align-middle">{category.name}</td>
                  <td className="py-2 px-4 align-middle">{category.postCount}</td>
                  <td className="py-2 px-4 text-right space-x-2 whitespace-nowrap">
                    <button 
                      onClick={() => {
                        setEditingCategory(category);
                        setRenamingCategoryName(category.name);
                      }}
                      className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-sm"
                    >
                      重命名
                    </button>
                    {category.postCount === 0 && (
                      <button 
                        onClick={() => handleDelete(category.name)}
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
      
      {/* 新建分类按钮 */}
      <div className="mt-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          新建分类
        </button>
      </div>
      
      {/* 新建分类模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">新建分类</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                分类名称
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入分类名称"
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
      
      {/* 重命名分类模态框 */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">重命名分类</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                原名称
              </label>
              <input
                type="text"
                value={editingCategory.name}
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
                value={renamingCategoryName}
                onChange={(e) => setRenamingCategoryName(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入新的分类名称"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 border rounded"
              >
                取消
              </button>
              <button
                onClick={() => handleRename(editingCategory.name)}
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