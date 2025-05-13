import { Metadata } from "next";
import { formatDate, extractHeadings } from "@/lib/utils";
import { generateTableOfContents } from "@/lib/markdown";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Markdown } from "@/components/markdown";
import { TocWrapper } from "@/components/toc-wrapper";
import { BackToTop } from "@/components/back-to-top";
import { Post } from "@/types/post";
import { ShareButtons } from "@/components/share-buttons";
import { EnhancedMarkdownContent } from "@/components/ui/enhanced-markdown-content";
import { markdownToHtml } from "@/lib/markdown";
import { getDisplayCategoryName } from "@/lib/github-client";
import { ArticlePreview } from '@/components/ArticlePreview';

// 辅助函数：确保slug正确编码
function encodeSlug(slug: string): string {
  // 检查slug是否已经被编码
  try {
    // 如果解码后与原始值相同，说明未编码
    if (decodeURIComponent(slug) === slug) {
      return encodeURIComponent(slug);
    }
    return slug; // 已编码，直接返回
  } catch (e) {
    // 如果解码出错，可能包含特殊字符，进行编码
    return encodeURIComponent(slug);
  }
}

export async function generateStaticParams() {
  // 通过API获取所有文章的slug，用于静态生成页面
  try {
    // 使用相对路径而不是硬编码的localhost
    const apiUrl = `/api/posts-new?limit=1000`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('生成静态参数时获取文章失败');
      return [];
    }
    
    const data = await response.json();
    const posts = data.data || [];
    
    // 打印所有文章的slug和标题，帮助调试
    console.log('生成静态页面参数:', posts.map((post: Post) => ({ slug: post.slug, title: post.title })));
    
    return posts.map((post: Post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('生成静态参数时出错:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const encodedSlug = encodeSlug(slug);
  
  try {
    // 使用相对路径而不是硬编码的localhost
    const apiUrl = `/api/posts-new/${encodedSlug}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return {
        title: "文章不存在 - Dada Blog",
      };
    }
    
    const post: Post = await response.json();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const ogImage = post.coverImage || "/og-image.jpg";
    
    return {
      title: `${post.title} - Dada Blog`,
      description: post.excerpt,
      keywords: [...post.tags, ...post.categories],
      authors: { name: "Dada" },
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: "article",
        url: `${baseUrl}/posts/${slug}`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
        publishedTime: post.date,
        tags: [...post.tags, ...post.categories],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error('生成元数据时出错:', error);
    return {
      title: "加载中... - Dada Blog",
    };
  }
}

interface PostPageProps {
  params: {
    slug: string;
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = params;
  const encodedSlug = encodeSlug(slug);
  
  try {
    // 使用相对路径而不是硬编码的localhost
    const apiUrl = `/api/posts-new/${encodedSlug}`;
    
    // 添加错误处理
    let response;
    try {
      response = await fetch(apiUrl);
    } catch (fetchError: any) {
      console.error('获取文章内容时网络错误:', fetchError);
      throw new Error(`获取文章内容失败: ${fetchError.message}`);
    }
    
    if (!response.ok) {
      console.error(`API响应错误: ${response.status} ${response.statusText}`);
      notFound();
    }
    
    const post: Post = await response.json();
    
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
    
    // 提取文章标题中的标题标签用于目录
    const headings = extractHeadings(safeContent);

    // 将Markdown转换为HTML
    const contentHtml = await markdownToHtml(safeContent);
    
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
                
                {/* 分享按钮 */}
                <div className="mt-8 pt-4 border-t">
                  <h3 className="text-lg font-medium mb-3">分享文章</h3>
                  <ShareButtons 
                    title={post.title} 
                    description={post.description || post.excerpt || ''}
                  />
                </div>
                
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
              
              {/* 目录 */}
              <div className="col-span-1 lg:col-span-3 order-first lg:order-last">
                <div className="sticky top-20">
                  <TocWrapper headings={headings} />
                </div>
              </div>
            </div>
          </div>
          <BackToTop />
        </MainLayout>
      </>
    );
  } catch (error) {
    console.error('获取文章内容时出错:', error);
    notFound();
  }
}