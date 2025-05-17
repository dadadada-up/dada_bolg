/**
 * 文章API（修复版本）
 * 
 * 直接使用本地SQLite数据库访问文章数据
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const admin = searchParams.get('admin') === 'true'; // 管理员模式，包含未发布的文章
    
    // 计算偏移量
    const offset = (page - 1) * limit;
    
    // 连接数据库
    const dbPath = path.resolve(process.cwd(), 'data', 'blog.db');
    console.log(`[API修复版] 连接SQLite数据库: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // 构建查询条件
    let whereConditions = [];
    const params: any[] = [];
    
    // 是否包含未发布文章
    if (!admin) {
      whereConditions.push('p.is_published = 1');
    }
    
    // 分类筛选
    if (category) {
      whereConditions.push('c.slug = ?');
      params.push(category);
    }
    
    // 标签筛选
    if (tag) {
      whereConditions.push('t.slug = ?');
      params.push(tag);
    }
    
    // 搜索关键词
    if (search) {
      whereConditions.push('(p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // 构建WHERE子句
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // 查询文章
    const sqlQuery = `
      SELECT 
        p.id, p.title, p.slug, p.content, p.excerpt, p.description, 
        p.is_published, p.is_featured, 
        p.image_url as imageUrl, 
        strftime('%s', p.created_at) as created_at, 
        strftime('%s', p.updated_at) as updated_at,
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
    
    // 执行查询
    const posts = await db.all(sqlQuery, [...params, limit, offset]);
    const countResult = await db.get(countSql, params);
    const total = countResult?.total || 0;
    
    // 处理查询结果
    const formattedPosts = posts.map((post: any) => ({
      ...post,
      categories: post.categories_str ? post.categories_str.split(',') : [],
      tags: post.tags_str ? post.tags_str.split(',') : [],
      date: post.created_at ? new Date(parseInt(post.created_at) * 1000).toISOString() : undefined,
      updated: post.updated_at ? new Date(parseInt(post.updated_at) * 1000).toISOString() : undefined,
    }));
    
    // 移除categories_str和tags_str字段
    formattedPosts.forEach((post: any) => {
      delete post.categories_str;
      delete post.tags_str;
    });
    
    // 如果指定了状态筛选，在内存中进行筛选
    let filteredPosts = formattedPosts;
    if (status && status !== 'all') {
      filteredPosts = filteredPosts.filter(post => 
        (status === 'published' && post.is_published) || 
        (status === 'draft' && !post.is_published)
      );
    }
    
    // 关闭数据库连接
    await db.close();
    
    // 构建响应
    const response = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: filteredPosts,
      source: 'direct-sqlite-fixed'
    };
    
    return Response.json(response);
  } catch (error) {
    console.error('[API修复版] 获取文章失败:', error);
    
    return Response.json(
      { 
        error: '获取文章失败', 
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 