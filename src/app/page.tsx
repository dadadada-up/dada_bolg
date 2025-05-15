import { Metadata } from "next";
import { PostCard } from "@/components/post-card";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Post, Category } from "@/types/post";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { FeaturedPosts } from "@/components/home/featured-posts";
import { categoryMappings } from "@/lib/github";
import { headers } from "next/headers";

// 配置页面为动态渲染
export const dynamic = 'force-dynamic';

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

// 备用分类数据
const fallbackCategories: Category[] = [
  { name: "产品管理", slug: "product-management", postCount: 5 },
  { name: "技术工具", slug: "tech-tools", postCount: 8 },
  { name: "家庭生活", slug: "family-life", postCount: 4 },
  { name: "保险", slug: "insurance", postCount: 3 },
  { name: "金融", slug: "finance", postCount: 3 },
  { name: "开源", slug: "open-source", postCount: 2 },
  { name: "个人博客", slug: "personal-blog", postCount: 1 }
];

// 获取当前主机URL
function getBaseUrl() {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // 回退到请求头获取主机
  try {
    const headersList = headers();
    const host = headersList.get("host") || "localhost:3002"; // 更新默认端口
    const protocol = host.includes("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  } catch (error) {
    // 最终回退到默认值
    console.error("获取请求头失败，使用默认值:", error);
    return "http://localhost:3002";
  }
}

export default async function HomePage() {
  // 获取基础URL
  const baseUrl = getBaseUrl();
  console.log("基础URL:", baseUrl);
  
  // 通过API获取文章
  const apiUrl = `${baseUrl}/api/posts-new?limit=6`;
  console.log("文章API URL:", apiUrl);
  
  let posts: Post[] = [];
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error("获取文章失败:", response.status, response.statusText);
      throw new Error('获取文章失败');
    }
    
    const data = await response.json();
    posts = data.data || [];
  } catch (error) {
    console.error("获取文章出错:", error);
    // 失败时使用空数组
    posts = [];
  }

  // 获取所有分类
  const categoriesApiUrl = `${baseUrl}/api/categories-new`;
  console.log("分类API URL:", categoriesApiUrl);
  
  let categories: Category[] = [];
  try {
    const categoriesResponse = await fetch(categoriesApiUrl);
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('分类数据:', categoriesData);
      
      // 根据API返回的格式取出分类数据
      if (Array.isArray(categoriesData)) {
        // API直接返回数组
        categories = categoriesData;
      } else if (categoriesData && categoriesData.data && Array.isArray(categoriesData.data)) {
        // API返回包含data字段的对象
        categories = categoriesData.data;
      }
      
      // 筛选有文章的分类展示
      categories = categories
        .filter(category => category.postCount > 0);
    }
  } catch (error) {
    console.error('获取分类失败:', error);
  }
  
  // 如果没有获取到分类数据，使用备用数据
  if (!categories || categories.length === 0) {
    console.log('使用备用分类数据');
    categories = fallbackCategories;
  }

  // 精选文章（手动指定的文章slug列表）
  // 这里可以从配置文件或CMS中获取
  const featuredPostSlugs = ["getting-started", "welcome-to-dada-blog"];

  return (
    <MainLayout>
      {/* 英雄区域 */}
      <HeroSection />
      
      {/* 精选文章 */}
      <FeaturedPosts postSlugs={featuredPostSlugs} posts={posts} />
      
      {/* 最新文章 */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">最新文章</h2>
          <Link href="/posts" className="text-primary hover:underline">
            查看全部 →
          </Link>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
      
      {/* 精选分类 */}
      <FeaturedCategories categories={categories} />
      
      {/* 关于我区域 */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">关于我</h2>
        <div className="bg-secondary/50 rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-muted rounded-full w-24 h-24 flex items-center justify-center text-2xl font-bold">
              D
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Dada</h3>
              <p className="text-muted-foreground mb-4">
                前端开发者，热爱技术与写作。这里记录我的技术成长和生活感悟...
              </p>
              <Link 
                href="/about" 
                className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                了解更多
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 