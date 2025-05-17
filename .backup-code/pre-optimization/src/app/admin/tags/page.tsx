'use client';

import { useState, useEffect } from 'react';
import { Tag } from '@/types/post';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

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
    if (!editingTag || !editingTag.name.trim()) {
      setError('标签名称不能为空');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/tags/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newName: editingTag.name,
          newSlug: editingTag.slug
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '重命名标签失败');
      }
      
      setSuccess(`标签"${oldName}"已成功更新`);
      setEditingTag(null);
      
      // 刷新标签列表
      fetchTags();
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
        body: JSON.stringify({ 
          name: newTagName,
          slug: newTagSlug || undefined
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '创建标签失败');
      }
      
      setSuccess(`标签"${newTagName}"已成功创建`);
      setNewTagName('');
      setNewTagSlug('');
      setShowCreateModal(false);
      
      // 刷新标签列表
      fetchTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建标签失败');
    }
  };

  // 过滤标签
  const filteredTags = searchQuery
    ? tags.filter(tag => 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tags;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">标签管理</h1>
          <p className="text-gray-500 mt-1">管理博客文章的标签</p>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            + 新建标签
          </button>
          
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="搜索标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-3 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="m-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}
        
        {success && (
          <div className="m-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex justify-between items-center">
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
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">标签名称</th>
                  <th className="py-3 px-4 text-left">URL标识</th>
                  <th className="py-3 px-4 text-left">文章数</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag) => (
                    <tr key={tag.slug} className="border-t">
                      <td className="py-3 px-4">{tag.name}</td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-sm">{tag.slug}</td>
                      <td className="py-3 px-4">{tag.postCount}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="px-3 py-1 text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-sm"
                        >
                          编辑
                        </button>
                        {tag.postCount === 0 && (
                          <button
                            onClick={() => handleDelete(tag.name)}
                            className="px-3 py-1 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded text-sm"
                          >
                            删除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : searchQuery ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      没有找到匹配 "{searchQuery}" 的标签
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      暂无标签，点击"新建标签"按钮创建
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 新建标签模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">新建标签</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  标签名称
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：前端开发"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  URL标识
                </label>
                <input
                  type="text"
                  value={newTagSlug}
                  onChange={(e) => setNewTagSlug(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：frontend（可选，留空自动生成）"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ URL标识用于网址，推荐使用小写字母、数字和连字符
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
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

      {/* 编辑标签模态框 */}
      {editingTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">编辑标签</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  标签名称
                </label>
                <input
                  type="text"
                  value={editingTag.name}
                  onChange={(e) => setEditingTag({...editingTag, name: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  URL标识
                </label>
                <input
                  type="text"
                  value={editingTag.slug}
                  onChange={(e) => setEditingTag({...editingTag, slug: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ 修改URL标识可能会影响已有文章的链接，请谨慎操作
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
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
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 