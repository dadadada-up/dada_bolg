/**
 * 备用数据模块
 * 当数据库连接失败时提供静态数据
 */
import { Post, Category, Tag } from '@/types/post';

// 备用文章数据
export const fallbackPosts: Post[] = [
  {
    slug: 'welcome-to-dada-blog',
    title: '欢迎来到Dada博客',
    description: '这是一个基于Next.js和Turso数据库构建的现代博客系统',
    content: `# 欢迎来到Dada博客

这是一个使用Next.js和Turso数据库构建的博客系统。

## 主要特性

1. **现代技术栈**: Next.js、React、TailwindCSS
2. **高性能**: 基于Turso分布式SQLite构建
3. **SEO友好**: 静态生成与服务器端渲染
4. **响应式设计**: 在任何设备上都有良好的浏览体验

## 代码示例

\`\`\`js
// 一个简单的React组件
function HelloWorld() {
  return <h1>Hello, World!</h1>;
}
\`\`\``,
    date: '2023-12-01',
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2023-12-01T00:00:00Z',
    is_published: true,
    is_featured: true,
    categories: ['技术', '前端'],
    tags: ['Next.js', 'React', 'Turso'],
    imageUrl: '/images/blog-default.jpg'
  },
  {
    slug: 'getting-started',
    title: '开始使用Dada博客',
    description: '如何安装和配置Dada博客系统，快速搭建你自己的博客',
    content: `# 开始使用Dada博客

按照以下步骤设置您自己的博客实例。

## 安装

1. 克隆仓库
2. 安装依赖
3. 配置数据库
4. 启动服务器

## 配置

修改 \`.env.local\` 文件以设置您的个人配置。

## 部署

使用Vercel一键部署您的博客系统。`,
    date: '2023-12-05',
    created_at: '2023-12-05T00:00:00Z',
    updated_at: '2023-12-05T00:00:00Z',
    is_published: true,
    is_featured: true,
    categories: ['教程', '技术'],
    tags: ['部署', '配置', '入门'],
    imageUrl: '/images/get-started.jpg'
  },
  {
    slug: 'database-migration',
    title: 'Turso数据库迁移指南',
    description: '如何从SQLite迁移到Turso分布式数据库',
    content: `# Turso数据库迁移指南

本指南介绍如何将现有的SQLite数据库迁移到Turso分布式SQLite。

## 迁移步骤

1. 安装Turso CLI
2. 创建新的Turso数据库
3. 运行迁移脚本
4. 验证数据

## 注意事项

迁移前请备份您的数据。`,
    date: '2023-12-10',
    created_at: '2023-12-10T00:00:00Z',
    updated_at: '2023-12-10T00:00:00Z',
    is_published: true,
    is_featured: false,
    categories: ['数据库', '技术'],
    tags: ['Turso', 'SQLite', '迁移'],
    imageUrl: '/images/database.jpg'
  },
  {
    slug: 'vercel-deployment',
    title: 'Vercel部署最佳实践',
    description: '将博客部署到Vercel平台的最佳实践和技巧',
    content: `# Vercel部署最佳实践

本文介绍如何优化Vercel部署流程。

## 环境变量配置

确保正确设置以下环境变量：
- \`NEXT_PUBLIC_SITE_URL\`
- \`TURSO_DATABASE_URL\`
- \`TURSO_AUTH_TOKEN\`

## 性能优化

1. 使用ISR模式进行增量静态生成
2. 启用图像优化
3. 配置缓存控制

## 自定义域名

设置自定义域名和HTTPS证书。`,
    date: '2023-12-15',
    created_at: '2023-12-15T00:00:00Z',
    updated_at: '2023-12-15T00:00:00Z',
    is_published: true,
    is_featured: false,
    categories: ['部署', '技术'],
    tags: ['Vercel', '部署', '优化'],
    imageUrl: '/images/vercel.jpg'
  },
  {
    slug: 'responsive-design',
    title: '响应式设计原则',
    description: '现代网站响应式设计的核心原则和最佳实践',
    content: `# 响应式设计原则

本文探讨现代网站响应式设计的核心原则。

## 流体布局

使用相对单位而非固定像素。

## 媒体查询

根据设备特性调整样式。

## 移动优先

从移动设备开始设计，然后扩展到更大屏幕。`,
    date: '2023-12-20',
    created_at: '2023-12-20T00:00:00Z',
    updated_at: '2023-12-20T00:00:00Z',
    is_published: true,
    is_featured: false,
    categories: ['设计', '前端'],
    tags: ['响应式', 'CSS', '设计'],
    imageUrl: '/images/responsive.jpg'
  },
  {
    slug: 'seo-optimization',
    title: 'SEO优化技巧',
    description: '提高博客在搜索引擎中的可见度的实用技巧',
    content: `# SEO优化技巧

本文分享提高博客搜索引擎可见度的实用技巧。

## 元数据优化

正确设置标题、描述和关键词。

## 结构化数据

使用JSON-LD添加结构化数据。

## 内容策略

创建高质量、相关的内容。`,
    date: '2023-12-25',
    created_at: '2023-12-25T00:00:00Z',
    updated_at: '2023-12-25T00:00:00Z',
    is_published: true,
    is_featured: false,
    categories: ['营销', '内容'],
    tags: ['SEO', '优化', '搜索引擎'],
    imageUrl: '/images/seo.jpg'
  }
];

// 备用分类数据
export const fallbackCategories: Category[] = [
  { name: '技术', slug: 'technology', postCount: 3 },
  { name: '前端', slug: 'frontend', postCount: 2 },
  { name: '教程', slug: 'tutorials', postCount: 1 },
  { name: '数据库', slug: 'database', postCount: 1 },
  { name: '设计', slug: 'design', postCount: 1 },
  { name: '部署', slug: 'deployment', postCount: 1 },
  { name: '营销', slug: 'marketing', postCount: 1 }
];

// 备用标签数据
export const fallbackTags: Tag[] = [
  { name: 'Next.js', slug: 'nextjs', postCount: 1 },
  { name: 'React', slug: 'react', postCount: 1 },
  { name: 'Turso', slug: 'turso', postCount: 2 },
  { name: 'SQLite', slug: 'sqlite', postCount: 1 },
  { name: '部署', slug: 'deployment', postCount: 2 },
  { name: 'Vercel', slug: 'vercel', postCount: 1 },
  { name: '响应式', slug: 'responsive', postCount: 1 },
  { name: 'SEO', slug: 'seo', postCount: 1 }
];

// 根据slug获取备用文章
export function getFallbackPostBySlug(slug: string): Post | undefined {
  return fallbackPosts.find(post => post.slug === slug);
}

// 获取所有备用文章
export function getAllFallbackPosts(limit?: number): Post[] {
  const posts = [...fallbackPosts].sort((a, b) => {
    return new Date(b.date || '').getTime() - new Date(a.date || '').getTime();
  });
  
  return limit ? posts.slice(0, limit) : posts;
} 