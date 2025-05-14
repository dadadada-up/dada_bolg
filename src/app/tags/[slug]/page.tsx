import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { MainLayout } from "@/components/layout/main-layout";
import { Post } from "@/types/post";
import { getTagParams, getTagBySlug, getPostsByTag } from "@/lib/static-generation";

// 使用静态生成工具函数获取标签参数
export async function generateStaticParams() {
  console.log('[标签页面] 开始生成静态参数');
  
  // 返回硬编码的参数，避免在构建时进行API调用
  console.log('[标签页面] 返回硬编码的静态参数');
  return [
    { slug: 'placeholder' }
  ];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  
  console.log(`[标签页面] 为 ${slug} 生成元数据`);
  
  return {
    title: `#${slug} - 标签 - Dada Blog`,
    description: `浏览带有 #${slug} 标签的所有文章`,
  };
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const tagName = params.slug;
  
  console.log(`[标签页面] 渲染标签页面: ${tagName}`);
  
  // 返回一个最小的内容，避免在构建时发出请求
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/tags" className="text-primary hover:underline">
            ← 返回所有标签
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-8">#{tagName}</h1>
        <p className="text-muted-foreground mb-8">
          加载中...
        </p>
      </div>
    </MainLayout>
  );
} 