/**
 * Vercel构建过程验证脚本
 * 
 * 这个脚本用于验证Vercel构建过程中的环境变量和关键设置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config();

// 获取当前脚本路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 检查关键文件是否存在
const criticalFiles = [
  'vercel.json',
  'next.config.js',
  'scripts/vercel-turso-setup.js',
  'turso_schema_fixed.sql',
];

// 环境变量
const ENV_MODE = process.env.NODE_ENV || 'development';
const IS_VERCEL = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_VERCEL === '1';
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

// 日志输出
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  let prefix = '[INFO]';
  
  switch (type) {
    case 'success': prefix = '[SUCCESS]'; break;
    case 'error': prefix = '[ERROR]'; break;
    case 'warn': prefix = '[WARNING]'; break;
    case 'debug': prefix = '[DEBUG]'; break;
  }
  
  console.log(`${timestamp} ${prefix} ${message}`);
}

// 主函数
async function verifyVercelBuild() {
  log('开始验证Vercel构建环境');
  log(`运行环境: ${ENV_MODE}`);
  log(`是否Vercel环境: ${IS_VERCEL ? '是' : '否'}`);
  
  // 检查关键环境变量
  log('检查关键环境变量...');
  log(`TURSO_DATABASE_URL=${TURSO_URL ? `${TURSO_URL.substring(0, 20)}...` : '未设置'}`, TURSO_URL ? 'success' : 'error');
  log(`TURSO_AUTH_TOKEN=${TURSO_TOKEN ? '已设置' : '未设置'}`, TURSO_TOKEN ? 'success' : 'error');
  log(`NODE_ENV=${ENV_MODE}`, 'debug');
  log(`VERCEL=${process.env.VERCEL || '未设置'}`, 'debug');
  log(`NEXT_PUBLIC_DATABASE_MODE=${process.env.NEXT_PUBLIC_DATABASE_MODE || '未设置'}`, 'debug');
  
  // 检查关键文件
  log('检查关键文件...');
  let allFilesExist = true;
  
  for (const file of criticalFiles) {
    const filePath = path.join(rootDir, file);
    const exists = fs.existsSync(filePath);
    log(`${file}: ${exists ? '存在' : '不存在'}`, exists ? 'success' : 'error');
    
    if (!exists) {
      allFilesExist = false;
    }
  }
  
  // 检查package.json中的构建命令
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const vercelBuildCommand = packageJson.scripts?.['vercel:build'];
      
      log(`package.json的vercel:build命令: ${vercelBuildCommand || '未设置'}`, 
          vercelBuildCommand ? 'success' : 'error');
          
      if (vercelBuildCommand && !vercelBuildCommand.includes('vercel-turso-setup.js')) {
        log('警告: vercel:build命令中没有包含vercel-turso-setup.js脚本', 'warn');
      }
    } catch (error) {
      log(`无法解析package.json: ${error.message}`, 'error');
    }
  } else {
    log('package.json文件不存在', 'error');
    allFilesExist = false;
  }
  
  // 检查vercel.json配置
  const vercelJsonPath = path.join(rootDir, 'vercel.json');
  if (fs.existsSync(vercelJsonPath)) {
    try {
      const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
      
      log(`vercel.json的buildCommand: ${vercelJson.buildCommand || '未设置'}`,
          vercelJson.buildCommand ? 'success' : 'error');
          
      if (vercelJson.buildCommand !== 'npm run vercel:build') {
        log('警告: vercel.json的buildCommand不是"npm run vercel:build"', 'warn');
      }
      
      log(`vercel.json的regions: ${JSON.stringify(vercelJson.regions) || '未设置'}`, 
          vercelJson.regions ? 'success' : 'warn');
          
      log(`vercel.json的环境变量:`, 'debug');
      for (const [key, value] of Object.entries(vercelJson.env || {})) {
        log(`  ${key}: ${value ? (key.includes('TOKEN') ? '已设置' : `${value.substring(0, 15)}...`) : '未设置'}`, 'debug');
      }
    } catch (error) {
      log(`无法解析vercel.json: ${error.message}`, 'error');
    }
  }
  
  // 总结
  if (allFilesExist && TURSO_URL && TURSO_TOKEN) {
    log('✅ Vercel构建环境验证通过', 'success');
    return true;
  } else {
    log('❌ Vercel构建环境验证失败，请检查上述错误', 'error');
    return false;
  }
}

// 执行验证
verifyVercelBuild()
  .then(success => {
    if (success) {
      log('✅ Vercel构建环境验证成功', 'success');
      process.exit(0);
    } else {
      log('❌ Vercel构建环境验证失败', 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`验证过程出错: ${error.message}`, 'error');
    process.exit(1);
  }); 