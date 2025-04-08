import { Metadata } from "next";
import { getAllPosts } from "@/lib/github";
import PostCard from "@/components/PostCard";
import { ClientWrapper } from "@/components/layout/client-wrapper";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dada Blog - 首页",
  description: "Dada的个人博客，分享技术文章和生活随笔",
  keywords: ["博客", "技术", "前端", "React", "Next.js"],
  openGraph: {
    title: "Dada Blog - 首页",
    description: "Dada的个人博客，分享技术文章和生活随笔",
    type: "website",
    url: "https://dada-blog.vercel.app",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dada Blog",
      },
    ],
    siteName: "Dada Blog",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dada Blog - 首页",
    description: "Dada的个人博客，分享技术文章和生活随笔",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function HomePage() {
  console.log("开始获取所有文章...");
  const allPosts = await getAllPosts();
  console.log(`成功获取到 ${allPosts.length} 篇文章`);
  
  // 显示所有获取到的文章分类
  const categories = new Set<string>();
  allPosts.forEach(post => post.categories.forEach(cat => categories.add(String(cat))));
  console.log(`获取到的文章分类: ${Array.from(categories).join(', ')}`);
  
  // 获取最新的文章
  const latestPosts = allPosts.slice(0, 30);

  return (
    <ClientWrapper>
      <section className="mb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Dada 的个人博客</h1>
          <p className="text-xl text-muted-foreground">分享技术与生活的点滴思考</p>
        </div>
        
        <section>
          <h2 className="text-3xl font-bold mb-8">最新文章</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link 
              href="/posts" 
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md hover:opacity-90 transition-opacity"
            >
              查看所有文章
            </Link>
          </div>
        </section>
      </section>
    </ClientWrapper>
  );
} 