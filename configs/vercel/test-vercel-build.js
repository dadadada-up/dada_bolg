/**
 * 模拟Vercel构建环境的测试脚本
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname);

// 使用promisify将exec转换为Promise形式
const execAsync = promisify(exec);

// 设置模拟的Vercel环境变量
process.env.VERCEL = '1';
process.env.IS_VERCEL = '1';
process.env.NEXT_PUBLIC_IS_VERCEL = '1';
process.env.TURSO_DATABASE_URL = 'libsql://test-db.turso.io';
process.env.TURSO_AUTH_TOKEN = 'test-token';
process.env.NEXT_PUBLIC_SITE_URL = 'https://dada-blog.vercel.app';

// 定义执行命令的函数
async function runCommand(command, description) {
  console.log(`🚀 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: rootDir });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`❌ ${description}失败:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🏗️ 开始模拟Vercel构建过程');
  console.log('📂 当前目录:', rootDir);
  
  // 先清理.vercelignore文件，确保不会忽略核心文件
  await runCommand('mv .vercelignore .vercelignore.bak || true', '备份.vercelignore文件');
  
  // 准备环境
  await runCommand('node scripts/vercel-setup.js', '初始化环境');
  
  // 准备静态文件
  await runCommand('node scripts/prepare-static-files.js', '准备静态文件');
  
  // 执行Next.js构建
  const buildSuccess = await runCommand('next build', '执行Next.js构建');
  
  // 恢复.vercelignore文件
  await runCommand('mv .vercelignore.bak .vercelignore || true', '恢复.vercelignore文件');
  
  if (buildSuccess) {
    console.log('✅ 模拟Vercel构建成功完成!');
    process.exit(0);
  } else {
    console.error('❌ 模拟Vercel构建失败!');
    process.exit(1);
  }
}

// 执行主函数
main().catch(error => {
  console.error('❌ 模拟Vercel构建过程出错:', error);
  process.exit(1);
}); 