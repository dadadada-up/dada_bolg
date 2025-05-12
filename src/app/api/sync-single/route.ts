import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/github';
import initializeDatabase, { getDb } from '@/lib/db';
import { PostRepository } from '@/lib/db/repositories/posts';

export async function GET() {
  try {
    console.log('[API] 开始单文章同步测试');
    
    // 初始化数据库
    await initializeDatabase();
    
    // 获取第一篇文章
    const posts = await getPosts();
    if (!posts || posts.length === 0) {
      return Response.json({
        success: false,
        message: '没有找到文章'
      }, { status: 404 });
    }
    
    const post = posts[0];
    console.log(`[API] 选择同步文章: ${post.slug}`);
    
    // 创建仓库
    const postRepo = new PostRepository();
    
    // 转换为模型
    const yamlValid = Boolean(post.categories && post.categories.length > 0 && post.title && post.date);
    const postModel = postRepo.convertPostToModel(post, yamlValid);
    console.log(`[API] 文章模型准备完成: ${post.slug}`);
    
    // 直接尝试创建文章
    try {
      console.log(`[API] 尝试直接创建文章: ${post.slug}`);
      
      const db = await getDb();
      
      // 先清除可能存在的记录
      await db.exec(`DELETE FROM posts WHERE slug = '${post.slug.replace(/'/g, "''")}'`);
      
      // 检查posts表有哪些列
      const columnsToCheck = [
        'id', 'slug', 'title', 'content', 'excerpt', 'published', 
        'date', 'updated', 'featured', 'yaml_valid', 'manually_edited', 
        'created_at', 'updated_at'
      ];
      const existingColumns: string[] = [];
      
      console.log('[API] 开始检查posts表的列结构');
      // 先检查表是否存在
      try {
        await db.exec('SELECT 1 FROM posts LIMIT 0');
        console.log('[API] posts表存在');
        
        // 逐列检查
        for (const column of columnsToCheck) {
          try {
            await db.exec(`SELECT ${column} FROM posts LIMIT 0`);
            existingColumns.push(column);
            console.log(`[API] 列存在: posts.${column}`);
          } catch (error) {
            console.log(`[API] 列不存在: posts.${column}`);
          }
        }
      } catch (error) {
        console.error('[API] posts表不存在:', error);
        return Response.json({
          success: false,
          message: 'posts表不存在，请先初始化数据库',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }
      
      console.log(`[API] 检测到的列: ${existingColumns.join(', ')}`);
      
      // 构建动态SQL
      const now = new Date().toISOString();
      const columnValues: Record<string, any> = {
        slug: post.slug,
        title: post.title,
        content: post.content || '',
        published: 1,
        date: post.date,
        updated: post.date,
        featured: 0,
        excerpt: post.excerpt || '',
        created_at: now,
        updated_at: now
      };
      
      // 只包含存在的列
      const columns: string[] = [];
      const values: string[] = [];
      
      for (const [column, value] of Object.entries(columnValues)) {
        if (existingColumns.includes(column)) {
          columns.push(column);
          if (typeof value === 'string') {
            values.push(`'${value.replace(/'/g, "''")}'`);
          } else {
            values.push(String(value));
          }
        }
      }
      
      // 检查是否有yaml_valid列
      if (existingColumns.includes('yaml_valid')) {
        columns.push('yaml_valid');
        values.push(yamlValid ? '1' : '0');
      }
      
      // 检查是否有manually_edited列
      if (existingColumns.includes('manually_edited')) {
        columns.push('manually_edited');
        values.push('0');
      }
      
      // 生成最终SQL
      const sql = `
        INSERT INTO posts (${columns.join(', ')})
        VALUES (${values.join(', ')})
      `;
      
      console.log(`[API] 执行SQL: ${sql}`);
      await db.exec(sql);
      
      console.log(`[API] 文章创建成功: ${post.slug}`);
      
      return Response.json({
        success: true,
        message: '文章创建成功',
        data: {
          slug: post.slug,
          title: post.title,
          columns: existingColumns,
          sql: sql
        }
      });
    } catch (error) {
      console.error(`[API] 直接创建文章失败: ${post.slug}`, error);
      return Response.json({
        success: false,
        message: '直接创建文章失败',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[API] 单文章同步测试失败:', error);
    return Response.json({
      success: false,
      message: '单文章同步测试失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 