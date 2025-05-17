import { Metadata } from "next";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { getCategoryParams, getCategoryBySlug, getPostsByCategory } from "@/lib/utils/static-generation";
import { isVercelBuild } from "@/lib/utils/env";

// 使用安全的静态参数生成
export async function generateStaticParams() {
  if (isVercelBuild) {
    console.log('[分类页] Vercel构建时返回空的静态参数');
    return [];
  }
  
  try {
    // 使用优化的函数获取分类参数
    const params = await getCategoryParams();
    console.log(`[分类页] 生成静态参数: ${params.length}个分类`);
    return params;
  } catch (error) {
    console.error('[分类页] 生成静态参数失败:', error);
    return [];
  }
}

// 动态元数据生成
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const categorySlug = params.slug;
  
  // 如果是Vercel构建环境，返回固定元数据
  if (isVercelBuild) {
    return {
      title: `分类 - Dada Blog`,
      description: "查看分类下的所有文章",
    };
  }
  
  try {
    // 获取分类信息
    const category = await getCategoryBySlug(categorySlug);
    const displayName = category?.name || categorySlug;
    
    return {
      title: `${displayName} - 分类文章 - Dada Blog`,
      description: `查看${displayName}分类下的所有文章`,
    };
  } catch (error) {
    console.error(`[分类页] 生成元数据失败 (${categorySlug}):`, error);
    return {
      title: `${categorySlug} - 分类文章 - Dada Blog`,
      description: "查看分类下的所有文章",
    };
  }
}

// 分类页面组件
export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categorySlug = params.slug;
  
  // 从数据库直接获取分类信息和文章列表
  const category = await getCategoryBySlug(categorySlug);
  const posts = await getPostsByCategory(categorySlug);
  
  // 提取展示名称
  const displayName = category?.name || categorySlug;
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/categories" className="text-primary hover:underline">
            ← 返回所有分类
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{displayName} 分类</h1>
        
        <p className="mb-8 text-muted-foreground">
          {isVercelBuild ? 
            "此内容将在页面加载后显示" : 
            `共 ${posts.length} 篇文章`}
        </p>
        
        {/* 文章列表将在客户端加载 */}
        {!isVercelBuild && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="p-6 border rounded-lg">
                <Link 
                  href={`/posts/${post.slug}`}
                  className="text-xl font-semibold hover:text-primary transition-colors"
                >
                  {post.title}
                </Link>
                <p className="mt-2 text-muted-foreground">{post.excerpt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 