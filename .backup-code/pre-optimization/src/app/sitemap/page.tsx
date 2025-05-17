import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Post } from "@/types/post";

export default async function SitemapPage() {
  // 通过API获取文章，使用与admin页面相同的数据源
  const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/posts-new?limit=1000`;
  
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

  // 按发布日期降序排序
  const sortedPosts = posts.slice().sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">站点地图</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">主要页面</h2>
          <ul className="space-y-2 pl-6 list-disc">
            <li>
              <Link href="/" className="text-primary hover:underline">首页</Link>
            </li>
            <li>
              <Link href="/categories" className="text-primary hover:underline">分类</Link>
            </li>
            <li>
              <Link href="/tags" className="text-primary hover:underline">标签</Link>
            </li>
            <li>
              <Link href="/archives" className="text-primary hover:underline">归档</Link>
            </li>
            <li>
              <Link href="/about" className="text-primary hover:underline">关于</Link>
            </li>
          </ul>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">所有文章 ({sortedPosts.length})</h2>
          <ul className="space-y-2 pl-6 list-disc">
            {sortedPosts.map((post) => (
              <li key={post.slug}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(post.date)}
                  </span>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-primary hover:underline"
                  >
                    {post.title}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MainLayout>
  );
} 