import { NextResponse } from 'next/server';
import { getPosts, clearContentCache } from '@/lib/github';
import { getAllPosts as getDbPosts } from '@/lib/db-posts';
import { savePostSafe } from '@/lib/db-posts.patch';
import { Post } from '@/types/post';

export async function GET(request: Request) {
  try {
    // 清除缓存
    clearContentCache();
    
    // 从GitHub获取所有文章
    console.log("开始从GitHub获取文章...");
    const githubPosts = await getPosts();
    console.log(`从GitHub获取到 ${githubPosts.length} 篇文章`);
    
    // 同步到数据库
    const syncResults = {
      total: githubPosts.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const post of githubPosts) {
      try {
        savePostSafe(post);
        syncResults.success++;
      } catch (error) {
        syncResults.failed++;
        syncResults.errors.push(`同步文章 ${post.slug} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
    
    // 获取数据库中的文章
    const dbPostsResult = getDbPosts();
    const dbPosts = dbPostsResult.posts;
    
    // 统计各分类下的文章数量
    const categoryCounts: Record<string, number> = {};
    
    // GitHub文章分类统计
    githubPosts.forEach(post => {
      post.categories.forEach(category => {
        if (!categoryCounts[category]) {
          categoryCounts[category] = 0;
        }
        categoryCounts[category]++;
      });
    });
    
    // 数据库文章分类统计
    const dbCategoryCounts: Record<string, number> = {};
    dbPosts.forEach(post => {
      post.categories.forEach(category => {
        if (!dbCategoryCounts[category]) {
          dbCategoryCounts[category] = 0;
        }
        dbCategoryCounts[category]++;
      });
    });
    
    return Response.json({
      success: true,
      syncResults,
      github: {
        total: githubPosts.length,
        categoryCounts
      },
      database: {
        total: dbPosts.length,
        categoryCounts: dbCategoryCounts
      }
    });
  } catch (error) {
    console.error("同步测试失败:", error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
} 