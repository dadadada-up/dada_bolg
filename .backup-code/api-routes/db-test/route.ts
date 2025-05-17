import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';

export async function GET() {
  try {
    console.log('[API] 开始数据库连接测试');
    
    // 获取数据库路径
    const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'blog.db');
    console.log(`[API] 数据库路径: ${dbPath}`);
    
    // 检查数据库连接
    const db = await getDb();
    console.log('[API] 数据库连接获取成功');
    
    // 尝试创建测试表
    try {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS test_table (
          id INTEGER PRIMARY KEY,
          name TEXT
        )
      `);
      console.log('[API] 测试表创建成功');
      
      // 插入测试数据
      await db.exec(`
        INSERT INTO test_table (name) VALUES ('测试数据')
      `);
      console.log('[API] 测试数据插入成功');
    } catch (error) {
      console.error('[API] 数据库操作失败:', error);
      return Response.json({
        success: false,
        message: '数据库操作失败',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
    
    return Response.json({
      success: true,
      message: '数据库连接测试成功',
      data: {
        dbPath
      }
    });
  } catch (error) {
    console.error('[API] 数据库连接测试失败:', error);
    return Response.json({
      success: false,
      message: '数据库连接测试失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 