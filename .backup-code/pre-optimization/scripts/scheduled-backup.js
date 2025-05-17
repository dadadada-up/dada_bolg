/**
 * 定时备份脚本
 * 可以通过系统的cron或node-cron定期执行此脚本
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// 获取项目根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

function runBackup() {
  console.log('开始执行定时备份...');
  
  try {
    execSync('npm run backup-to-github', {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    
    console.log('定时备份成功完成!');
  } catch (error) {
    console.error('定时备份失败:', error);
  }
}

// 执行备份
runBackup(); 