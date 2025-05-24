/**
 * 直接使用本地SQLite数据库的测试API
 */

import path from 'path';
import { isVercelEnv } from '@/lib/db/env-config';

export async function GET() {
  // 在Vercel环境中返回模拟数据
  if (isVercelEnv) {
    console.log('[DB-TEST] 检测到Vercel环境，不使用SQLite');
    return Response.json({
      message: 'Vercel环境中不支持直接访问SQLite数据库',
      isVercelEnv: true,
      timestamp: new Date().toISOString()
    });
  }

  try {
    // 仅在非Vercel环境中动态导入sqlite模块
    const { open } = await import('sqlite');
    const sqlite3Module = await import('sqlite3');
    
    // 直接使用本地SQLite数据库
    const dbPath = path.resolve(process.cwd(), 'data', 'blog.db');
    console.log(`[DB-TEST] 尝试连接本地SQLite: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3Module.default.Database
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