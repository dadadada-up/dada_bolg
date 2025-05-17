import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * 更新分类表结构，添加必要的字段
 */
export async function POST() {
  try {
    console.log('[API] 开始更新分类表结构');
    
    const db = await getDb();
    const results = {
      addedColumns: [] as string[]
    };
    
    // 检查并添加 description 列
    try {
      await db.get('SELECT description FROM categories LIMIT 1');
      console.log('[API] description 列已存在');
    } catch (error) {
      console.log('[API] 添加 description 列');
      await db.exec('ALTER TABLE categories ADD COLUMN description TEXT');
      results.addedColumns.push('description');
    }
    
    // 检查并添加 post_count 列
    try {
      await db.get('SELECT post_count FROM categories LIMIT 1');
      console.log('[API] post_count 列已存在');
    } catch (error) {
      console.log('[API] 添加 post_count 列');
      await db.exec('ALTER TABLE categories ADD COLUMN post_count INTEGER DEFAULT 0');
      results.addedColumns.push('post_count');
    }
    
    // 检查并添加 created_at 列
    try {
      await db.get('SELECT created_at FROM categories LIMIT 1');
      console.log('[API] created_at 列已存在');
    } catch (error) {
      console.log('[API] 添加 created_at 列');
      // 先添加列，然后更新为当前时间戳
      await db.exec('ALTER TABLE categories ADD COLUMN created_at INTEGER DEFAULT 0');
      const timestamp = Math.floor(Date.now() / 1000);
      await db.run('UPDATE categories SET created_at = ?', [timestamp]);
      results.addedColumns.push('created_at');
    }
    
    // 检查并添加 updated_at 列
    try {
      await db.get('SELECT updated_at FROM categories LIMIT 1');
      console.log('[API] updated_at 列已存在');
    } catch (error) {
      console.log('[API] 添加 updated_at 列');
      // 先添加列，然后更新为当前时间戳
      await db.exec('ALTER TABLE categories ADD COLUMN updated_at INTEGER DEFAULT 0');
      const timestamp = Math.floor(Date.now() / 1000);
      await db.run('UPDATE categories SET updated_at = ?', [timestamp]);
      results.addedColumns.push('updated_at');
    }
    
    console.log(`[API] 分类表结构更新完成，添加了 ${results.addedColumns.length} 个列`);
    
    return Response.json({
      success: true,
      message: `分类表结构更新完成`,
      ...results
    });
  } catch (error) {
    console.error('[API] 更新分类表结构失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '更新分类表结构失败' },
      { status: 500 }
    );
  }
} 