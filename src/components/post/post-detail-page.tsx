import Link from 'next/link';
import { Post } from '@/types/post';
import { MainLayout } from '@/components/layout/main-layout';
import { ArticlePreview } from '@/components/ArticlePreview';
import { getDisplayCategoryName } from '@/lib/github/client';

interface PostDetailPageProps {
  post: Post;
}

// 简化版本的PostDetailPage，避免使用未定义的组件
export function PostDetailPage({ post }: PostDetailPageProps) {
  // 检查内容是否有效
  if (!post.content || typeof post.content !== 'string') {
    console.error('文章内容无效:', { 
      contentType: typeof post.content,
      isNull: post.content === null,
      isUndefined: post.content === undefined
    });
  }
  
  // 确保内容是字符串
  const safeContent = (() => {
    if (post.content === undefined || post.content === null) {
      return '';
    }
    
    if (typeof post.content === 'string') {
      return post.content;
    }
    
    try {
      return String(post.content);
    } catch (err) {
      console.error('内容转换失败:', err);
      return '';
    }
  })();
  
  return (
    <>
      <MainLayout>
        <div className="container py-6 lg:py-10">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {post.title}
            </h1>
            
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.categories.map((category, index) => (
                  <Link
                    href={`/categories/${category}`}
                    key={index}
                    className="text-sm bg-secondary px-3 py-1 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {post.displayCategories?.[index] || getDisplayCategoryName(category)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 文章内容 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-10">
            <div className="col-span-1 lg:col-span-9">
              <ArticlePreview 
                content={safeContent} 
                className="prose prose-lg dark:prose-invert max-w-none"
                debug={process.env.NODE_ENV !== 'production'}
              />
              
              {/* 标签 */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-8 pt-4 border-t">
                  <h3 className="text-lg font-medium mb-3">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <Link 
                        href={`/tags/${tag}`} 
                        key={index}
                        className="text-sm bg-secondary px-3 py-1 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 侧边栏 */}
            <div className="col-span-1 lg:col-span-3 order-first lg:order-last">
              <div className="sticky top-20">
                <h3 className="text-lg font-medium mb-3">目录</h3>
                <div className="text-sm">
                  文章目录将在此显示
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
} 