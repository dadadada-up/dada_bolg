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
  // 通过API获取所有标签
  const baseUrl = getBaseUrl();
  const apiUrl = `${baseUrl}/api/tags`;
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    console.error('生成静态参数时获取标签失败');
    return [];
  }
  
  const tags = await response.json();
  
  return tags.map((tag: { slug: string }) => ({
    slug: tag.slug,
  }));
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
  const baseUrl = getBaseUrl();
  
  // 通过API获取该标签下的文章
  const apiUrl = `${baseUrl}/api/posts-new?tag=${tagName}&limit=100`;
  
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