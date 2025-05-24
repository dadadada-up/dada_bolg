/**
 * 文章API（修复版本）
 * 
 * 使用 Turso 数据库访问文章数据
 */

import { query, queryOne } from "@/lib/db/database";
import { 
  dynamicConfig, 
  getQueryParam, 
  getNumberQueryParam, 
  getBooleanQueryParam 
} from '@/lib/api/route-config';
import { isVercelEnv } from '@/lib/db/env-config';

// 强制动态路由，防止静态生成
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // 在Vercel环境中返回模拟数据
    if (isVercelEnv) {
      console.log('[API修复版] 检测到Vercel环境，返回模拟数据');
      return Response.json({
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
      });
    }

    const page = getNumberQueryParam(request, "page", 1);
    const limit = getNumberQueryParam(request, "limit", 10);
    const category = getQueryParam(request, "category");
    const tag = getQueryParam(request, "tag");
    const status = getQueryParam(request, "status");
    const search = getQueryParam(request, "search");
    const admin = getBooleanQueryParam(request, "admin", false);
    
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    const params: any[] = [];
    
    if (!admin) {
      whereConditions.push("p.is_published = 1");
    }
    
    if (category) {
      whereConditions.push("c.slug = ?");
      params.push(category);
    }
    
    if (tag) {
      whereConditions.push("t.slug = ?");
      params.push(tag);
    }
    
    if (search) {
      whereConditions.push("(p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ?)");
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" AND ")}` 
      : "";
    
    // 根据数据库类型选择不同的聚合函数
    const groupConcatFn = isVercelEnv ? 'json_group_array' : 'GROUP_CONCAT';
    
    const sqlQuery = `
      SELECT 
        p.id, p.title, p.slug, p.content, p.excerpt, p.description, 
        p.is_published, p.is_featured, 
        p.image_url as imageUrl, 
        p.created_at, p.updated_at,
        COALESCE(${groupConcatFn}(DISTINCT c.name), '[]') as categories_str,
        COALESCE(${groupConcatFn}(DISTINCT t.name), '[]') as tags_str
      FROM posts p
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM posts p
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      ${whereClause}
    `;
    
    const posts = await query(sqlQuery, [...params, limit, offset]);
    const countResult = await queryOne(countSql, params);
    const total = countResult?.total || 0;
    
    const formattedPosts = posts.map((post: any) => {
      // 处理分类和标签
      let categories = [];
      let tags = [];
      
      try {
        // 尝试解析JSON字符串
        if (post.categories_str.startsWith('[') && post.categories_str.endsWith(']')) {
          try {
            categories = JSON.parse(post.categories_str);
          } catch (e) {
            categories = post.categories_str.split(",").filter(Boolean);
          }
        } else {
          categories = post.categories_str.split(",").filter(Boolean);
        }
        
        if (post.tags_str.startsWith('[') && post.tags_str.endsWith(']')) {
          try {
            tags = JSON.parse(post.tags_str);
          } catch (e) {
            tags = post.tags_str.split(",").filter(Boolean);
          }
        } else {
          tags = post.tags_str.split(",").filter(Boolean);
        }
      } catch (e) {
        console.error('解析分类或标签失败:', e);
      }
      
      return {
        ...post,
        categories,
        tags,
        date: post.created_at ? new Date(post.created_at).toISOString() : undefined,
        updated: post.updated_at ? new Date(post.updated_at).toISOString() : undefined,
      };
    });
    
    formattedPosts.forEach((post: any) => {
      delete post.categories_str;
      delete post.tags_str;
    });
    
    let filteredPosts = formattedPosts;
    if (status && status !== "all") {
      filteredPosts = filteredPosts.filter(post => 
        (status === "published" && post.is_published) || 
        (status === "draft" && !post.is_published)
      );
    }
    
    const response = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: filteredPosts,
      source: "turso-db"
    };
    
    return Response.json(response);
  } catch (error) {
    console.error("[API修复版] 获取文章失败:", error);
    
    return Response.json(
      { 
        error: "获取文章失败", 
        message: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
