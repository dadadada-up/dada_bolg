import { NextResponse } from 'next/server';
import * as SlugManager from '@/lib/content/slug-manager';
import { revalidatePath } from 'next/cache';

/**
 * Slug管理API - 整合多个Slug清理和优化功能
 * 
 * GET: 分析slug状态（中文slug、随机后缀slug等）
 * POST: 执行slug优化（拼音转换、随机后缀去除等）
 * 
 * 整合了以下原有功能:
 * - /api/fix-slugs: 修复随机ID后缀的slug
 * - scripts/clean-slugs.js: 将中文slug转换为拼音
 */

// 分析slug状态
export async function GET(request: Request) {
  try {
    console.log('[Slug管理] 开始分析slug状态');
    
    // 执行分析
    const analysis = await SlugManager.analyzeSlugs();
    
    return Response.json(analysis);
  } catch (error) {
    console.error('[Slug管理] 分析失败:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : null 
    }, { status: 500 });
  }
}

// 执行slug优化
export async function POST(request: Request) {
  try {
    // 解析请求参数
    const body = await request.json();
    const mode = body.mode || 'all';
    
    console.log(`[Slug管理] 开始优化slug (模式: ${mode})`);
    
    let results;
    
    // 根据模式选择处理方法
    switch (mode) {
      case 'random_suffix':
        // 仅处理随机后缀
        results = await SlugManager.fixRandomSuffixSlugs();
        break;
        
      case 'chinese':
        // 仅处理中文slug
        results = await SlugManager.convertChineseSlugs();
        break;
        
      case 'all':
      default:
        // 全面优化
        results = await SlugManager.optimizeAllSlugs();
        break;
    }
    
    // 清除缓存，确保前端获取最新数据
    revalidatePath('/posts');
    revalidatePath('/admin/posts');
    
    return Response.json({
      success: true,
      mode,
      results
    });
  } catch (error) {
    console.error('[Slug管理] 优化失败:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : null 
    }, { status: 500 });
  }
} 