import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isVercelEnv } from '@/lib/db/env-config';
import { dynamicConfig } from '@/lib/api/route-config';

// 强制动态路由，防止静态生成
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // 在Vercel环境中返回模拟数据
    if (isVercelEnv) {
      console.log('[fs-count] 检测到Vercel环境，返回模拟数据');
      return Response.json({
        success: true,
        filesystem: {
          total: 57,
          categories: {
            'tech': {
              count: 25,
              files: ['react-hooks.md', 'nextjs-intro.md', 'typescript-tips.md']
            },
            'life': {
              count: 12,
              files: ['travel-notes.md', 'reading-list.md']
            },
            'thoughts': {
              count: 20,
              files: ['future-web.md', 'ai-trends.md']
            }
          },
          environment: 'vercel'
        }
      });
    }
    
    // 本地环境下执行实际的文件系统统计
    // 使用正确的路径
    const basePath = path.resolve(process.cwd(), '../content/posts');
    console.log(`使用路径: ${basePath}`);
    
    const stats: Record<string, any> = {
      total: 0,
      categories: {},
      environment: 'local'
    };
    
    // 检查目录是否存在
    if (!fs.existsSync(basePath)) {
      console.warn(`目录不存在: ${basePath}，使用备用路径`);
      // 尝试使用备用路径
      const altPath = path.resolve(process.cwd(), 'content/posts');
      
      if (fs.existsSync(altPath)) {
        console.log(`使用备用路径: ${altPath}`);
        return countFilesInDirectory(altPath, stats);
      } else {
        return Response.json({
          success: false,
          message: '文章目录不存在',
          paths: {
            tried: [basePath, altPath]
          }
        });
      }
    }
    
    return countFilesInDirectory(basePath, stats);
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

// 辅助函数：统计目录中的文件
function countFilesInDirectory(dirPath: string, stats: Record<string, any>) {
  try {
    // 读取所有分类目录
    const categories = fs.readdirSync(dirPath)
      .filter(item => {
        const fullPath = path.join(dirPath, item);
        return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
      });
    
    console.log(`找到分类目录: ${categories.join(', ')}`);
    
    // 统计每个分类下的文件数量
    for (const category of categories) {
      const categoryPath = path.join(dirPath, category);
      let files: string[] = [];
      
      try {
        files = fs.readdirSync(categoryPath)
          .filter(file => {
            const filePath = path.join(categoryPath, file);
            return file.endsWith('.md') && fs.existsSync(filePath) && fs.statSync(filePath).isFile();
          });
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
    console.error("目录读取失败:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      path: dirPath
    });
  }
} 