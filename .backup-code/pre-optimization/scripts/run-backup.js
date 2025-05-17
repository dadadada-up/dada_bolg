#!/usr/bin/env node

/**
 * 执行博客备份脚本
 * 这个脚本通过npx ts-node运行TypeScript备份脚本
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// 获取GitHub Token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// 确保有Token
if (!GITHUB_TOKEN) {
  console.error('❌ GitHub Token未设置');
  console.log('请设置GITHUB_TOKEN环境变量或在.env.local文件中添加GITHUB_TOKEN');
  process.exit(1);
}

// 定义备份脚本路径
const backupScript = join(__dirname, 'backup-to-github.ts');

console.log('开始执行博客备份...');
console.log(`GITHUB_TOKEN长度: ${GITHUB_TOKEN.length}`);
console.log(`脚本路径: ${backupScript}`);

// 设置超时
const TIMEOUT = 120000; // 2分钟超时
console.log(`设置超时: ${TIMEOUT / 1000}秒`);

const timeoutId = setTimeout(() => {
  console.error('❌ 备份操作超时！');
  process.exit(1);
}, TIMEOUT);

try {
  console.log('\n执行备份脚本...');
  execSync(`npx ts-node ${backupScript}`, {
    stdio: 'inherit',
    env: { 
      ...process.env, 
      GITHUB_TOKEN,
      DEBUG_MODE: 'true' // 启用调试模式
    },
    timeout: TIMEOUT - 5000 // 留5秒给我们处理
  });
  console.log('✅ 备份成功完成!');
  clearTimeout(timeoutId);
} catch (error) {
  clearTimeout(timeoutId);
  console.error('❌ 备份失败:', error.message);
  
  if (error.stderr) {
    console.error('错误详情:', error.stderr.toString());
  }
  
  if (error.signal === 'SIGTERM') {
    console.error('操作被终止，可能是超时导致');
  }
  
  process.exit(1);
} 