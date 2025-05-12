import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST() {
  try {
    console.log('[API] 开始执行SSH备份...');
    
    // 获取项目根目录
    const projectRoot = process.cwd();
    
    // 执行手动备份命令
    const { stdout, stderr } = await execAsync('npm run manual-backup', {
      cwd: projectRoot
    });
    
    console.log('[API] SSH备份命令输出:', stdout);
    
    if (stderr && stderr.trim().length > 0) {
      console.warn('[API] SSH备份命令错误:', stderr);
    }
    
    return Response.json({
      success: true,
      message: '使用SSH方式成功备份到GitHub',
      details: stdout
    });
  } catch (error) {
    console.error('[API] SSH备份失败:', error);
    
    return Response.json(
      { 
        success: false, 
        message: '备份失败',
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
} 