/**
 * Vercel环境修复工具
 * 
 * 用于解决Vercel部署中的常见问题
 */

import { isVercelEnv } from './db/env-config';

/**
 * 检查是否在Vercel环境中
 */
export function isVercel(): boolean {
  return isVercelEnv || process.env.VERCEL === '1' || process.env.IS_VERCEL === 'true';
}

/**
 * 检查是否在Vercel构建阶段
 */
export function isVercelBuild(): boolean {
  return isVercel() && process.env.NODE_ENV === 'production';
}

/**
 * 获取适合当前环境的数据库类型
 */
export function getDbType(): 'sqlite' | 'turso' {
  return isVercel() ? 'turso' : 'sqlite';
}

/**
 * 检查文件系统路径是否可用
 * 在Vercel环境中，某些文件系统路径可能不可用
 */
export function isPathAvailable(path: string): boolean {
  if (isVercel()) {
    // 在Vercel环境中，只有特定路径可用
    const availablePaths = ['/tmp', '/var/task', '/var/vercel'];
    return availablePaths.some(prefix => path.startsWith(prefix));
  }
  return true;
}

/**
 * 获取适合当前环境的聚合函数
 */
export function getGroupConcatFn(): string {
  return isVercel() ? 'json_group_array' : 'GROUP_CONCAT';
}

/**
 * 获取Vercel环境的模拟数据
 */
export function getMockData(type: 'posts' | 'categories' | 'tags' | 'search' | 'stats') {
  switch (type) {
    case 'posts':
      return {
        total: 57,
        page: 1,
        limit: 10,
        totalPages: 6,
        data: [
          {
            id: 1,
            title: "Next.js 14 新特性解析",
            slug: "nextjs-14-features",
            excerpt: "Next.js 14 带来了许多激动人心的新特性，本文将详细解析这些特性及其应用场景。",
            is_published: true,
            is_featured: true,
            imageUrl: "https://example.com/images/nextjs14.jpg",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            categories: ["技术", "前端"],
            tags: ["Next.js", "React", "Web开发"]
          },
          {
            id: 2,
            title: "使用Turso数据库构建高性能应用",
            slug: "turso-database-high-performance",
            excerpt: "Turso是一个基于SQLite的分布式数据库，本文介绍如何用它构建高性能Web应用。",
            is_published: true,
            is_featured: false,
            imageUrl: "https://example.com/images/turso.jpg",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            categories: ["技术", "数据库"],
            tags: ["Turso", "SQLite", "数据库"]
          }
        ],
        source: "vercel-mock-data"
      };
    case 'categories':
      return [
        { id: 1, name: "技术", slug: "tech", count: 25 },
        { id: 2, name: "前端", slug: "frontend", count: 15 },
        { id: 3, name: "后端", slug: "backend", count: 10 },
        { id: 4, name: "数据库", slug: "database", count: 7 },
        { id: 5, name: "生活", slug: "life", count: 12 },
        { id: 6, name: "思考", slug: "thoughts", count: 8 },
        { id: 7, name: "阅读", slug: "reading", count: 5 },
        { id: 8, name: "旅行", slug: "travel", count: 3 }
      ];
    case 'tags':
      return [
        { id: 1, name: "Next.js", slug: "nextjs", count: 10 },
        { id: 2, name: "React", slug: "react", count: 15 },
        { id: 3, name: "JavaScript", slug: "javascript", count: 20 },
        { id: 4, name: "TypeScript", slug: "typescript", count: 12 },
        { id: 5, name: "Node.js", slug: "nodejs", count: 8 },
        { id: 6, name: "SQLite", slug: "sqlite", count: 5 },
        { id: 7, name: "Turso", slug: "turso", count: 3 },
        { id: 8, name: "Vercel", slug: "vercel", count: 7 }
      ];
    case 'search':
      return {
        posts: [
          {
            id: 1,
            title: "Next.js 14 新特性解析",
            slug: "nextjs-14-features",
            excerpt: "Next.js 14 带来了许多激动人心的新特性，本文将详细解析这些特性及其应用场景。",
            is_published: true,
            is_featured: true,
            imageUrl: "https://example.com/images/nextjs14.jpg",
            date: new Date().toISOString(),
            categories: ["技术", "前端"],
            tags: ["Next.js", "React", "Web开发"]
          }
        ],
        query: "nextjs",
        total: 1,
        page: 1,
        totalPages: 1,
        source: "vercel-mock"
      };
    case 'stats':
      return {
        success: true,
        data: {
          status: 'connected',
          database: {
            path: 'Turso云数据库',
            tables: ['posts', 'categories', 'tags', 'post_categories', 'post_tags']
          },
          counts: {
            posts: { total: 57, published: 50 },
            categories: 8,
            tags: 20
          },
          version: 'new',
          environment: 'vercel'
        }
      };
    default:
      return { error: '未知的数据类型' };
  }
} 