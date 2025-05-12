import { NextResponse } from 'next/server';
import { initializeDatabase, getDbStatus } from '@/lib/db';
import { withDeprecationWarning } from '@/lib/deprecation-middleware';

// 数据库初始化处理函数
async function handleGET(request: Request) {
  try {
    // 初始化数据库
    await initializeDatabase();
    
    // 获取数据库状态
    const status = await getDbStatus();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: '数据库已成功初始化',
        status
      }),
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("数据库初始化失败:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : null
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 导出添加了弃用警告的处理函数
export const GET = withDeprecationWarning(
  handleGET,
  '/api/database',
  '请使用POST方法并设置 { operation: "init" }'
); 