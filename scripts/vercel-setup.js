/**
 * Vercel部署前设置脚本
 * 此脚本在Vercel构建时运行，确保环境正确设置
 */

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Vercel部署前准备开始...');

// 设置环境变量标记
process.env.VERCEL = '1';
process.env.IS_VERCEL = '1';
process.env.NEXT_PUBLIC_IS_VERCEL = '1';

// 检查Turso配置
if (!process.env.TURSO_DATABASE_URL) {
  console.error('❌ 错误: 未设置TURSO_DATABASE_URL环境变量');
  console.error('请在Vercel项目设置中配置此环境变量');
  process.exit(1);
}

if (!process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ 错误: 未设置TURSO_AUTH_TOKEN环境变量');
  console.error('请在Vercel项目设置中配置此环境变量');
  process.exit(1);
}

// 确保网站URL正确设置
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn('⚠️ 警告: 未设置NEXT_PUBLIC_SITE_URL环境变量');
  console.warn('将使用默认值: https://dada-blog.vercel.app');
  process.env.NEXT_PUBLIC_SITE_URL = 'https://dada-blog.vercel.app';
}

// 准备静态文件
console.log('📁 准备静态文件...');

// 确保public/images目录存在
const publicImagesDir = path.join(rootDir, 'public', 'images');
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
  console.log(`✅ 创建目录: ${publicImagesDir}`);
}

// 运行其他准备工作，例如准备静态文件
try {
  // 生成占位SVG图片
  const createPlaceholderSvg = (name, color) => {
    const svgContent = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${color}" />
  <text x="600" y="315" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dominant-baseline="middle">
    ${name}
  </text>
</svg>`;
    
    const svgPath = path.join(publicImagesDir, `${name}.svg`);
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✅ 创建SVG: ${svgPath}`);
  };
  
  // 创建常用图片的占位图
  createPlaceholderSvg('blog-default', '#3B82F6');
  createPlaceholderSvg('og-image', '#2563EB');
} catch (error) {
  console.error('❌ 静态文件准备出错:', error);
}

// 输出环境信息
console.log('📊 环境信息:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL}`);
console.log(`- TURSO_DATABASE_URL: ${process.env.TURSO_DATABASE_URL ? '已设置' : '未设置'}`);
console.log(`- TURSO_AUTH_TOKEN: ${process.env.TURSO_AUTH_TOKEN ? '已设置' : '未设置'}`);

console.log('✅ Vercel部署前准备完成!');

// 导出配置，可供其他模块使用
export const config = {
  isVercel: true,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  tursoEnabled: !!process.env.TURSO_DATABASE_URL && !!process.env.TURSO_AUTH_TOKEN
}; 