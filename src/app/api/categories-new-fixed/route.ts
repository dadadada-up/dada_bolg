/**
 * 分类API（修复版本）
 * 
 * 使用 Turso 数据库访问分类数据
 */

import { query } from '@/lib/db/database';

export async function GET() {
  try {
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
    
    const categories = await query(sql);
    
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