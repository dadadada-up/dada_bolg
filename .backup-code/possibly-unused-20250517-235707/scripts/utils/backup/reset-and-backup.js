#!/usr/bin/env node

/**
 * 组合脚本：重置GitHub仓库并执行备份
 * 先完全重置仓库，然后执行备份操作
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// 获取GitHub Token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// 定义脚本路径
const resetScript = join(__dirname, 'reset-github-repo.ts');
const backupScript = join(__dirname, 'backup-to-github.ts');

console.log('===== 开始执行重置并备份操作 =====');

// 确保有Token
if (!GITHUB_TOKEN) {
  console.error('错误: GitHub Token 未设置');
  console.log('请通过以下方式之一设置Token:');
  console.log('1. 设置环境变量 GITHUB_TOKEN');
  console.log('2. 在 .env.local 文件中添加 GITHUB_TOKEN=你的token');
  console.log('3. 在 .env 文件中添加 GITHUB_TOKEN=你的token');
  process.exit(1);
}

// 执行重置操作
console.log('\n🔄 步骤1: 重置GitHub仓库');
try {
  execSync(`npx ts-node ${resetScript}`, { 
    stdio: 'inherit',
    env: { ...process.env, GITHUB_TOKEN }
  });
  console.log('✅ GitHub仓库重置成功');
} catch (error) {
  console.error('❌ GitHub仓库重置失败:', error.message);
  if (error.stderr) {
    console.error('详细错误:', error.stderr.toString());
  }
  process.exit(1);
}

// 给GitHub API一点时间处理重置操作
console.log('\n⏳ 等待5秒，确保GitHub API处理完成...');
setTimeout(() => {
  // 执行备份操作
  console.log('\n📦 步骤2: 执行内容备份');
  try {
    execSync(`npx ts-node ${backupScript}`, { 
      stdio: 'inherit',
      env: { ...process.env, GITHUB_TOKEN, RESET_MODE: 'true', DEBUG_MODE: 'true' },
      timeout: 120000 // 2分钟超时
    });
    console.log('✅ 内容备份成功');
    console.log('\n🎉 全部操作完成！GitHub仓库已重置并更新了最新内容');
  } catch (error) {
    console.error('❌ 内容备份失败:', error.message);
    if (error.stderr) {
      console.error('详细错误:', error.stderr.toString());
    }
    if (error.signal === 'SIGTERM') {
      console.error('操作被终止，可能是超时导致');
    }
    process.exit(1);
  }
}, 5000); 