#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const isVercel = process.env.VERCEL === '1';
const outputDir = isVercel 
  ? path.join(rootDir, '.vercel', 'output', 'static')
  : path.join(rootDir, 'out');

console.log(`开始静态构建过程...`);
console.log(`环境: ${isVercel ? 'Vercel' : '本地'}`);
console.log(`输入目录: ${publicDir}`);
console.log(`输出目录: ${outputDir}`);

async function copyDir(src, dest) {
  try {
    // 确保目标目录存在
    await fs.mkdir(dest, { recursive: true });
    
    // 读取源目录
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    // 复制文件和目录
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error(`复制目录失败: ${error.message}`);
  }
}

async function main() {
  try {
    // 确保输出目录存在
    await fs.mkdir(outputDir, { recursive: true });
    
    // 复制public目录到输出目录
    await copyDir(publicDir, outputDir);
    
    console.log('静态构建完成!');
  } catch (error) {
    console.error(`构建失败: ${error.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 