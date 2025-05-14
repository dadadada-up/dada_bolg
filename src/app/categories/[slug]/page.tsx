import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { MainLayout } from "@/components/layout/main-layout";
import { Post } from "@/types/post";
import { getCategoryParams, getCategoryBySlug, getPostsByCategory } from "@/lib/static-generation";

// 使用静态生成工具函数获取分类参数
export async function generateStaticParams() {
  return getCategoryParams();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  
  // 获取分类信息
  const category = await getCategoryBySlug(slug);
  
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
  
  // 获取分类信息
  const category = await getCategoryBySlug(categorySlug);
  const categoryName = category?.name || categorySlug;
  
  // 获取分类下的文章
  const posts = await getPostsByCategory(categorySlug);
  
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