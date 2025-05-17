'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ContentSection } from '@/components/admin/ContentSection';
import Link from 'next/link';

export default function DeleteToolPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'title' | 'slug'>('title');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  // 搜索文章
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setStatusMessage('请输入搜索内容');
      return;
    }

    setIsSearching(true);
    setStatusMessage('正在搜索...');
    setSearchResults([]);

    try {
      // 使用不同的API端点根据搜索类型
      const endpoint = searchType === 'title' 
        ? `/api/posts-new?search=${encodeURIComponent(searchQuery)}&admin=true&limit=20` 
        : `/api/posts-new/${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`搜索失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 处理不同类型的响应
      if (searchType === 'title') {
        if (data.data && data.data.length > 0) {
          setSearchResults(data.data);
          setStatusMessage(`找到 ${data.data.length} 篇匹配文章`);
        } else {
          setStatusMessage('未找到匹配的文章');
        }
      } else {
        // 单篇文章直接放入结果数组
        if (data) {
          setSearchResults([data]);
          setStatusMessage('找到匹配的文章');
        } else {
          setStatusMessage('未找到匹配的文章');
        }
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setStatusMessage(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSearching(false);
    }
  };

  // 直接删除文章
  const handleDirectDelete = async () => {
    if (!searchQuery.trim()) {
      setStatusMessage('请输入要删除的文章标题或Slug');
      return;
    }

    if (!confirm(`确定要删除以下文章吗？\n${searchQuery}\n\n此操作不可逆！`)) {
      return;
    }

    setLoading(true);
    setStatusMessage('正在处理删除请求...');

    try {
      // 使用新的整合API
      const response = await fetch('/api/content-management', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: searchQuery.trim(),
          slugs: [] // 如果没有明确指定slug，API将根据标题查找
        })
      });

      if (!response.ok) {
        throw new Error(`删除失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.results && result.results.successful > 0) {
        setStatusMessage(`成功删除 ${result.results.successful} 篇文章`);
        setSearchResults([]);
      } else {
        setStatusMessage('未找到匹配的文章，或删除失败');
      }
    } catch (error) {
      console.error('删除文章失败:', error);
      setStatusMessage(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 删除单篇文章
  const handleDelete = async (slug: string) => {
    if (!confirm(`确定要删除这篇文章吗？此操作不可逆！`)) {
      return;
    }

    setLoading(true);
    setStatusMessage(`正在删除文章 ${slug}...`);

    try {
      // 使用新的整合API删除单篇文章
      const response = await fetch('/api/content-management', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slugs: [slug]
        })
      });

      if (!response.ok) {
        throw new Error(`删除失败: ${response.status}`);
      }

      const result = await response.json();

      // 从搜索结果中移除
      setSearchResults(prev => prev.filter(post => post.slug !== slug));
      setStatusMessage(`文章 ${slug} 已成功删除`);

      // 清除缓存
      await fetch('/api/cache/clear', { method: 'POST' });
    } catch (error) {
      console.error('删除文章失败:', error);
      setStatusMessage(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AdminHeader
        title="文章删除工具"
        subtitle="用于处理特殊情况下的文章删除"
      />

      <ContentSection title="删除文章">
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
          <p className="text-yellow-800 font-medium">⚠️ 警告：使用此工具将永久删除文章，此操作不可逆！</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入文章标题或Slug"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'title' | 'slug')}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="title">按标题</option>
            <option value="slug">按Slug</option>
          </select>
          
          <button
            onClick={handleSearch}
            disabled={isSearching || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSearching ? '搜索中...' : '搜索'}
          </button>
          
          <button
            onClick={handleDirectDelete}
            disabled={isSearching || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
          >
            直接删除
          </button>
        </div>

        {statusMessage && (
          <div className={`p-3 mb-4 rounded-md ${statusMessage.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {statusMessage}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">搜索结果</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">标题</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Slug</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">日期</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((post) => (
                    <tr key={post.slug} className="border-t">
                      <td className="px-4 py-2 text-sm">{post.title}</td>
                      <td className="px-4 py-2 text-sm font-mono">{post.slug}</td>
                      <td className="px-4 py-2 text-sm">{new Date(post.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          onClick={() => handleDelete(post.slug)}
                          disabled={loading}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-gray-400"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link href="/admin/posts" className="text-blue-600 hover:text-blue-800">
            ← 返回文章管理
          </Link>
        </div>
      </ContentSection>
    </div>
  );
} 