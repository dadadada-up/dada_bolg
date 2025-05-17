import { NextResponse } from 'next/server';
import { forceRefreshAllData } from '@/lib/github';
import { clearAllGithubCache } from '@/lib/content/manager';
import { syncBidirectional } from '@/lib/sync/service';

export async function POST(request: Request) {
  try {
    console.log('[API] Vercel环境中不支持强制刷新和同步操作');
    
    return Response.json({
      success: false,
      message: 'Vercel环境中不支持强制刷新和同步操作，请在本地开发环境中执行此操作',
      timestamp: new Date().toISOString()
    }, { status: 403 });
  } catch (error) {
    console.error('[API] 强制刷新和同步失败:', error);
    
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '强制刷新和同步失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 