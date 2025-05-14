import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { MainLayout } from "@/components/layout/main-layout";
import { Post } from "@/types/post";
import { categoryRepository, postRepository } from "@/lib/db/repositories";

// 直接使用仓库获取分类数据，而不是通过API
export async function generateStaticParams() {
  try {
    // 直接通过数据库仓库获取所有分类
    const categories = await categoryRepository.getAllCategories();
    
    return categories.map((category) => ({
      slug: category.slug,
    }));
  } catch (error) {
    console.error('生成静态参数时获取分类失败:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  
  try {
    // 直接从数据库获取分类信息
    const category = await categoryRepository.getCategoryBySlug(slug);
    
    if (!category) {
      return {
        title: `${slug} 分类的文章 - Dada Blog`,
        description: `查看所有 ${slug} 分类下的文章。`,
      };
    }
    
    return {
      title: `${category.name} 分类的文章 - Dada Blog`,
      description: `查看所有 ${category.name} 分类下的文章。`,
    };
  } catch (error) {
    console.error('获取分类元数据失败:', error);
    return {
      title: `${slug} 分类的文章 - Dada Blog`,
      description: `查看所有 ${slug} 分类下的文章。`,
    };
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categorySlug = params.slug;
  
  // 获取分类信息
  let categoryName = categorySlug;
  try {
    // 直接从数据库获取分类信息
    const category = await categoryRepository.getCategoryBySlug(categorySlug);
    if (category) {
      categoryName = category.name;
    }
  } catch (error) {
    console.error('获取分类信息失败:', error);
  }
  
  // 直接从数据库获取该分类下的文章
  try {
    const { posts, total } = await postRepository.getAllPosts({
      category: categorySlug,
      limit: 1000,
      published: true,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    
    // 如果分类不存在或没有文章，返回404
    if (posts.length === 0) {
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
    console.error('获取分类文章失败:', error);
    notFound();
  }
} 