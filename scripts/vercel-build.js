#!/usr/bin/env node

/**
 * Vercel构建脚本
 * 运行Next.js构建之前的准备工作并执行构建
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 使用promisify将exec转换为Promise形式
const execAsync = promisify(exec);

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
  console.log('🏗️ 开始Vercel构建过程');
  console.log('📂 当前目录:', rootDir);
  
  // 准备环境
  await runCommand('node scripts/vercel-setup.js', '初始化环境');
  
  // 准备静态文件
  await runCommand('node scripts/prepare-static-files.js', '准备静态文件');
  
  // 执行Next.js构建
  const buildSuccess = await runCommand('next build', '执行Next.js构建');
  
  if (buildSuccess) {
    console.log('✅ Vercel构建成功完成!');
    process.exit(0);
  } else {
    console.error('❌ Vercel构建失败!');
    process.exit(1);
  }
}

// 执行主函数
main().catch(error => {
  console.error('❌ Vercel构建过程出错:', error);
  process.exit(1);
}); 