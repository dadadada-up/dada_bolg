'use client';

import { useState, useEffect } from 'react';
import { getAllPosts, Post } from '@/lib/github';
import Link from 'next/link';

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const allPosts = await getAllPosts();
        setPosts(allPosts);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取文章失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <div className="p-4">加载中...</div>;
  if (error) return <div className="p-4 text-red-500">错误: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">博客管理</h1>
        <Link 
          href="/admin/new" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          新建文章
        </Link>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <div 
            key={post.slug} 
            className="border p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="text-gray-600 text-sm mt-1">
                  分类: {post.categories.join(', ')} | 
                  日期: {new Date(post.date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/edit/${post.slug}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  编辑
                </Link>
                <button
                  onClick={() => {/* TODO: 实现删除功能 */}}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 