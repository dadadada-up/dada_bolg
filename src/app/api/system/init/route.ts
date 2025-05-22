import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    console.log('[API] 开始检查数据库表结构');
    
    const db = await getDb();
    
    // 由于无法直接使用db.all获取数据，我们使用一个更简单的方法
    // 直接尝试查询各个表的存在性
    const tables = ['posts', 'categories', 'tags', 'post_categories', 'post_tags'];
    const tableExists: Record<string, boolean> = {};
    
    // 逐个检查表是否存在
    for (const table of tables) {
      try {
        await db.exec(`SELECT 1 FROM ${table} LIMIT 1`);
        tableExists[table] = true;
        console.log(`[API] 表存在: ${table}`);
      } catch (error) {
        tableExists[table] = false;
        console.error(`[API] 表不存在或查询失败: ${table}`, error);
      }
    }
    
    // 检查posts表的列
    let postsColumns: string[] = [];
    try {
      // 尝试针对单个列进行简单查询
      const columnsToCheck = [
        'id', 'slug', 'title', 'content', 'excerpt', 'is_published', 
        'date', 'updated', 'is_featured', 'is_yaml_valid', 'is_manually_edited', 
        'created_at', 'updated_at'
      ];
      
      for (const column of columnsToCheck) {
        try {
          await db.exec(`SELECT ${column} FROM posts LIMIT 0`);
          postsColumns.push(column);
          console.log(`[API] 列存在: posts.${column}`);
        } catch (error) {
          console.log(`[API] 列不存在: posts.${column}`);
        }
      }
    } catch (error) {
      console.error('[API] 检查posts表列失败', error);
    }
    
    return Response.json({
      success: true,
      data: {
        tableExists,
        postsColumns
      }
    });
  } catch (error) {
    console.error('[API] 检查数据库表结构失败:', error);
    return Response.json({
      success: false,
      message: '检查数据库表结构失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 