import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/github';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    console.log('[调试] 开始检查同步问题');
    
    // 获取文章并检查内容
    console.log('[调试] 获取GitHub文章');
    const posts = await getPosts();
    
    // 检查第一篇文章
    const firstPost = posts[0];
    const debugInfo: {
      totalPosts: number;
      samplePost: any;
      database: {
        connected: boolean;
        path: string;
        canWrite?: boolean;
        error?: string;
      }
    } = {
      totalPosts: posts.length,
      samplePost: {
        slug: firstPost.slug,
        title: firstPost.title,
        hasContent: Boolean(firstPost.content),
        contentLength: firstPost.content ? firstPost.content.length : 0,
        hasDate: Boolean(firstPost.date),
        categoriesCount: firstPost.categories ? firstPost.categories.length : 0,
        tagsCount: firstPost.tags ? firstPost.tags.length : 0
      },
      database: {
        connected: false,
        path: process.env.DB_PATH || 'default path'
      }
    };
    
    // 检查数据库连接
    try {
      const db = await getDb();
      debugInfo.database.connected = true;
      
      // 检查数据库表是否已创建
      const tables = await db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      
      // 检查表是否已正确创建
      await db.exec(`
        CREATE TABLE IF NOT EXISTS debug_test (
          id INTEGER PRIMARY KEY,
          test_data TEXT
        )
      `);
      
      await db.exec(`
        INSERT INTO debug_test (test_data) VALUES ('测试数据 ${new Date().toISOString()}')
      `);
      
      debugInfo.database.canWrite = true;
    } catch (error) {
      console.error('[调试] 数据库操作失败:', error);
      debugInfo.database.error = error instanceof Error ? error.message : String(error);
    }
    
    return Response.json({
      success: true,
      data: debugInfo
    });
  } catch (error) {
    console.error('[调试] 检查失败:', error);
    return Response.json({
      success: false,
      message: '检查失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 