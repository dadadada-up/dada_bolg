import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/database';

// 检测是否在Vercel环境中
const isVercel = process.env.VERCEL === '1';

export async function GET() {
  try {
    console.log('[API] 开始检查数据库状态 (新版)...');
    console.log(`[API] 当前环境: ${isVercel ? 'Vercel' : '本地开发'}`);

    // 在Vercel环境中返回模拟数据
    if (isVercel) {
      console.log('[API] Vercel环境，返回模拟数据');
      return Response.json({
        success: true,
        data: {
          status: 'connected',
          database: {
            path: 'Turso云数据库',
            tables: ['posts', 'categories', 'tags', 'post_categories', 'post_tags']
          },
          counts: {
            posts: { total: 0, published: 0 },
            categories: 0,
            tags: 0
          },
          version: 'new',
          environment: 'vercel'
        }
      });
    }

    // 本地环境下进行实际数据库检查
    try {
      const db = await getDatabase();
      console.log('[API] 数据库初始化成功');
    
    // 检查数据库连接
      await db.exec('SELECT 1 as test');
      console.log('[API] 数据库连接测试成功');
    } catch (error) {
      console.error('[API] 数据库连接失败:', error);
      return Response.json(
        { 
          success: false, 
          message: '数据库连接失败', 
          error: error instanceof Error ? error.message : String(error) 
        },
        { status: 500 }
      );
    }
    
    // 基本信息
    const dbInfo = {
      path: process.env.DB_PATH || '未设置',
      tables: ['posts', 'categories', 'tags', 'post_categories', 'post_tags']
    };
    
    // 尝试获取统计信息
    let stats = {
      posts: { total: 0, published: 0 },
      categories: 0,
      tags: 0
    };
    
    try {
      // 获取统计数据
      const db = await getDatabase();
      
      // 获取文章统计
      const postsResult = await db.get('SELECT COUNT(*) as total FROM posts');
      stats.posts.total = postsResult?.total || 0;
      
      const publishedResult = await db.get('SELECT COUNT(*) as published FROM posts WHERE published = 1');
      stats.posts.published = publishedResult?.published || 0;
      
      // 获取分类统计
      const categoriesResult = await db.get('SELECT COUNT(*) as total FROM categories');
      stats.categories = categoriesResult?.total || 0;
      
      // 获取标签统计
      const tagsResult = await db.get('SELECT COUNT(*) as total FROM tags');
      stats.tags = tagsResult?.total || 0;
      
      console.log('[API] 成功获取统计信息:', stats);
    } catch (error) {
      console.error('[API] 获取统计信息失败:', error);
      // 继续执行，不终止请求
    }
    
    return Response.json({
      success: true,
      data: {
        status: 'connected',
        database: dbInfo,
        counts: stats,
        version: 'new',
        environment: 'local'
      }
    });
  } catch (error) {
    console.error('[API] 数据库状态检查失败:', error);
    return Response.json(
      { 
        success: false, 
        message: '数据库状态检查失败',
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 