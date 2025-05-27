/**
 * API路由: 同步本地数据库到生产环境
 * 
 * 此API执行sync-content.js脚本，将本地Turso数据库同步到生产环境
 */

import { NextRequest } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

// 请求参数接口
interface SyncToProdRequest {
  tables: string[];
  dryRun: boolean;
}

export async function POST(request: NextRequest) {
  // 仅在开发环境中可用
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: '此API仅在开发环境中可用' },
      { status: 404 }
    );
  }
  
  try {
    // 解析请求参数
    const data: SyncToProdRequest = await request.json();
    
    // 验证参数
    if (!data.tables || !Array.isArray(data.tables) || data.tables.length === 0) {
      return Response.json(
        { error: '请选择至少一个要同步的表' },
        { status: 400 }
      );
    }
    
    // 执行脚本路径
    const scriptPath = path.join(process.cwd(), 'scripts', 'sync-content.js');
    
    // 构建命令
    const dryRunFlag = data.dryRun ? '--dry-run' : '';
    const tablesParam = `--tables=${data.tables.join(',')}`;
    const command = `node "${scriptPath}" ${dryRunFlag} ${tablesParam}`;
    
    // 日志内容
    let logOutput = '';
    
    try {
      // 执行同步脚本
      logOutput = execSync(command, { 
        encoding: 'utf-8',
        timeout: 60000 // 60秒超时
      });
      
      // 检查执行结果
      if (data.dryRun) {
        return Response.json({
          success: true,
          message: '试运行成功，未对生产环境进行实际修改',
          logs: logOutput
        });
      } else {
        return Response.json({
          success: true,
          message: '数据已成功同步到生产环境',
          logs: logOutput
        });
      }
    } catch (execError) {
      return Response.json({
        success: false,
        error: `执行脚本失败: ${execError.message}`,
        logs: execError.stdout?.toString() || execError.stderr?.toString() || logOutput
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