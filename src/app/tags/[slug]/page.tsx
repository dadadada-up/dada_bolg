import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { MainLayout } from "@/components/layout/main-layout";
import { Post } from "@/types/post";
import { getTagParams, getTagBySlug, getPostsByTag } from "@/lib/static-generation";

// 使用静态生成工具函数获取标签参数
export async function generateStaticParams() {
  return getTagParams();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  
  return {
    title: `#${slug} - 标签 - Dada Blog`,
    description: `浏览带有 #${slug} 标签的所有文章`,
  };
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const tagName = params.slug;
  
  // 获取标签下的文章
  const posts = await getPostsByTag(tagName);
  
  // 如果标签不存在或没有文章，返回404
  if (posts.length === 0) {
    notFound();
  }
  
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
          共 {posts.length} 篇文章
        </p>
        
        <div className="grid gap-8">
          {posts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 