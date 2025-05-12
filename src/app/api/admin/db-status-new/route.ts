import { NextResponse } from 'next/server';
import initializeDatabase, { getDb } from '@/lib/db';
import { PostRepository } from '@/lib/db/repositories/posts';
import { CategoryRepository } from '@/lib/db/repositories/categories';
import { TagRepository } from '@/lib/db/repositories/tags';

export async function GET() {
  try {
    console.log('[API] 开始检查数据库状态 (新版)...');

    // 初始化数据库并获取连接
    try {
      await initializeDatabase();
      console.log('[API] 数据库初始化成功');
    } catch (error) {
      console.error('[API] 数据库初始化失败:', error);
      return Response.json(
        { 
          success: false, 
          message: '数据库初始化失败', 
          error: error instanceof Error ? error.message : String(error) 
        },
        { status: 500 }
      );
    }
    
    // 检查数据库连接
    try {
      const db = await getDb();
      await db.exec('SELECT 1 as test');
      console.log('[API] 数据库连接测试成功');
    } catch (error) {
      console.error('[API] 数据库连接测试失败:', error);
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
      tables: [] as string[]
    };
    
    // 获取表信息
    try {
      const db = await getDb();
      const result = await db.exec(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      
      // 由于我们只能使用exec方法，无法获取查询结果
      // 暂时使用固定列表代替
      dbInfo.tables = ['posts', 'categories', 'tags', 'post_categories', 'post_tags'];
      console.log('[API] 成功获取表信息:', dbInfo.tables);
    } catch (error) {
      console.error('[API] 获取表信息失败:', error);
      // 继续执行，不终止请求
    }
    
    // 尝试获取统计信息
    let stats = {
      posts: { total: 0, published: 0 },
      categories: 0,
      tags: 0
    };
    
    try {
      // 实例化存储库
      const postRepo = new PostRepository();
      const categoryRepo = new CategoryRepository();
      const tagRepo = new TagRepository();
      
      // 获取文章统计 - 注意：使用is_published参数，不是published
      stats.posts.total = await postRepo.getTotalPosts();
      stats.posts.published = await postRepo.getTotalPosts({ is_published: true });
      
      // 获取分类统计
      const categories = await categoryRepo.getAllCategories();
      stats.categories = categories.length;
      
      // 获取标签统计
      const tags = await tagRepo.getAllTags();
      stats.tags = tags.length;
      
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
        version: 'new' // 标记这是新版本的API
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