import { Metadata } from "next";
import { PostCard } from "@/components/post-card";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Post, Category } from "@/types/post";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { FeaturedPosts } from "@/components/home/featured-posts";
import { categoryMappings } from "@/lib/github";

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

export default async function HomePage() {
  // 通过API获取文章
  const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/posts-new?limit=6`;
  
  const response = await fetch(apiUrl, { 
    next: { revalidate: 3600 } // 每小时重新验证一次
  });
  
  if (!response.ok) {
    throw new Error('获取文章失败');
  }
  
  const data = await response.json();
  const posts: Post[] = data.data || [];

  // 获取所有分类
  const categoriesApiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/categories-new`;
  
  let categories: Category[] = [];
  try {
    const categoriesResponse = await fetch(categoriesApiUrl, { 
      next: { revalidate: 3600 }
    });
    
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