import { NextResponse } from 'next/server';
import { syncBidirectional, getSyncStatus } from '@/lib/sync/service';
import initializeDatabase from '@/lib/db';

// 确保数据库初始化
initializeDatabase();

// 简单的访问控制：API密钥验证
const API_KEY = process.env.SYNC_API_KEY || 'default-sync-key';

export async function GET(request: Request) {
  // 检查是否有API密钥
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('key');
  
  // 验证API密钥
  if (apiKey !== API_KEY) {
    return Response.json(
      { error: '未授权访问' },
      { status: 401 }
    );
  }
  
  try {
    // 检查当前同步状态
    const status = await getSyncStatus();
    
    // 如果已经在同步中，返回状态但不触发新的同步
    if (status.status === 'syncing') {
      return Response.json({
        success: true,
        message: '同步已在进行中',
        status
      });
    }
    
    // 触发同步
    const result = await syncBidirectional();
    
    return Response.json({
      success: true,
      message: '定时同步完成',
      result
    });
  } catch (error) {
    console.error('定时同步失败:', error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '定时同步失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 也支持POST请求以便通过webhook触发
export async function POST(request: Request) {
  return GET(request);
} 