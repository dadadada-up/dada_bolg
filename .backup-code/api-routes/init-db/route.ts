import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';
import fs from 'fs';
import { dbSchema } from '@/lib/db/models';

export async function POST() {
  try {
    console.log('[API] 开始重新初始化数据库');
    
    // 获取数据库路径
    const defaultDbPath = path.resolve(process.cwd(), 'data', 'blog.db');
    const dbPath = process.env.DB_PATH || defaultDbPath;
    console.log(`[API] 数据库路径: ${dbPath}`);
    console.log(`[API] process.cwd(): ${process.cwd()}`);
    console.log(`[API] 默认路径: ${defaultDbPath}`);
    console.log(`[API] 环境变量DB_PATH: ${process.env.DB_PATH || '未设置'}`);
    
    // 在继续前，确保环境变量设置正确
    process.env.DB_PATH = dbPath;
    console.log(`[API] 已设置环境变量DB_PATH=${process.env.DB_PATH}`);
    
    // 如果数据库文件存在，先备份当前的数据库
    const dbExists = fs.existsSync(dbPath);
    if (dbExists) {
      const backupPath = `${dbPath}.backup.${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`[API] 已备份当前数据库到: ${backupPath}`);
      
      // 删除当前数据库
      fs.unlinkSync(dbPath);
      console.log(`[API] 已删除当前数据库`);
    }
    
    // 重新获取数据库连接（这会创建新的数据库文件）
    const db = await getDb();
    console.log(`[API] 已创建新的数据库连接`);
    
    // 执行数据库初始化脚本
    await db.exec(dbSchema);
    console.log(`[API] 已执行数据库初始化脚本`);
    
    // 验证表是否创建成功
    try {
      await db.exec('SELECT 1 FROM posts LIMIT 1');
      await db.exec('SELECT 1 FROM categories LIMIT 1');
      await db.exec('SELECT 1 FROM tags LIMIT 1');
      await db.exec('SELECT 1 FROM post_categories LIMIT 1');
      await db.exec('SELECT 1 FROM post_tags LIMIT 1');
      console.log(`[API] 表验证成功`);
    } catch (error) {
      console.error(`[API] 表验证失败:`, error);
      return Response.json({
        success: false,
        message: '表验证失败',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
    
    return Response.json({
      success: true,
      message: '数据库重新初始化成功',
      data: {
        dbPath,
        tables: ['posts', 'categories', 'tags', 'post_categories', 'post_tags']
      }
    });
  } catch (error) {
    console.error('[API] 数据库重新初始化失败:', error);
    return Response.json({
      success: false,
      message: '数据库重新初始化失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 