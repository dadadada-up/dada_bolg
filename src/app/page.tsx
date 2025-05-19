import { Metadata } from "next";
import { PostCard } from "@/components/post-card";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Post, Category } from "@/types/post";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { FeaturedPosts } from "@/components/home/featured-posts";
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
  // 在服务器端，从请求头获取主机信息
    const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
    return `${protocol}://${host}`;
}

export default async function HomePage() {
  // 使用绝对URL路径进行API请求
  const baseUrl = getBaseUrl();
  
  // 准备默认数据
  let posts: Post[] = [];
  let categories: Category[] = [];
  let postsError: string | null = null;
  let categoriesError: string | null = null;
  
  // 获取文章数据
  const postsApiPath = `${baseUrl}/api/posts?limit=6`;
  console.log("文章API路径:", postsApiPath);
  
  try {
    const response = await fetch(postsApiPath, { 
      cache: 'no-store', // 确保获取最新内容
      next: { revalidate: 60 } // 每60秒重新验证一次
    });
    
    if (!response.ok) {
      console.error("获取文章失败:", response.status, response.statusText);
      throw new Error(`获取文章失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 检查API返回的数据格式
    if (!data || typeof data !== 'object') {
      console.error("API返回的数据格式不正确:", data);
      throw new Error('API返回的数据格式不正确');
    }
    
    // 根据API返回的数据结构获取文章列表
    if (data.data && data.data.length > 0) {
      posts = data.data;
    } else if (Array.isArray(data) && data.length > 0) {
      posts = data;
    } else {
      console.log("API返回空数据，使用备用数据");
      posts = getAllFallbackPosts().slice(0, 6);
    }
  } catch (error) {
    console.error("获取文章出错:", error);
    postsError = error instanceof Error ? error.message : '未知错误';
    posts = getAllFallbackPosts().slice(0, 6);
  }

  // 获取所有分类 - 使用绝对URL路径
  const categoriesApiPath = `${baseUrl}/api/categories`;
  console.log("分类API路径:", categoriesApiPath);
  
  try {
    const categoriesResponse = await fetch(categoriesApiPath, { 
      cache: 'no-store', // 确保获取最新内容
      next: { revalidate: 60 } // 每60秒重新验证一次
    });
      
    if (!categoriesResponse.ok) {
      console.error("获取分类失败:", categoriesResponse.status, categoriesResponse.statusText);
      throw new Error(`获取分类失败: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
    }
    
        const categoriesData = await categoriesResponse.json();
    
    // 检查API返回的数据格式
    if (!categoriesData) {
      console.error("分类API返回的数据格式不正确:", categoriesData);
      throw new Error('分类API返回的数据格式不正确');
    }
        
        // 根据API返回的格式取出分类数据
    if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          // API直接返回数组
          categories = categoriesData;
    } else if (categoriesData && categoriesData.data && Array.isArray(categoriesData.data) && categoriesData.data.length > 0) {
          // API返回包含data字段的对象
          categories = categoriesData.data;
      } else {
      console.log("分类API返回空数据，使用备用数据");
      categories = fallbackCategories;
    }
  } catch (error) {
    console.error('获取分类失败:', error);
    categoriesError = error instanceof Error ? error.message : '未知错误';
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
      {!posts.length ? (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">精选文章</h2>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">无法加载精选文章</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {postsError ? `错误: ${postsError}` : "抱歉，加载文章数据时出现错误。请稍后再试。"}
            </p>
          </div>
        </div>
      ) : (
      <FeaturedPosts postSlugs={featuredPostSlugs} posts={posts} />
      )}
      
      {/* 最新文章 */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">最新文章</h2>
          <Link href="/posts" className="text-primary hover:underline">
            查看全部 →
          </Link>
        </div>
        
        {!posts.length ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">无法加载文章</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {postsError ? `错误: ${postsError}` : "抱歉，加载文章数据时出现错误。请稍后再试。"}
            </p>
          </div>
        ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
        )}
      </div>
      
      {/* 精选分类 */}
      {!categories.length ? (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">文章分类</h2>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">无法加载分类</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {categoriesError ? `错误: ${categoriesError}` : "抱歉，加载分类数据时出现错误。请稍后再试。"}
            </p>
          </div>
        </div>
      ) : (
      <FeaturedCategories categories={categories} />
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