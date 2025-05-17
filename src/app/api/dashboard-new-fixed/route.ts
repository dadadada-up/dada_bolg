/**
 * 仪表盘API（修复版本）
 * 
 * 直接使用本地SQLite数据库获取统计数据
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

export async function GET() {
  try {
    // 连接数据库
    const dbPath = path.resolve(process.cwd(), 'data', 'blog.db');
    console.log(`[API修复版] 连接SQLite数据库: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // 查询统计数据
    const postCountSql = `SELECT COUNT(*) as count FROM posts`;
    const publishedPostCountSql = `SELECT COUNT(*) as count FROM posts WHERE is_published = 1`;
    const draftPostCountSql = `SELECT COUNT(*) as count FROM posts WHERE is_published = 0`;
    const categoryCountSql = `SELECT COUNT(*) as count FROM categories`;
    const tagCountSql = `SELECT COUNT(*) as count FROM tags`;
    
    // 查询最近的文章
    const recentPostsSql = `
      SELECT 
        id, title, slug, excerpt, is_published, 
        strftime('%s', created_at) as created_at, 
        strftime('%s', updated_at) as updated_at
      FROM posts 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    // 查询文章趋势（按月统计）
    const trendsSql = `
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM posts
      WHERE created_at > datetime('now', '-1 year')
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;
    
    // 执行所有查询
    const [
      postCount,
      publishedPostCount,
      draftPostCount,
      categoryCount,
      tagCount,
      recentPosts,
      trends
    ] = await Promise.all([
      db.get(postCountSql),
      db.get(publishedPostCountSql),
      db.get(draftPostCountSql),
      db.get(categoryCountSql),
      db.get(tagCountSql),
      db.all(recentPostsSql),
      db.all(trendsSql)
    ]);
    
    // 格式化最近文章数据
    const formattedRecentPosts = recentPosts.map((post: any) => ({
      ...post,
      date: post.created_at ? new Date(parseInt(post.created_at) * 1000).toISOString() : undefined,
      updated: post.updated_at ? new Date(parseInt(post.updated_at) * 1000).toISOString() : undefined,
    }));
    
    // 关闭数据库连接
    await db.close();
    
    // 构建响应
    const response = {
      overview: {
        totalPosts: postCount?.count || 0,
        publishedPosts: publishedPostCount?.count || 0,
        draftPosts: draftPostCount?.count || 0,
        categories: categoryCount?.count || 0,
        tags: tagCount?.count || 0
      },
      recentPosts: formattedRecentPosts,
      trends: trends,
      source: 'direct-sqlite-fixed'
    };
    
    return Response.json(response);
  } catch (error) {
    console.error('[API修复版] 获取仪表盘数据失败:', error);
    
    return Response.json(
      { 
        error: '获取仪表盘数据失败', 
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 