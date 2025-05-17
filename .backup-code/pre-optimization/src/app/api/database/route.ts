import { NextResponse } from 'next/server';
import initDb, { getDb, getDbStatus, initializeDatabase } from '@/lib/db';
import path from 'path';
import fs from 'fs';
import { revalidatePath } from 'next/cache';

/**
 * 数据库管理API - 整合多个数据库操作功能
 * 
 * GET: 获取数据库状态信息
 * POST: 初始化或重新初始化数据库
 * PUT: 优化数据库（vacuum等操作）
 * 
 * 整合了以下原有API:
 * - db-init: 数据库初始化
 * - init-db: 数据库重新初始化
 * - db-test: 数据库测试
 */

// 获取数据库状态
export async function GET(request: Request) {
  try {
    // 获取请求参数
    const url = new URL(request.url);
    const detail = url.searchParams.get('detail') === 'true';
    
    console.log(`[数据库管理] 获取数据库状态 (详细模式: ${detail})`);
    
    // 确保数据库已初始化
    await initDb();
    
    // 获取数据库状态
    const status = await getDbStatus();
    
    // 如果需要详细信息，增加额外查询
    if (detail) {
      const db = await getDb();
      
      // 获取表统计信息
      const tables = await db.all(`
        SELECT 
          name as tableName,
          (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name=m.name) as indexCount
        FROM 
          sqlite_master m
        WHERE 
          type='table' AND 
          name NOT LIKE 'sqlite_%'
      `);
      
      // 获取各表记录数
      const tableStats = await Promise.all(
        tables.map(async (table: {tableName: string}) => {
          const countResult = await db.get(`SELECT COUNT(*) as count FROM ${table.tableName}`);
          return {
            name: table.tableName,
            count: countResult?.count || 0
          };
        })
      );
      
      return Response.json({
        ...status,
        tables: tableStats
      });
    }
    
    return Response.json(status);
  } catch (error) {
    console.error('[数据库管理] 获取状态失败:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : null 
    }, { status: 500 });
  }
}

// 初始化或重新初始化数据库
export async function POST(request: Request) {
  try {
    // 解析请求参数
    const body = await request.json();
    const forceReinit = body.forceReinit || false;
    const createBackup = body.createBackup !== false;
    
    console.log(`[数据库管理] ${forceReinit ? '重新初始化' : '初始化'}数据库 (备份: ${createBackup})`);
    
    // 获取数据库路径
    const dbPath = path.resolve(process.cwd(), 'data', 'blog.db');
    console.log(`[数据库管理] 数据库路径: ${dbPath}`);
    
    // 检查数据库是否已存在
    const dbExists = fs.existsSync(dbPath);
    
    // 如果数据库存在且要求重新初始化
    if (dbExists && forceReinit) {
      if (createBackup) {
        // 创建备份
        const backupPath = `${dbPath}.backup.${Date.now()}`;
        fs.copyFileSync(dbPath, backupPath);
        console.log(`[数据库管理] 已备份当前数据库到: ${backupPath}`);
      }
      
      // 删除现有数据库
      fs.unlinkSync(dbPath);
      console.log(`[数据库管理] 已删除当前数据库`);
    }
    
    // 初始化数据库
    await initializeDatabase();
    console.log(`[数据库管理] 数据库初始化完成`);
    
    // 验证表是否创建成功
    const db = await getDb();
    try {
      await db.get('SELECT 1 FROM posts LIMIT 1');
      await db.get('SELECT 1 FROM categories LIMIT 1');
      await db.get('SELECT 1 FROM tags LIMIT 1');
      console.log(`[数据库管理] 表验证成功`);
    } catch (error) {
      console.warn(`[数据库管理] 表验证警告:`, error);
      // 这里不抛出错误，因为表为空是正常的
    }
    
    // 获取最新状态
    const status = await getDbStatus();
    
    // 清除缓存
    revalidatePath('/posts');
    revalidatePath('/admin');
    
    return Response.json({
      success: true,
      message: `数据库${forceReinit ? '重新初始化' : '初始化'}成功`,
      status
    });
  } catch (error) {
    console.error('[数据库管理] 初始化失败:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : null 
    }, { status: 500 });
  }
}

// 优化数据库
export async function PUT(request: Request) {
  try {
    // 解析请求参数
    const body = await request.json();
    const operation = body.operation || 'vacuum';
    
    console.log(`[数据库管理] 执行数据库优化操作: ${operation}`);
    
    const db = await getDb();
    
    // 执行请求的操作
    switch (operation) {
      case 'vacuum':
        // 整理数据库，回收空间
        await db.exec('VACUUM');
        break;
        
      case 'analyze':
        // 更新统计信息，优化查询计划
        await db.exec('ANALYZE');
        break;
        
      case 'integrity_check':
        // 检查数据库完整性
        const result = await db.get('PRAGMA integrity_check');
        if (result?.integrity_check !== 'ok') {
          return Response.json({
            success: false,
            message: '数据库完整性检查失败',
            result
          }, { status: 500 });
        }
        break;
        
      default:
        return Response.json({
          success: false,
          error: `未知操作: ${operation}`
        }, { status: 400 });
    }
    
    return Response.json({
      success: true,
      message: `数据库${operation}操作完成`,
      operation
    });
  } catch (error) {
    console.error('[数据库管理] 优化失败:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : null 
    }, { status: 500 });
  }
} 