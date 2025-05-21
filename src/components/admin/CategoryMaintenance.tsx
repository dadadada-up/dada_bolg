'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

// 内联SVG加载图标
const LoadingIcon = () => (
  <svg
    className="mr-2 h-4 w-4 animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export function CategoryMaintenance() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 加载分类数据
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to load categories');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadCategories();
  }, []);
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div className="error">加载失败: {error}</div>;
  
  return (
    <div className="category-maintenance">
      <h2 className="text-2xl font-bold mb-4">分类管理</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">名称</th>
              <th className="px-6 py-3">Slug</th>
              <th className="px-6 py-3">描述</th>
              <th className="px-6 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id} className="bg-white border-b">
                <td className="px-6 py-4">{category.id}</td>
                <td className="px-6 py-4">{category.name}</td>
                <td className="px-6 py-4">{category.slug}</td>
                <td className="px-6 py-4">{category.description || '-'}</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:underline mr-2">编辑</button>
                  <button className="text-red-600 hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} // 保持默认导出，同时提供命名导出
export default CategoryMaintenance;
