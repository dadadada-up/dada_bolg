'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { EnhancedAdminSidebar } from '@/components/admin/EnhancedAdminSidebar';
import { FiMenu } from 'react-icons/fi';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  // 检测是否是移动设备
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检测窗口大小
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 初始检测
    checkMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);
    
    // 清理监听
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 重置侧边栏状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 默认为展开状态
      if (!localStorage.getItem('sidebarCollapsedInitialized')) {
        localStorage.setItem('sidebarCollapsed', 'false');
        localStorage.setItem('sidebarCollapsedInitialized', 'true');
      }
    }
  }, []);

  return (
    <ProtectedRoute>
      <div className="admin-layout">
        {/* 侧边导航 */}
        <EnhancedAdminSidebar />
        
        {/* 主内容区 */}
        <main className="admin-main">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
} 