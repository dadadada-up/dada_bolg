import { Metadata } from "next";
import { getPosts } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import { markdownToHtml, generateTableOfContents } from "@/lib/markdown";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TableOfContents } from "@/components/table-of-contents";
import { ClientWrapper } from "@/components/layout/client-wrapper";
import { ShareButtons } from "@/components/share-buttons";
import { Comments } from "@/components/comments";
import { getPostBySlug, getAllPosts } from "@/lib/github";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { ReadingProgress } from "@/components/reading-progress";
import Image from 'next/image';

export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  // 打印所有文章的slug和标题，帮助调试
  console.log('生成静态页面参数:', posts.map(post => ({ slug: post.slug, title: post.title })));
  
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: "文章不存在 - Dada Blog",
    };
  }
  
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
      url: `https://dada-blog.vercel.app/posts/${post.slug}`,
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
}

interface PostPageProps {
  params: {
    slug: string;
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const posts = await getPosts();
  const post = posts.find((post) => post.slug === params.slug);
  
  if (!post) {
    console.error(`找不到文章: ${params.slug}`);
    notFound();
  }
  
  const content = await markdownToHtml(post.content);
  
  // 提取标题生成目录
  const tableOfContents = generateTableOfContents(post.content);
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // 计算阅读时间
  const readingTime = post.metadata?.readingTime || Math.ceil(post.content.split(/\s+/).length / 200);
  
  // 获取上一篇和下一篇文章
  const postIndex = posts.findIndex((p) => p.slug === params.slug);
  const prevPost = postIndex < posts.length - 1 ? posts[postIndex + 1] : null;
  const nextPost = postIndex > 0 ? posts[postIndex - 1] : null;
  
  // 检测标题长度，适当调整字体大小和换行
  const isTitleLong = post.title.length > 30;
  const isTitleVeryLong = post.title.length > 50;
  const titleClasses = isTitleVeryLong 
    ? 'text-xl md:text-2xl leading-tight' 
    : (isTitleLong 
      ? 'text-2xl md:text-3xl leading-tight' 
      : 'text-3xl md:text-4xl leading-snug');
  
  return (
    <ClientWrapper>
      <ReadingProgress />
      
      <div className="max-w-4xl mx-auto">
        <article className="prose dark:prose-invert lg:prose-lg mx-auto">
          <header className="mb-8 not-prose">
            <h1 className={`${titleClasses} font-bold mb-4 break-words text-balance`}>
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground mb-6">
              <time dateTime={post.date}>📅 发布于: {formatDate(post.date)}</time>
              {post.date !== post.updated && (
                <>
                  <span>•</span>
                  <time dateTime={post.updated}>🔄 更新于: {formatDate(post.updated)}</time>
                </>
              )}
              <span>•</span>
              <span>⏱️ 阅读时间: {readingTime} 分钟</span>
              <span>•</span>
              <span>{post.metadata.wordCount} 字</span>
            </div>
            
            {post.coverImage && (
              <div className="relative w-full h-[300px] md:h-[400px] mb-8 rounded-lg overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-transform hover:scale-105 duration-300"
                />
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-8">
              {post.categories.map((category, index) => {
                // 确保category是字符串
                const categoryStr = typeof category === 'string' 
                  ? category 
                  : String(category);
                
                return (
                  <Link
                    key={`${categoryStr}-${index}`}
                    href={`/categories/${encodeURIComponent(categoryStr)}`}
                    className="text-sm bg-secondary px-3 py-1 rounded-full hover:bg-primary hover:text-primary-foreground"
                  >
                    {categoryStr}
                  </Link>
                );
              })}
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => {
                  // 确保tag是字符串
                  const tagStr = typeof tag === 'string'
                    ? tag
                    : String(tag);
                    
                  return (
                    <Link
                      key={`${tagStr}-${index}`}
                      href={`/tags/${encodeURIComponent(tagStr)}`}
                      className="text-xs bg-secondary px-2 py-1 rounded-md hover:bg-primary hover:text-primary-foreground"
                    >
                      #{tagStr}
                    </Link>
                  );
                })}
              </div>
            </div>
          </header>
          
          <div className="lg:flex gap-8">
            {tableOfContents.length > 0 && (
              <aside className="hidden lg:block sticky top-20 h-fit w-64 shrink-0">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">目录</h3>
                  <TableOfContents headings={tableOfContents} />
                </div>
              </aside>
            )}
            
            <div className="w-full prose lg:prose-lg prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-code:text-sm prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-md max-w-none">
              <MarkdownContent html={content} />
              
              <div className="mt-10 pt-6 border-t not-prose">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">分享文章</h3>
                    <ShareButtons 
                      title={post.title} 
                      description={post.excerpt || ""} 
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => {
                      // 确保tag是字符串
                      const tagStr = typeof tag === 'string'
                        ? tag
                        : String(tag);
                        
                      return (
                        <Link
                          key={`${tagStr}-${index}`}
                          href={`/tags/${encodeURIComponent(tagStr)}`}
                          className="text-xs bg-secondary px-2 py-1 rounded-md hover:bg-primary hover:text-primary-foreground"
                        >
                          #{tagStr}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
        
        <div className="mt-16 flex flex-col sm:flex-row justify-between gap-4 not-prose">
          {prevPost && (
            <Link
              href={`/posts/${prevPost.slug}`}
              className="p-4 border rounded-lg flex-1 hover:bg-secondary transition-colors"
            >
              <span className="text-sm text-muted-foreground">上一篇</span>
              <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{prevPost.title}</h3>
            </Link>
          )}
          
          {nextPost && (
            <Link
              href={`/posts/${nextPost.slug}`}
              className="p-4 border rounded-lg flex-1 hover:bg-secondary transition-colors text-right"
            >
              <span className="text-sm text-muted-foreground">下一篇</span>
              <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{nextPost.title}</h3>
            </Link>
          )}
        </div>
        
        <Comments className="mt-12" />
      </div>
    </ClientWrapper>
  );
} 