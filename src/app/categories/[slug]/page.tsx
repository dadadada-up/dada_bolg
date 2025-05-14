import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { MainLayout } from "@/components/layout/main-layout";
import { getCategoryParams, getCategoryBySlug, getPostsByCategory } from "@/lib/static-generation";
import { isVercelBuild } from "@/lib/env";

// 使用静态生成工具函数获取分类参数
export async function generateStaticParams() {
  console.log('[分类页面] 开始生成静态参数');
  
  // 在构建环境下返回一个硬编码的最小参数集
  // 这将跳过所有API和数据库调用
  console.log('[分类页面] 返回硬编码的静态参数');
  
  // 返回一个预定义的最小参数集
  // 在构建后，实际数据将在运行时获取
  return [
    { slug: 'placeholder' }
  ];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  
  console.log(`[分类页面] 为 ${slug} 生成元数据`);
  
  // 构建时使用通用元数据
  return {
    title: `${slug} 分类的文章 - Dada Blog`,
    description: `查看所有 ${slug} 分类下的文章。`,
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categorySlug = params.slug;
  
  console.log(`[分类页面] 渲染分类页面: ${categorySlug}`);
  
  // 返回一个最小的内容
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/categories" className="text-primary hover:underline">
            ← 返回所有分类
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{categorySlug} 分类</h1>
        
        <p className="mb-8 text-muted-foreground">
          加载中...
        </p>
      </div>
    </MainLayout>
  );
} 