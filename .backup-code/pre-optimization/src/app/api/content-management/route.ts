import { NextResponse } from 'next/server';
import * as ContentManager from '@/lib/content/manager';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * 内容管理API - 整合多个清理和修复功能
 * 
 * GET: 分析内容，查找问题（重复文章等）但不执行修改
 * POST: 执行内容清理和优化
 * DELETE: 删除特定内容（如脏数据）
 * 
 * 整合了以下原有API:
 * - clean-db: 基础清理功能
 * - clean-duplicates: 特定文章的重复处理
 * - fix-duplicates: 高级重复处理
 * - clean-db-advanced: 高级数据库清理功能
 */

// 分析内容问题，但不执行修改
export async function GET(request: Request) {
  try {
    // 获取请求参数
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'standard';
    
    console.log(`[内容管理] 开始分析内容问题 (模式: ${mode})`);
    
    // 执行分析
    const { duplicateGroups, orphanedMappings } = await ContentManager.performDatabaseCleanup();
    
    // 汇总结果
    const result = {
      duplicateGroups: duplicateGroups.map(group => ({
        original: {
          slug: group.original.slug,
          title: group.original.title,
          created_at: group.original.date,
          categories: group.original.categories
        },
        duplicates: group.duplicates.map(dup => ({
          slug: dup.slug,
          title: dup.title,
          created_at: dup.date,
          categories: dup.categories
        }))
      })),
      duplicateGroupsCount: duplicateGroups.length,
      totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.duplicates.length, 0),
      orphanedMappings
    };
    
    return Response.json(result);
  } catch (error) {
    console.error('[内容管理] 分析失败:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : null 
    }, { status: 500 });
  }
}

// 执行内容清理和优化
export async function POST(request: Request) {
  try {
    console.log('[内容管理] 开始执行内容清理和优化');
    
    // 解析请求参数
    const body = await request.json();
    const mode = body.mode || 'standard';
    const options = body.options || {};
    
    console.log(`[内容管理] 模式: ${mode}, 选项:`, options);
    
    // 执行清理与优化
    const results = await ContentManager.processAllContent();
    
    // 清除缓存，确保前端获取最新数据
    revalidatePath('/posts');
    revalidatePath('/admin/posts');
    
    return Response.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('[内容管理] 清理失败:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : null 
    }, { status: 500 });
  }
}

// 删除特定内容（如脏数据）
export async function DELETE(request: Request) {
  try {
    // 解析请求参数
    const body = await request.json();
    const slugsToRemove = body.slugs || [];
    const force = body.force || false;
    
    if (!Array.isArray(slugsToRemove) || slugsToRemove.length === 0) {
      return Response.json({ 
        error: '请提供要删除的文章slug数组' 
      }, { status: 400 });
    }
    
    console.log(`[内容管理] 开始删除指定文章，共 ${slugsToRemove.length} 篇`);
    
    // 执行删除
    const results = await ContentManager.removeSpecificArticles(slugsToRemove);
    
    // 清除缓存，确保前端获取最新数据
    revalidatePath('/posts');
    revalidatePath('/admin/posts');
    
    return Response.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('[内容管理] 删除失败:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : null 
    }, { status: 500 });
  }
} 