import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { MainLayout } from "@/components/layout/main-layout";
import { Post } from "@/types/post";
import { tagRepository, postRepository } from "@/lib/db/repositories";

// 直接使用仓库获取标签数据，而不是通过API
export async function generateStaticParams() {
  try {
    // 直接通过数据库仓库获取所有标签
    const tags = await tagRepository.getAllTags();
    
    return tags.map((tag) => ({
      slug: tag.slug,
    }));
  } catch (error) {
    console.error('生成静态参数时获取标签失败:', error);
    return [];
  }
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
  
  // 直接从数据库获取该标签下的文章
  try {
    const { posts, total } = await postRepository.getAllPosts({
      tag: tagName,
      limit: 100,
      published: true,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    
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
  } catch (error) {
    console.error('获取标签文章失败:', error);
    notFound();
  }
} 