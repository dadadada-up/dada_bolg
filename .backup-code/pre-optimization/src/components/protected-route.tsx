'use client';

import { useAuth } from '@/contexts/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      // 如果未认证，重定向到登录页
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // 如果未认证，不渲染内容
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <p className="text-center text-gray-500">
          验证您的身份...
        </p>
      </div>
    );
  }

  // 已认证，正常渲染内容
  return <>{children}</>;
} 