'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

export function AuthLinks() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <>
          <div className="hidden md:flex items-center gap-1">
            <span className="text-sm text-muted-foreground">
              {user?.username}
            </span>
          </div>
          <Link
            href="/admin"
            className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm hover:bg-opacity-90"
          >
            管理
          </Link>
          <button
            onClick={logout}
            className="px-3 py-1 rounded-md border border-muted-foreground text-sm hover:bg-muted"
          >
            登出
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="px-3 py-1 rounded-md border border-muted-foreground text-sm hover:bg-muted"
        >
          登录
        </Link>
      )}
    </div>
  );
} 