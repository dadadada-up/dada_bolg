/**
 * 分类API（修复版本）
 * 
 * 直接使用本地SQLite数据库访问分类数据
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
    
    // 查询所有分类
    const sql = `
      SELECT 
        c.id, c.name, c.slug, c.description,
        COUNT(DISTINCT pc.post_id) as post_count
      FROM categories c
      LEFT JOIN post_categories pc ON c.id = pc.category_id
      LEFT JOIN posts p ON pc.post_id = p.id AND p.is_published = 1
      GROUP BY c.id
      ORDER BY c.name
    `;
    
    const categories = await db.all(sql);
    
    // 关闭数据库连接
    await db.close();
    
    return Response.json(categories);
  } catch (error) {
    console.error('[API修复版] 获取分类失败:', error);
    
    return Response.json(
      { 
        error: '获取分类失败', 
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 