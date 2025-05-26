/**
 * API路由: 同步数据库到Navicat
 * 
 * 此API执行create-sqlite-db.js脚本，将Turso数据库同步到SQLite文件
 */

import { NextRequest } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // 执行脚本路径
    const scriptPath = path.join(process.cwd(), 'scripts', 'create-sqlite-db.js');
    
    // 日志内容
    let logOutput = '';
    
    try {
      // 执行同步脚本
      logOutput = execSync(`node "${scriptPath}"`, { 
        encoding: 'utf-8',
        timeout: 30000 // 30秒超时
      });
      
      // 检查执行结果
      if (logOutput.includes('SQLite数据库已创建')) {
        return Response.json({
          success: true,
          message: '数据库已成功同步到Navicat',
          path: '/navicat_import/blog_database.db',
          logs: logOutput
        });
      } else {
        return Response.json({
          success: false,
          error: '同步过程完成但可能有错误',
          logs: logOutput
        }, { status: 500 });
      }
    } catch (execError) {
      return Response.json({
        success: false,
        error: `执行脚本失败: ${execError.message}`,
        logs: logOutput || execError.stdout?.toString() || execError.stderr?.toString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('同步数据库失败:', error);
    return Response.json({
      success: false,
      error: `同步过程发生错误: ${error.message}`
    }, { status: 500 });
  }
} 