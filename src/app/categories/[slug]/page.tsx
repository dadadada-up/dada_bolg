import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { MainLayout } from "@/components/layout/main-layout";
import { getCategoryParams, getCategoryBySlug, getPostsByCategory } from "@/lib/static-generation";
import { isVercelBuild } from "@/lib/env";

// 使用静态生成工具函数获取分类参数
export async function generateStaticParams() {
  console.log('[分类页面] 开始生成静态参数');
  
  try {
    const params = await getCategoryParams();
    console.log(`[分类页面] 生成了 ${params.length} 个分类参数`);
    return params;
  } catch (error) {
    console.error('[分类页面] 生成静态参数时出错:', error);
    // 在出错时返回空数组，确保构建不会失败
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  
  console.log(`[分类页面] 为 ${slug} 生成元数据`);
  
  // 获取分类信息
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    console.log(`[分类页面] 未找到分类 ${slug} 的信息，使用默认元数据`);
    return {
      title: `${slug} 分类的文章 - Dada Blog`,
      description: `查看所有 ${slug} 分类下的文章。`,
    };
  }
  
  return {
    title: `${category.name} 分类的文章 - Dada Blog`,
    description: `查看所有 ${category.name} 分类下的文章。`,
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categorySlug = params.slug;
  
  console.log(`[分类页面] 渲染分类页面: ${categorySlug}`);
  
  // 在Vercel构建时，提供一个最小的内容，以避免额外的API调用
  if (isVercelBuild) {
    console.log(`[分类页面] Vercel构建环境，返回简化内容: ${categorySlug}`);
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{categorySlug} 分类</h1>
          <p className="mb-8 text-muted-foreground">
            加载中...
          </p>
        </div>
      </MainLayout>
    );
  }
  
  try {
    // 获取分类信息
    const category = await getCategoryBySlug(categorySlug);
    const categoryName = category?.name || categorySlug;
    
    // 获取分类下的文章
    const posts = await getPostsByCategory(categorySlug);
    
    // 如果分类不存在或没有文章，返回404
    if (posts.length === 0) {
      console.log(`[分类页面] 未找到分类 ${categorySlug} 下的文章，返回404`);
      notFound();
    }
    
    console.log(`[分类页面] 成功渲染分类 ${categorySlug} 页面，找到 ${posts.length} 篇文章`);
    
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/categories" className="text-primary hover:underline">
              ← 返回所有分类
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">{categoryName} 分类</h1>
          
          <p className="mb-8 text-muted-foreground">
            共找到 {posts.length} 篇文章
          </p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  } catch (error) {
    console.error(`[分类页面] 渲染分类 ${categorySlug} 页面时出错:`, error);
    
    // 发生错误时显示错误页面而不是崩溃
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/categories" className="text-primary hover:underline">
              ← 返回所有分类
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">{categorySlug} 分类</h1>
          
          <p className="mb-8 text-muted-foreground">
            加载分类内容时出错，请稍后再试。
          </p>
        </div>
      </MainLayout>
    );
  }
} 