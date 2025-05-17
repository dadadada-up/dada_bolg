'use client';

import React from 'react';

interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// 生成文章的结构化数据
export function generatePostJsonLd({
  title,
  description,
  datePublished,
  dateModified,
  authorName = 'Dada',
  authorUrl,
  imageUrl,
  url,
}: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
  imageUrl?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorUrl,
    },
    image: imageUrl,
    datePublished,
    dateModified: dateModified || datePublished,
    publisher: {
      '@type': 'Organization',
      name: 'Dada Blog',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app'}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

// 生成网站的结构化数据
export function generateWebsiteJsonLd({
  name = 'Dada Blog',
  description = 'Dada的个人博客，分享技术文章和生活随笔',
  url = process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app',
}: {
  name?: string;
  description?: string;
  url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    description,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// 生成面包屑导航的结构化数据
export function generateBreadcrumbJsonLd({
  items,
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app',
}: {
  items: Array<{ name: string; url: string }>;
  baseUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
} 