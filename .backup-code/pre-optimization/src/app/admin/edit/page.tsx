'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminEditRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // 立即重定向到仪表盘页面
    router.replace('/admin/dashboard');
  }, [router]);
  
  // 提供立即跳转链接作为备用
  return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <p className="text-muted-foreground">正在重定向到仪表盘页面...</p>
      <Link 
        href="/admin/dashboard" 
        className="text-primary underline hover:text-primary/80"
      >
        如果没有自动跳转，请点击这里
      </Link>
    </div>
  );
} 