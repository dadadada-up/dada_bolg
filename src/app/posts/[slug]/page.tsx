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
import { getDisplayCategoryName } from "@/lib/github/client";
import { ArticlePreview } from '@/components/ArticlePreview';
import { encodeSlug, encodeSlugForUrl } from "@/lib/utils/slug";
import { PostDetailPage } from "@/components/post/post-detail-page";
import { isVercelBuild, safeFetch, getBaseUrl } from "@/lib/utils/env";

export async function generateStaticParams() {
  // 在Vercel构建环境下返回空数组，避免构建时错误
  if (isVercelBuild) {
    console.log('[文章页] Vercel构建时返回空的静态参数');
    return [];
  }

  // 通过API获取所有文章的slug，用于静态生成页面
  try {
    // 使用绝对URL路径
    const baseUrl = getBaseUrl();
    const apiUrl = `${baseUrl}/api/posts-new?limit=1000`;
    
    console.log(`[文章页] 尝试获取文章列表: ${apiUrl}`);
    const response = await safeFetch(apiUrl);
    
    if (!response.ok) {
      console.error('生成静态参数时获取文章失败');
      return [];
    }
    
    const data = await response.json();
    const posts = data.data || [];
    
    // 打印所有文章的slug和标题，帮助调试
    console.log(`[文章页] 获取到 ${posts.length} 篇文章`);
    
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
    // 使用绝对URL路径
    const baseUrl = getBaseUrl();
    const apiUrl = `${baseUrl}/api/posts-new/${encodedSlug}`;
    
    console.log(`[文章页] 获取文章元数据: ${apiUrl}`);
    const response = await safeFetch(apiUrl);
    
    if (!response.ok) {
      return {
        title: "文章不存在 - Dada Blog",
      };
    }
    
    const post: Post = await response.json();
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

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const encodedSlug = encodeSlugForUrl(slug);
  
  try {
    // 使用绝对URL路径
    const baseUrl = getBaseUrl();
    const apiUrl = `${baseUrl}/api/posts-new/${encodedSlug}`;
    
    const response = await safeFetch(apiUrl);
    
    if (!response.ok) {
      return notFound();
    }
    
    const post = await response.json();
    
    return <PostDetailPage post={post} />;
  } catch (error) {
    console.error('获取文章详情失败:', error);
    return notFound();
  }
}