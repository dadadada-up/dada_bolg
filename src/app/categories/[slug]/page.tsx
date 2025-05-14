import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { MainLayout } from "@/components/layout/main-layout";
import { Post } from "@/types/post";

// 获取基础URL函数
function getBaseUrl() {
  // 在服务器端渲染时，使用环境变量
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // 默认为本地开发环境
  return 'http://localhost:3001';
}

export async function generateStaticParams() {
  // 通过API获取所有分类
  const baseUrl = getBaseUrl();
  const apiUrl = `${baseUrl}/api/categories-new`;
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    console.error('生成静态参数时获取分类失败');
    return [];
  }
  
  const categories = await response.json();
  
  return categories.map((category: { slug: string }) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  
  // 获取分类信息
  const baseUrl = getBaseUrl();
  const apiUrl = `${baseUrl}/api/categories-new`;
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    return {
      title: `${slug} 分类的文章 - Dada Blog`,
      description: `查看所有 ${slug} 分类下的文章。`,
    };
  }
  
  const categories = await response.json();
  const category = categories.find((cat: { slug: string }) => cat.slug === slug);
  
  if (!category) {
    return {
      title: `${slug} 分类的文章 - Dada Blog`,
      description: `查看所有 ${slug} 分类下的文章。`,
    };
  }
  
  return {
    title: `${category.name} 分类的文章 - Dada Blog`,
    description: `查看所有 ${category.name} 分类下的文章。`,
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categorySlug = params.slug;
  const baseUrl = getBaseUrl();
  
  // 获取分类信息
  const categoriesApiUrl = `${baseUrl}/api/categories-new`;
  const categoriesResponse = await fetch(categoriesApiUrl);
  
  let categoryName = categorySlug;
  if (categoriesResponse.ok) {
    const categories = await categoriesResponse.json();
    const category = categories.find((cat: { slug: string }) => cat.slug === categorySlug);
    if (category) {
      categoryName = category.name;
    }
  }
  
  // 通过API获取该分类下的文章
  const apiUrl = `${baseUrl}/api/posts-new?category=${categorySlug}&limit=1000`;
  
  const response = await fetch(apiUrl, { 
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    }
  });
  
  if (!response.ok) {
    notFound();
  }
  
  const data = await response.json();
  const posts: Post[] = data.data || [];
  
  // 如果分类不存在或没有文章，返回404
  if (posts.length === 0) {
    notFound();
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/categories" className="text-primary hover:underline">
            ← 返回所有分类
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{categoryName} 分类</h1>
        
        <p className="mb-8 text-muted-foreground">
          共找到 {posts.length} 篇文章
        </p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 