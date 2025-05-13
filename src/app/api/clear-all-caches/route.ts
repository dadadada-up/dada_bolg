import { NextResponse } from 'next/server';
import { clearAllGithubCache } from '@/lib/fs-cache';
import { clearContentCache, forceRefreshAllData } from '@/lib/github';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const results = {
      fsCache: false,
      memoryCache: false,
      apiCache: false,
      serverCache: false,
      pageRevalidation: false,
      errors: [] as string[]
    };
    
    console.log('[清理缓存] 开始清理所有缓存...');
    
    // 1. 清理文件系统缓存
    try {
      results.fsCache = await clearAllGithubCache();
      console.log(`[清理缓存] 文件系统缓存清理: ${results.fsCache ? '成功' : '失败'}`);
    } catch (error) {
      const errorMsg = `清理文件系统缓存失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(`[清理缓存] ${errorMsg}`);
      results.errors.push(errorMsg);
    }
    
    // 2. 清理内存缓存
    try {
      clearContentCache();
      results.memoryCache = true;
      console.log('[清理缓存] 内存缓存清理: 成功');
    } catch (error) {
      const errorMsg = `清理内存缓存失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(`[清理缓存] ${errorMsg}`);
      results.errors.push(errorMsg);
    }
    
    // 3. 清理API缓存表
    try {
      const db = await getDb();
      
      // 清理API响应缓存
      await db.run('DELETE FROM api_cache');
      results.apiCache = true;
      console.log('[清理缓存] API缓存清理: 成功');
      
      // 重置同步状态
      await db.run('UPDATE sync_status SET sync_in_progress = 0 WHERE id = 1');
      results.serverCache = true;
      console.log('[清理缓存] 服务器状态重置: 成功');
    } catch (error) {
      const errorMsg = `清理数据库缓存失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(`[清理缓存] ${errorMsg}`);
      results.errors.push(errorMsg);
    }
    
    // 4. 重新验证所有页面路径
    try {
      // 重新验证首页
      revalidatePath('/', 'layout');
      
      // 重新验证文章页和管理页
      revalidatePath('/posts', 'layout');
      revalidatePath('/admin', 'layout');
      
      results.pageRevalidation = true;
      console.log('[清理缓存] 页面重新验证: 成功');
    } catch (error) {
      const errorMsg = `页面重新验证失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(`[清理缓存] ${errorMsg}`);
      results.errors.push(errorMsg);
    }
    
    // 5. 强制刷新所有GitHub数据 (可选)
    let githubRefresh = false;
    try {
      const includeGitHubRefresh = request.headers.get('X-Include-GitHub-Refresh') === 'true';
      
      if (includeGitHubRefresh) {
        console.log('[清理缓存] 开始强制刷新GitHub数据...');
        githubRefresh = await forceRefreshAllData();
        console.log(`[清理缓存] GitHub数据刷新: ${githubRefresh ? '成功' : '失败'}`);
      }
    } catch (error) {
      const errorMsg = `GitHub数据刷新失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(`[清理缓存] ${errorMsg}`);
      results.errors.push(errorMsg);
    }
    
    return Response.json({
      success: results.errors.length === 0,
      message: '缓存清理完成',
      results: {
        ...results,
        githubRefresh
      }
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    console.error('[清理缓存] 清理缓存失败:', errorMsg);
    return Response.json(
      { 
        error: errorMsg,
        stack: error instanceof Error ? error.stack : null 
      }, 
      { status: 500 }
    );
  }
} 