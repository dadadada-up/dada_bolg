import { getPosts } from "@/lib/github";
import { PostCard } from "@/components/post-card";
import { ClientWrapper } from "@/components/layout/client-wrapper";
import Link from "next/link";
import { Pagination } from "@/components/pagination";

// 每页显示的文章数量
const POSTS_PER_PAGE = 10;

export interface PostsPageProps {
  searchParams?: {
    page?: string;
  };
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  // 获取当前页码，默认为第1页
  const currentPage = Number(searchParams?.page) || 1;
  
  // 获取所有文章
  const allPosts = await getPosts();
  
  // 计算总页数
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  
  // 确保当前页码在有效范围内
  const validatedPage = Math.max(1, Math.min(currentPage, totalPages));
  
  // 根据页码截取当前页的文章
  const startIndex = (validatedPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = allPosts.slice(startIndex, endIndex);
  
  return (
    <ClientWrapper>
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold mb-4">所有文章</h1>
          <p className="text-muted-foreground">
            共计 {allPosts.length} 篇文章，当前显示第 {validatedPage} 页
          </p>
        </header>
        
        <div className="grid gap-8 mb-10">
          {currentPosts.length > 0 ? (
            currentPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">暂无文章</p>
            </div>
          )}
        </div>
        
        {totalPages > 1 && (
          <Pagination 
            currentPage={validatedPage} 
            totalPages={totalPages} 
            basePath="/posts" 
          />
        )}
      </div>
    </ClientWrapper>
  );
} 