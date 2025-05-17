'use client';

import React from 'react';

interface StatCardProps {
  value: number | string;
  label: string;
  trend?: {
    value: number;
    type: 'up' | 'down';
  };
  icon?: React.ReactNode;
}

function StatCard({ value, label, trend, icon }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex justify-between items-start">
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
          {trend && (
            <div className={`stat-trend ${trend.type}`}>
              {trend.type === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && <div className="text-2xl opacity-70">{icon}</div>}
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  stats: {
    totalPosts: number;
    totalCategories: number;
    totalTags: number;
    totalComments?: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const { totalPosts, totalCategories, totalTags, totalComments = 0 } = stats;
  
  return (
    <div className="dashboard-cards">
      <StatCard 
        value={totalPosts} 
        label="文章" 
        trend={{ value: 5, type: 'up' }}
        icon="📄"
      />
      <StatCard 
        value={totalCategories} 
        label="分类" 
        icon="🗂️"
      />
      <StatCard 
        value={totalTags} 
        label="标签" 
        icon="🏷️"
      />
      <StatCard 
        value={totalComments} 
        label="评论" 
        trend={{ value: 12, type: 'up' }}
        icon="💬"
      />
    </div>
  );
} 