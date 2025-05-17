'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // 将根管理页面重定向到仪表盘
    router.push('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="mb-4 text-2xl font-bold">正在重定向到仪表盘...</div>
        <div className="text-muted-foreground">请稍候，如果您没有被自动重定向，请点击<a href="/admin/dashboard" className="text-blue-500 hover:underline">这里</a></div>
      </div>
    </div>
  );
} 