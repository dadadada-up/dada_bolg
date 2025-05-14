import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { MainLayout } from '@/components/layout/main-layout';
import { Category } from '@/types/post';

// 获取基础URL函数
function getBaseUrl() {
  // 在服务器端渲染时，使用环境变量
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // 默认为本地开发环境
  return 'http://localhost:3001';
}

// 设置页面元数据
export const metadata: Metadata = {
  title: '文章分类 | Dada Blog',
  description: '浏览Dada博客的所有文章分类',
};

type CategoryWithDisplay = {
  name: string;       // 分类英文标识
  displayName: string; // 显示名称（中文）
  count: number;      // 文章数量
};

async function getCategories(): Promise<CategoryWithDisplay[]> {
  try {
    // 使用绝对路径API URL
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/categories-new`);
    
    if (!res.ok) {
      throw new Error(`获取分类失败: ${res.status}`);
    }
    
    const categories = await res.json();
    
    // 过滤掉文章数为0的分类
    const filteredCategories = categories.filter((category: Category) => category.postCount > 0);
    
    // 转换为需要的格式
    return filteredCategories.map((category: Category) => ({
      name: category.slug, // 使用slug作为英文标识
      displayName: category.name, // 使用name作为显示名称
      count: category.postCount // 使用postCount作为文章数量
    }));
  } catch (error) {
    console.error('获取分类数据失败:', error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">文章分类</h1>
        
        <p className="mb-8 text-muted-foreground">
          共计 {categories.length} 个分类
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/categories/${category.name}`}
              className="block p-6 border rounded-lg hover:border-primary transition-colors"
            >
              <h2 className="text-xl font-semibold">{category.displayName}</h2>
              <p className="text-muted-foreground mt-2">
                {category.count} 篇文章
              </p>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 