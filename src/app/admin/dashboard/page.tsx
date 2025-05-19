'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { ContentSection, ContentSectionAction } from '@/components/admin/ContentSection';
import { formatDate, formatNumber } from '@/lib/utils';

interface DashboardData {
  posts: {
    total: number;
    published: number;
    draft: number;
    categories: Record<string, number>;
    tags: Record<string, number>;
  };
  stats: {
    totalViews: number;
    totalComments: number;
    avgReadTime: number;
  };
  recentPosts: Array<{
    id: string;
    title: string;
    slug: string;
    date: string;
    views: number;
  }>;
}

export default function DashboardPage() {
  const [dataSource, setDataSource] = useState<string>('primary');
  
  // 尝试从主API获取数据
  const { data: primaryData, isLoading: isPrimaryLoading, error: primaryError } = useSWR<DashboardData>(
    '/api/dashboard-new', 
    async (url: string) => {
      try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('获取仪表盘数据失败');
    }
    return response.json();
      } catch (error) {
        console.error('主API获取仪表盘数据失败:', error);
        // 标记使用备用API
        setDataSource('backup');
        throw error;
      }
    },
    { 
      revalidateOnFocus: false,
      dedupingInterval: 10000
    }
  );
  
  // 如果主API失败，尝试从备用API获取数据
  const { data: backupData, isLoading: isBackupLoading, error: backupError } = useSWR<DashboardData>(
    primaryError ? '/api/dashboard-new-fixed' : null,
    async (url: string) => {
      try {
        console.log('尝试从备用API获取数据...');
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('从备用API获取仪表盘数据失败');
        }
        return response.json();
      } catch (error) {
        console.error('备用API获取仪表盘数据失败:', error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000
    }
  );
  
  // 合并数据，优先使用主API的数据，如果主API失败则使用备用API的数据
  const data = primaryError ? backupData : primaryData;
  const isLoading = dataSource === 'primary' ? isPrimaryLoading : isBackupLoading;
  const error = primaryError && backupError;
  
  // 数据来源提示
  useEffect(() => {
    if (primaryError && backupData) {
      console.log('使用备用API数据源');
    } else if (primaryData) {
      console.log('使用主API数据源');
    }
  }, [primaryData, backupData, primaryError]);
  
  // 假设这些数据会从API中获取
  const stats = {
    totalPosts: data?.posts.total || 0,
    totalCategories: Object.keys(data?.posts.categories || {}).length,
    totalTags: Object.keys(data?.posts.tags || {}).length,
    totalComments: data?.stats.totalComments || 0
  };
  
  return (
    <div>
      <AdminHeader 
        title="仪表盘" 
        subtitle="博客数据概览和统计信息"
      />
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          无法获取仪表盘数据，请检查数据库连接或网络状态
        </div>
      )}
      
      {dataSource === 'backup' && backupData && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded text-sm">
          使用本地备用数据源
        </div>
      )}
      
      {/* 数据统计卡片 */}
      {isLoading ? (
        <div className="dashboard-cards animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card">
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      ) : (
        <DashboardStats stats={stats} />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* 最近文章 */}
        <ContentSection 
          title="最近发布" 
          actions={
            <ContentSectionAction onClick={() => window.location.href = '/admin/posts'}>
              查看全部
            </ContentSectionAction>
          }
        >
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between">
                  <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {data?.recentPosts.map(post => (
                <div key={post.id} className="py-3 flex justify-between items-center">
                  <a 
                    href={`/posts/${post.slug}`} 
                    className="text-blue-600 hover:underline font-medium"
                    target="_blank"
                  >
                    {post.title}
                  </a>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {formatDate(post.date, 'relative')}
                    </span>
                    <span className="text-sm font-medium">
                      {formatNumber(post.views)} 访问
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ContentSection>
        
        {/* 访问统计 */}
        <ContentSection title="访问统计">
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">图表区域 - 显示访问统计图表</p>
          </div>
        </ContentSection>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* 热门分类 */}
        <ContentSection title="热门分类">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between">
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-5 bg-gray-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(data?.posts.categories || {})
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 5)
                .map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <div className="font-medium">{category}</div>
                    <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {count} 篇文章
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </ContentSection>
        
        {/* 热门标签 */}
        <ContentSection title="热门标签">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between">
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(data?.posts.tags || {})
                .sort(([, countA], [, countB]) => countB - countA)
                .map(([tag, count]) => (
                  <div 
                    key={tag} 
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full text-sm cursor-pointer"
                  >
                    {tag} ({count})
                  </div>
                ))
              }
            </div>
          )}
        </ContentSection>
      </div>
    </div>
  );
} 