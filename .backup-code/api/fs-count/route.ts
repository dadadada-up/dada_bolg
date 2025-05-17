import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    // 使用正确的路径
    const basePath = path.resolve(process.cwd(), '../content/posts');
    console.log(`使用路径: ${basePath}`);
    
    const stats: Record<string, any> = {
      total: 0,
      categories: {}
    };
    
    // 读取所有分类目录
    const categories = fs.readdirSync(basePath)
      .filter(item => fs.statSync(path.join(basePath, item)).isDirectory());
    
    console.log(`找到分类目录: ${categories.join(', ')}`);
    
    // 统计每个分类下的文件数量
    for (const category of categories) {
      const categoryPath = path.join(basePath, category);
      let files: string[] = [];
      
      try {
        files = fs.readdirSync(categoryPath)
          .filter(file => file.endsWith('.md') && fs.statSync(path.join(categoryPath, file)).isFile());
      } catch (error) {
        console.error(`Error reading directory ${categoryPath}:`, error);
      }
      
      stats.categories[category] = {
        count: files.length,
        files: files.slice(0, 5) // 只返回前5个文件名作为示例
      };
      
      stats.total += files.length;
    }
    
    return Response.json({
      success: true,
      filesystem: stats
    });
  } catch (error) {
    console.error("文件系统统计失败:", error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
} 