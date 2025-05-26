/**
 * API路由: 初始化本地Turso实例
 * 
 * 此API从云端Turso数据库同步数据到本地Turso实例
 */

import { NextRequest } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // 执行脚本路径
    const scriptPath = path.join(process.cwd(), 'scripts', 'init-turso.js');
    
    // 日志内容
    let logOutput = '';
    
    try {
      // 执行同步脚本
      logOutput = execSync(`node "${scriptPath}"`, { 
        encoding: 'utf-8',
        timeout: 60000 // 60秒超时
      });
      
      // 检查执行结果
      if (logOutput.includes('初始化完成')) {
        return Response.json({
          success: true,
          message: '本地Turso实例已成功初始化',
          logs: logOutput
        });
      } else {
        return Response.json({
          success: false,
          error: '初始化过程完成但可能有错误',
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
    console.error('初始化Turso实例失败:', error);
    return Response.json({
      success: false,
      error: `初始化过程发生错误: ${error.message}`
    }, { status: 500 });
  }
} 