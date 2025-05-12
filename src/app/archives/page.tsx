import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Post } from "@/types/post";

export default async function ArchivesPage() {
  // 通过API获取文章，使用与admin页面相同的数据源
  const apiUrl = new URL('/api/posts-new', 'http://localhost:3001');
  apiUrl.searchParams.set('limit', '1000');
  
  const response = await fetch(apiUrl, { 
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    }
  });
  
  if (!response.ok) {
    throw new Error('获取文章失败');
  }
  
  const data = await response.json();
  const posts: Post[] = data.data || [];

  // 按年份分组文章
  const postsByYear = posts.reduce((acc, post) => {
    // 确保date字段存在，使用created_at或createdAt作为备选
    const postDate = post.date || post.created_at || post.createdAt || new Date().toISOString();
    const year = new Date(postDate).getFullYear().toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(post);
    return acc;
  }, {} as Record<string, typeof posts>);
  
  // 按年份降序排序
  const years = Object.keys(postsByYear).sort((a, b) => parseInt(b) - parseInt(a));
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">文章归档</h1>
        <p className="text-muted-foreground mb-8">
          共计 {posts.length} 篇文章
        </p>
        
        <div className="space-y-12">
          {years.map(year => (
            <div key={year} className="relative">
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold">{year}年</h2>
                <div className="ml-4 text-sm text-muted-foreground">
                  {postsByYear[year].length} 篇文章
                </div>
              </div>
              
              <ul className="space-y-4 relative border-l border-muted-foreground/20 pl-6 ml-2">
                {postsByYear[year]
                  .sort((a, b) => {
                    const dateA = a.date || a.created_at || a.createdAt || '';
                    const dateB = b.date || b.created_at || b.createdAt || '';
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                  })
                  .map(post => (
                    <li key={post.slug} className="relative">
                      <span className="absolute w-3 h-3 bg-primary rounded-full left-[-1.9rem] top-2"></span>
                      <div className="flex flex-col sm:flex-row">
                        <span className="text-sm text-muted-foreground min-w-28 sm:mr-4">
                          {formatDate(post.date || post.created_at || post.createdAt || '')}
                        </span>
                        <Link
                          href={`/posts/${post.slug}`}
                          className="hover:text-primary hover:underline"
                        >
                          {post.title}
                        </Link>
                      </div>
                    </li>
                  ))
                }
              </ul>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 