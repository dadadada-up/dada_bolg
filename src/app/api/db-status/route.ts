import { getDatabase, query } from '@/lib/db/database';
import { initializeDatabase } from '@/lib/db/database';
import initializeDb from '@/lib/db';
import path from 'path';
import fs from 'fs';

/**
 * 获取数据库状态的API
 */
export async function GET(request: Request) {
  try {
    // 检查数据库文件
    const dbPaths = [
      path.resolve(process.cwd(), 'data', 'blog.db'),
      path.resolve(process.cwd(), 'data', 'storage', 'blog.db')
    ];
    
    const dbFiles = dbPaths.map(dbPath => ({
      path: dbPath,
      exists: fs.existsSync(dbPath),
      size: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0
    }));
    
    // 先初始化数据库连接
    await initializeDatabase();
    
    // 测试数据库连接和查询
    let dbStatus = {
      connected: false,
      version: null as string | null,
      tables: [] as string[],
      postCount: 0,
      error: null as string | null
    };
    
    try {
      // 获取数据库连接
      const db = await getDatabase();
      dbStatus.connected = true;
      
      // 获取SQLite版本
      const versionResult = await query<{version: string}>("SELECT sqlite_version() as version");
      dbStatus.version = versionResult[0]?.version || null;
      
      // 获取所有表
      const tables = await query<{name: string}>("SELECT name FROM sqlite_master WHERE type='table'");
      dbStatus.tables = tables.map(t => t.name);
      
      // 获取文章数量
      if (dbStatus.tables.includes('posts')) {
        const postResult = await query<{count: number}>("SELECT COUNT(*) as count FROM posts");
        dbStatus.postCount = postResult[0]?.count || 0;
      }
    } catch (dbError) {
      console.error('数据库连接测试失败:', dbError);
      dbStatus.error = dbError instanceof Error ? dbError.message : String(dbError);
    }
    
    // 返回状态信息
    return Response.json({
      timestamp: new Date().toISOString(),
      status: dbStatus.connected ? 'ok' : 'error',
      dbFiles,
      database: dbStatus
    });
    
  } catch (error) {
    console.error('获取数据库状态失败:', error);
    
    return Response.json({
      status: 'error',
      message: '获取数据库状态失败',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 