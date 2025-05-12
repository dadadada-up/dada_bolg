import { Metadata } from "next";

export interface MetadataProps {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
  url?: string;
}

export function generateMetadata({
  title,
  description = "Dada的个人博客，分享技术文章和生活随笔",
  keywords = ["博客", "技术", "前端", "React", "Next.js"],
  image = "/og-image.jpg",
  type = "website",
  publishedTime,
  authors = ["Dada"],
  url,
}: MetadataProps): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dada-blog.vercel.app";
  const fullUrl = url ? url : siteUrl;
  const fullImageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;
  
  const basicMetadata: Metadata = {
    title,
    description,
    keywords,
    authors: { name: authors.join(", ") },
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type,
      url: fullUrl,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: "Dada Blog",
      locale: "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fullImageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
  
  // 如果是文章类型，添加额外的元数据
  if (type === "article" && publishedTime) {
    return {
      ...basicMetadata,
      openGraph: {
        ...basicMetadata.openGraph,
        type: "article",
        publishedTime,
        authors,
      },
    };
  }
  
  return basicMetadata;
} 