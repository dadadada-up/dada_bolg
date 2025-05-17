import { PostCard } from "@/components/post-card";
import { ClientWrapper } from "@/components/layout/client-wrapper";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { Post, Category } from "@/types/post";
import { postRepository, categoryRepository } from "@/lib/db/repositories";

// 每页显示的文章数量
const POSTS_PER_PAGE = 9;

// 备用分类数据
const fallbackCategories = [
  { name: "全部", slug: "all", postCount: 0 },
  { name: "产品管理", slug: "product-management", postCount: 5 },
  { name: "技术工具", slug: "tech-tools", postCount: 8 },
  { name: "家庭生活", slug: "family-life", postCount: 4 },
  { name: "保险", slug: "insurance", postCount: 3 },
  { name: "金融", slug: "finance", postCount: 3 },
  { name: "开源", slug: "open-source", postCount: 2 },
  { name: "个人博客", slug: "personal-blog", postCount: 1 }
];

// 备用标签数据
const fallbackTags = ["JavaScript", "React", "Next.js", "生活", "金融", "保险", "产品"];

export interface PostsPageProps {
  searchParams?: {
    page?: string;
  };
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  // 获取当前页码，默认为第1页
  const currentPage = Number(searchParams?.page) || 1;
  
  try {
    // 计算offset以替代page参数
    const offset = (currentPage - 1) * POSTS_PER_PAGE;
    
    // 直接使用postRepository获取文章数据
    const { posts, total: totalItems } = await postRepository.getAllPosts({
      offset: offset,
      limit: POSTS_PER_PAGE,
      published: true,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    
    // 计算总页数
    const totalPages = Math.ceil(totalItems / POSTS_PER_PAGE) || 1;
    
    // 直接使用categoryRepository获取分类数据
    let categories: Category[] = [];
    try {
      categories = await categoryRepository.getAllCategories();
      console.log('获取到的分类数据:', categories);
    } catch (error) {
      console.error('获取分类失败:', error);
    }
    
    // 如果没有获取到分类数据，使用备用数据
    if (!categories || categories.length === 0) {
      console.log('使用备用分类数据');
      categories = fallbackCategories;
    } else {
      // 过滤掉文章数为0的分类，只保留有文章的分类
      categories = categories.filter(cat => cat.postCount > 0 || cat.slug === 'all');
      
      // 添加"全部"分类
      if (!categories.some(cat => cat.slug === 'all')) {
        categories.unshift({
          name: "全部",
          slug: "all",
          postCount: totalItems,
          description: ''
        });
      } else {
        // 更新"全部"分类的文章数量
        const allCategory = categories.find(cat => cat.slug === 'all');
        if (allCategory) {
          allCategory.postCount = totalItems;
        }
      }
    }
    
    // 获取文章中的所有标签
    const allTags = new Set<string>();
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (tag) allTags.add(tag);
        });
      }
    });
    
    // 如果没有获取到标签，使用备用数据
    const tags = allTags.size > 0 ? Array.from(allTags) : fallbackTags;
    
    return (
      <ClientWrapper>
        <div className="container py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4">文章列表</h1>
            <p className="text-muted-foreground">
              共计 {totalItems} 篇文章，当前显示第 {currentPage} 页
            </p>
          </header>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 侧边栏 */}
            <aside className="w-full lg:w-64 shrink-0">
              <div className="sticky top-24 space-y-8">
                {/* 分类过滤器 */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-3">分类</h2>
                  <ul className="space-y-2">
                    {categories.map((category) => (
                      <li key={category.slug}>
                        <Link 
                          href={`/categories/${category.slug === 'all' ? '' : category.slug}`}
                          className="flex justify-between items-center py-1 hover:text-primary"
                        >
                          <span>{category.name}</span>
                          <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
                            {category.postCount}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* 标签云 */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-3">标签</h2>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Link 
                        key={tag} 
                        href={`/tags/${tag.toLowerCase()}`}
                        className="px-3 py-1 bg-muted rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
            
            {/* 文章列表 */}
            <div className="flex-1">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-muted-foreground">暂无文章</p>
                  </div>
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    basePath="/posts" 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </ClientWrapper>
    );
  } catch (error) {
    console.error('获取文章或分类数据失败:', error);
    return (
      <ClientWrapper>
        <div className="container py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4">文章列表</h1>
            <p className="text-muted-foreground">
              加载失败，请稍后再试
            </p>
          </header>
        </div>
      </ClientWrapper>
    );
  }
} 