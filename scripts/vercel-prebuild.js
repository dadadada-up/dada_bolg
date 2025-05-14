#!/usr/bin/env node

// Vercel预构建脚本 - 检测环境和设置

console.log('=== VERCEL 预构建检查 ===');
console.log(`当前环境: ${process.env.VERCEL ? '✅ VERCEL' : '❌ 非VERCEL'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || '未定义'}`);
console.log(`运行路径: ${process.cwd()}`);
console.log(`Node版本: ${process.version}`);
console.log(`平台: ${process.platform}`);

// 手动设置环境变量
process.env.NEXT_PUBLIC_IS_VERCEL = '1';
process.env.IS_VERCEL = '1';
process.env.VERCEL_ENV = process.env.VERCEL_ENV || 'production';

console.log('\n=== 环境变量设置 ===');
console.log(`NEXT_PUBLIC_IS_VERCEL: ${process.env.NEXT_PUBLIC_IS_VERCEL}`);
console.log(`IS_VERCEL: ${process.env.IS_VERCEL}`);
console.log(`VERCEL_ENV: ${process.env.VERCEL_ENV}`);

// 创建输出目录
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = path.join(__dirname, '..');
const outputDir = path.join(rootDir, '.vercel/output/static');

if (!fs.existsSync(outputDir)) {
  console.log(`创建输出目录: ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('\n预构建检查完成，准备进行静态构建...'); 