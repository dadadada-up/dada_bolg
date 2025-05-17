/**
 * 直接使用本地SQLite数据库的测试API
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

export async function GET() {
  try {
    // 直接使用本地SQLite数据库
    const dbPath = path.resolve(process.cwd(), 'data', 'blog.db');
    console.log(`[DB-TEST] 尝试连接本地SQLite: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // 查询文章总数
    const count = await db.get('SELECT COUNT(*) as count FROM posts');
    
    // 查询示例文章
    const posts = await db.all(`
      SELECT id, title, slug, content, excerpt
      FROM posts
      LIMIT 10
    `);
    
    // 关闭数据库连接
    await db.close();
    
    return Response.json({
      message: '直接访问SQLite数据库成功',
      dbPath,
      totalPosts: count.count,
      samplePosts: posts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DB-TEST] 直接访问SQLite数据库失败:', error);
    
    return Response.json({
      error: '直接访问SQLite数据库失败',
      message: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 