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
import { getAllFallbackPosts, fallbackCategories } from "@/lib/fallback-data";

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

// 获取当前主机URL
function getBaseUrl() {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // 回退到请求头获取主机
  try {
    const headersList = headers();
    const host = headersList.get("host") || "localhost:3001"; 
    const protocol = host.includes("localhost") ? "http" : "https";
    
    // 确保使用当前主机和协议
    return `${protocol}://${host}`;
  } catch (error) {
    // 最终回退到默认值,使用当前Next.js服务端口
    console.error("获取请求头失败，使用默认值:", error);
    return "http://localhost:3001";
  }
}

export default async function HomePage() {
  // 获取基础URL
  const baseUrl = getBaseUrl();
  console.log("基础URL:", baseUrl);
  
  // 通过API获取文章 - 使用posts路由而非posts-new
  const apiUrl = `${baseUrl}/api/posts?limit=6`;
  console.log("文章API URL:", apiUrl);
  
  let posts: Post[] = [];
  let postsError = false;
  
  try {
    const response = await fetch(apiUrl, { 
      cache: 'no-store' // 确保获取最新内容
    });
    
    if (!response.ok) {
      console.error("获取文章失败:", response.status, response.statusText);
      throw new Error('获取文章失败');
    }
    
    const data = await response.json();
    posts = data.data || [];
    
    // 如果没有文章数据，设置错误状态
    if (!posts || posts.length === 0) {
      console.log("API返回空数据");
      postsError = true;
    }
  } catch (error) {
    console.error("获取文章出错:", error);
    postsError = true;
  }

  // 获取所有分类 - 使用categories路由
  const categoriesApiUrl = `${baseUrl}/api/categories`;
  console.log("分类API URL:", categoriesApiUrl);
  
  let categories: Category[] = [];
  let categoriesError = false;
  
  try {
    const categoriesResponse = await fetch(categoriesApiUrl, { 
      cache: 'no-store' // 确保获取最新内容
    });
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      
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
        
      if (categories.length === 0) {
        categoriesError = true;
      }
    } else {
      throw new Error('获取分类失败');
    }
  } catch (error) {
    console.error('获取分类失败:', error);
    categoriesError = true;
  }

  // 精选文章（手动指定的文章slug列表）
  // 这里可以从配置文件或CMS中获取
  const featuredPostSlugs = ["getting-started", "welcome-to-dada-blog"];

  return (
    <MainLayout>
      {/* 英雄区域 */}
      <HeroSection />
      
      {/* 精选文章 */}
      {!postsError ? (
        <FeaturedPosts postSlugs={featuredPostSlugs} posts={posts} />
      ) : (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">精选文章</h2>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">无法加载精选文章</h3>
            <p className="text-gray-700 dark:text-gray-300">
              抱歉，加载文章数据时出现错误。请稍后再试。
            </p>
          </div>
        </div>
      )}
      
      {/* 最新文章 */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">最新文章</h2>
          <Link href="/posts" className="text-primary hover:underline">
            查看全部 →
          </Link>
        </div>
        
        {!postsError ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">无法加载文章</h3>
            <p className="text-gray-700 dark:text-gray-300">
              抱歉，加载文章数据时出现错误。请稍后再试。
            </p>
          </div>
        )}
      </div>
      
      {/* 精选分类 */}
      {!categoriesError ? (
        <FeaturedCategories categories={categories} />
      ) : (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">文章分类</h2>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">无法加载分类</h3>
            <p className="text-gray-700 dark:text-gray-300">
              抱歉，加载分类数据时出现错误。请稍后再试。
            </p>
          </div>
        </div>
      )}
      
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