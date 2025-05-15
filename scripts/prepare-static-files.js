/**
 * 在Vercel构建阶段准备静态文件的脚本
 * 当Turso数据库配置不可用时，作为备选方案提供静态页面
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 输出目录配置
const outputDir = path.join(rootDir, '.vercel', 'output', 'static');
const publicDir = path.join(rootDir, 'public');
const staticAssetsDir = path.join(outputDir, '_next', 'static');

// 只有在没有配置Turso或者明确请求静态构建时才执行静态构建
const shouldUseStaticFallback = process.env.USE_STATIC_FALLBACK === 'true' || 
                               (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN);

// 定义复制文件的函数
function copyFileSync(source, target) {
  // 确保目标文件夹存在
  const targetDir = path.dirname(target);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // 复制文件
  fs.copyFileSync(source, target);
}

// 定义递归复制目录的函数
function copyDirSync(source, target) {
  // 创建目标目录
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  // 读取源目录内容
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  // 遍历源目录中的每个条目
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(target, entry.name);
    
    if (entry.isDirectory()) {
      // 递归复制子目录
      copyDirSync(srcPath, destPath);
    } else {
      // 复制文件
      copyFileSync(srcPath, destPath);
    }
  }
}

// 主函数
async function main() {
  console.log('准备Vercel部署文件...');
  
  // 检查环境
  console.log(`当前环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`是否在Vercel环境: ${process.env.VERCEL ? 'true' : 'false'}`);
  console.log(`使用静态部署备选方案: ${shouldUseStaticFallback ? 'true' : 'false'}`);
  
  if (!shouldUseStaticFallback) {
    console.log('✅ 检测到Turso数据库配置，将使用正常Next.js构建流程');
    return;
  }
  
  console.log('⚠️ 未检测到Turso数据库配置，将使用静态部署备选方案');

  // 创建.vercel/output目录（如果不存在）
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 创建静态HTML页面
  console.log('正在生成静态HTML页面...');

  try {
    execSync('node scripts/generate-static-pages.js', { 
      stdio: 'inherit',
      cwd: rootDir 
    });
    console.log('✅ 静态页面生成成功');
  } catch (error) {
    console.error('❌ 静态页面生成失败:', error);
    process.exit(1);
  }
  
  // 将public目录下的所有文件复制到输出目录
  console.log(`正在复制public目录内容到 ${outputDir}...`);
  copyDirSync(publicDir, outputDir);
  console.log('✅ 复制完成');
  
  // 创建.vercel/output/config.json文件
  console.log('正在创建Vercel配置文件...');
  
  const vercelConfig = {
    version: 3,
    routes: [
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/404.html" }
    ],
    overrides: {
      '404.html': { path: '/404.html', contentType: 'text/html; charset=utf-8' }
    }
  };
  
  fs.writeFileSync(
    path.join(rootDir, '.vercel', 'output', 'config.json'),
    JSON.stringify(vercelConfig, null, 2)
  );
  
  console.log('✅ 配置文件创建成功');
  console.log('✅ 静态部署准备完成');
}

// 执行主函数
main().catch(error => {
  console.error('❌ 构建过程出错:', error);
  process.exit(1);
}); 