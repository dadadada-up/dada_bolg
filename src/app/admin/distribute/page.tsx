'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { PlatformDistributor } from '@/components/PlatformDistributor';
import { Post } from '@/types/post';
import Link from 'next/link';

export default function DistributePage() {
  const searchParams = useSearchParams();
  const postSlug = searchParams.get('slug');
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchPost() {
      if (!postSlug) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/posts-new/${postSlug}`);
        if (!response.ok) {
          throw new Error(`无法获取文章: ${response.statusText}`);
        }
        
        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取文章失败');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPost();
  }, [postSlug]);
  
  return (
    <MainLayout>
      <div className="container py-6">
        <div className="w-full">
          <h1 className="text-3xl font-bold mb-6">内容分发</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-1/3 dark:bg-gray-700"></div>
              <div className="h-32 bg-gray-200 rounded dark:bg-gray-700"></div>
              <div className="h-12 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
            </div>
          ) : postSlug && post ? (
            <div className="space-y-6">
              <div className="bg-secondary p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-medium">{post.title}</h2>
                  <Link 
                    href={`/admin/edit-post/${post.slug}`}
                    className="text-sm text-primary hover:underline"
                  >
                    编辑文章
                  </Link>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <span className="inline-block mr-4">发布日期: {post.date}</span>
                  {post.categories.map((category, i) => (
                    <span key={i} className="inline-block mr-2 px-2 py-0.5 bg-primary/10 rounded text-xs">
                      {post.displayCategories?.[i] || category}
                    </span>
                  ))}
                </div>
              </div>
              
              <PlatformDistributor post={post} />
            </div>
          ) : (
            <div className="text-center py-12 bg-secondary rounded-lg">
              <p className="text-lg mb-4">请选择要分发的文章</p>
              <Link 
                href="/admin" 
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                返回文章列表
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 