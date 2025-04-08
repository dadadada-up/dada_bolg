import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts } from "@/lib/github";
import PostCard from "@/components/PostCard";
import { MainLayout } from "@/components/layout/main-layout";
import { slugify } from "@/lib/utils";

// 生成静态路由参数
export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  // 获取所有唯一的标签
  const tags = new Set<string>();
  
  posts.forEach(post => {
    post.tags.forEach(tag => tags.add(tag));
  });
  
  return Array.from(tags).map(tag => ({
    slug: tag,
  }));
}

// 为每个标签页面生成元数据
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tagName = params.slug;
  
  return {
    title: `#${tagName} - 标签 - Dada Blog`,
    description: `浏览包含 #${tagName} 标签的所有文章`,
    keywords: ["博客", tagName, "标签", "技术"],
    openGraph: {
      title: `#${tagName} - 标签 - Dada Blog`,
      description: `浏览包含 #${tagName} 标签的所有文章`,
      type: "website",
      url: `https://dada-blog.vercel.app/tags/${tagName}`,
    },
  };
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const tagName = params.slug;
  const posts = await getAllPosts();
  
  // 筛选包含该标签的文章
  const tagPosts = posts.filter(post => 
    post.tags.includes(tagName)
  );
  
  // 如果标签不存在，返回404
  if (tagPosts.length === 0) {
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
          共 {tagPosts.length} 篇文章
        </p>
        
        <div className="grid gap-8">
          {tagPosts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 