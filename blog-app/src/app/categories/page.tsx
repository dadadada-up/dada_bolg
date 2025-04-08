import { Metadata } from "next";
import { getAllPosts } from "@/lib/github";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { MainLayout } from "@/components/layout/main-layout";

export const metadata: Metadata = {
  title: "分类 - Dada Blog",
  description: "浏览Dada博客的所有文章分类",
  keywords: ["博客", "分类", "技术", "前端", "生活"],
  openGraph: {
    title: "分类 - Dada Blog",
    description: "浏览Dada博客的所有文章分类",
    type: "website",
    url: "https://dada-blog.vercel.app/categories",
  },
};

export default async function CategoriesPage() {
  const posts = await getAllPosts();
  
  // 创建分类映射并计算每个分类的文章数量
  const categoriesMap = posts.reduce((acc, post) => {
    post.categories.forEach(category => {
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category]++;
    });
    return acc;
  }, {} as Record<string, number>);
  
  // 将分类转换为数组并按文章数量排序
  const categories = Object.entries(categoriesMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold mb-4">文章分类</h1>
          <p className="text-muted-foreground">
            共计 {categories.length} 个分类
          </p>
        </header>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link 
              key={category.name}
              href={`/categories/${encodeURIComponent(category.name)}`}
              className="block p-6 border rounded-lg hover:bg-secondary transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2">{category.name}</h2>
              <p className="text-muted-foreground">
                {category.count} 篇文章
              </p>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 