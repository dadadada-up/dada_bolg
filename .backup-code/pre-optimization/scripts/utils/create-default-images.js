/**
 * 创建默认图片脚本
 * 此脚本用于生成博客所需的默认图片
 * 
 * 注意：此脚本需要canvas包支持，如果无法安装canvas，
 * 请使用prepare-static-files.js脚本创建简单的SVG占位图
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const IMAGES_DIR = path.join(rootDir, 'public', 'images');

// 确保图片目录存在
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log(`创建目录: ${IMAGES_DIR}`);
}

// 创建简单的SVG图片（不依赖canvas）
function createSvgImage(filename, width, height, bgColor, text) {
  const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${bgColor}" />
  <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dominant-baseline="middle">
    ${text}
  </text>
</svg>`;

  const svgFilename = filename.replace(/\.(jpg|png)$/, '.svg');
  fs.writeFileSync(path.join(IMAGES_DIR, svgFilename), svgContent);
  console.log(`创建SVG图片: ${svgFilename}`);
  
  // 创建一个简单的占位文本文件，代替实际的JPG
  fs.writeFileSync(
    path.join(IMAGES_DIR, filename), 
    `This is a placeholder for ${filename}. In production, this would be a real image file.`
  );
  console.log(`创建占位图片: ${filename}`);
}

// 创建默认博客图片
createSvgImage('blog-default.jpg', 1200, 630, '#3B82F6', 'Dada Blog');

// 创建其他图片
createSvgImage('get-started.jpg', 1200, 630, '#22C55E', 'Getting Started');
createSvgImage('database.jpg', 1200, 630, '#F59E0B', 'Database');
createSvgImage('vercel.jpg', 1200, 630, '#000000', 'Vercel');
createSvgImage('responsive.jpg', 1200, 630, '#8B5CF6', 'Responsive Design');
createSvgImage('seo.jpg', 1200, 630, '#EC4899', 'SEO');

// 创建OG图片
createSvgImage('og-image.jpg', 1200, 630, '#2563EB', 'Dada Blog');

console.log('所有默认图片已创建完成'); 