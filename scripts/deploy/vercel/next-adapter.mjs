/**
 * Next.js构建后适配脚本
 * 用于处理构建后的文件，确保在Vercel环境中正确运行
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('执行Next.js构建后适配脚本...');
console.log(`当前工作目录: ${process.cwd()}`);
console.log(`脚本位置: ${__filename}`);
console.log(`根目录: ${rootDir}`);

// 确保.next/standalone目录存在
const standaloneDir = path.join(rootDir, '.next/standalone');
if (!fs.existsSync(standaloneDir)) {
  console.log('创建.next/standalone目录...');
  fs.mkdirSync(standaloneDir, { recursive: true });
}

// 确保.next/static目录存在
const staticDir = path.join(rootDir, '.next/static');
if (!fs.existsSync(staticDir)) {
  console.log('创建.next/static目录...');
  fs.mkdirSync(staticDir, { recursive: true });
}

// 创建一个空的package.json文件，以避免SQLite相关依赖的问题
const packageJsonPath = path.join(standaloneDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.log('创建空的package.json文件...');
  fs.writeFileSync(packageJsonPath, JSON.stringify({
    name: "dada-blog-standalone",
    version: "1.0.0",
    private: true,
    dependencies: {}
  }, null, 2));
}

// 创建一个空的node_modules目录，以避免SQLite相关依赖的问题
const nodeModulesDir = path.join(standaloneDir, 'node_modules');
if (!fs.existsSync(nodeModulesDir)) {
  console.log('创建空的node_modules目录...');
  fs.mkdirSync(nodeModulesDir, { recursive: true });
}

// 确保public目录中的文件被复制到standalone目录
const publicDir = path.join(rootDir, 'public');
const standalonePublicDir = path.join(standaloneDir, 'public');
if (fs.existsSync(publicDir)) {
  console.log('复制public目录到standalone目录...');
  if (!fs.existsSync(standalonePublicDir)) {
    fs.mkdirSync(standalonePublicDir, { recursive: true });
  }
  
  // 复制public目录中的所有文件
  const files = fs.readdirSync(publicDir);
  for (const file of files) {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(standalonePublicDir, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      // 如果是目录，递归复制
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      // 如果是文件，直接复制
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('✅ Next.js构建后适配脚本执行完成'); 