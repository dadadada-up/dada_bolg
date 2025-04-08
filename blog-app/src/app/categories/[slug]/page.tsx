import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts } from "@/lib/github";
import PostCard from "@/components/PostCard";
import { MainLayout } from "@/components/layout/main-layout";

// 生成静态路由参数
export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  // 获取所有唯一的分类
  const categories = new Set<string>();
  
  posts.forEach(post => {
    post.categories.forEach(category => categories.add(category));
  });
  
  return Array.from(categories).map(category => ({
    slug: category,
  }));
}

// 为每个分类页面生成元数据
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const categoryName = params.slug;
  
  return {
    title: `${categoryName} - 分类 - Dada Blog`,
    description: `浏览 ${categoryName} 分类下的所有文章`,
    keywords: ["博客", categoryName, "分类", "技术"],
    openGraph: {
      title: `${categoryName} - 分类 - Dada Blog`,
      description: `浏览 ${categoryName} 分类下的所有文章`,
      type: "website",
      url: `https://dada-blog.vercel.app/categories/${categoryName}`,
    },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categoryName = params.slug;
  const posts = await getAllPosts();
  
  // 筛选该分类下的文章
  const categoryPosts = posts.filter(post => 
    post.categories.includes(categoryName)
  );
  
  // 如果分类不存在，返回404
  if (categoryPosts.length === 0) {
    notFound();
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/categories" className="text-primary hover:underline">
            ← 返回所有分类
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-8">{categoryName} 分类</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryPosts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 