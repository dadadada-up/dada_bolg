/**
 * 文章API（修复版本）
 * 
 * 使用 Turso 数据库访问文章数据
 */

import { query, queryOne } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const category = searchParams.get("category") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const admin = searchParams.get("admin") === "true";
    
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
    
    const sqlQuery = `
      SELECT 
        p.id, p.title, p.slug, p.content, p.excerpt, p.description, 
        p.is_published, p.is_featured, 
        p.image_url as imageUrl, 
        p.created_at, p.updated_at,
        GROUP_CONCAT(DISTINCT c.name) as categories_str,
        GROUP_CONCAT(DISTINCT t.name) as tags_str
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
    
    const formattedPosts = posts.map((post: any) => ({
      ...post,
      categories: post.categories_str ? post.categories_str.split(",") : [],
      tags: post.tags_str ? post.tags_str.split(",") : [],
      date: post.created_at ? new Date(post.created_at).toISOString() : undefined,
      updated: post.updated_at ? new Date(post.updated_at).toISOString() : undefined,
    }));
    
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
