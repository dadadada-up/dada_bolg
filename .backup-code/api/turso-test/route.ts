/**
 * Turso数据库连接测试API
 * 路径: /api/turso-test
 */
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/database';

export async function GET(req: NextRequest) {
  try {
    // 获取数据库连接
    const db = await getDatabase();
    
    // 执行简单查询
    const result = await db.get('SELECT 1 as test');
    
    // 如果查询成功，返回成功响应
    if (result && result.test === 1) {
      return NextResponse.json({
        status: 'success',
        message: 'Turso数据库连接正常',
        database: process.env.TURSO_DATABASE_URL ? '使用Turso数据库' : '使用本地SQLite数据库',
        timestamp: new Date().toISOString(),
        query_result: result
      });
    } else {
      // 查询结果不符合预期
      return NextResponse.json({
        status: 'error',
        message: '数据库查询返回异常结果',
        result: result
      }, { status: 500 });
    }
  } catch (error) {
    // 捕获并返回错误信息
    console.error('Turso测试API错误:', error);
    return NextResponse.json({
      status: 'error',
      message: '数据库连接测试失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 