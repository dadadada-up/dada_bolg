'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export default function AdminHeader({ title, description, className }: AdminHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Link 
            href="/admin/dashboard" 
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            仪表盘
          </Link>
          <Link 
            href="/" 
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            target="_blank"
          >
            查看网站
          </Link>
        </div>
      </div>
    </div>
  );
} 