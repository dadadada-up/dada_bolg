/**
 * 准备静态文件脚本
 * 此脚本用于为Vercel部署准备必要的静态文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 目录路径
const publicDir = path.join(rootDir, 'public');
const imagesDir = path.join(publicDir, 'images');
const staticDir = path.join(imagesDir, 'static');

// 确保目录存在
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`创建目录: ${dir}`);
  }
};

// 复制文件
const copyFile = (src, dest) => {
  try {
    const content = fs.readFileSync(src);
    fs.writeFileSync(dest, content);
    console.log(`复制文件: ${path.basename(src)} → ${dest}`);
  } catch (error) {
    console.error(`复制文件失败 ${src}: ${error.message}`);
  }
};

// 创建文本文件
const createTextFile = (dest, content) => {
  try {
    fs.writeFileSync(dest, content);
    console.log(`创建文件: ${dest}`);
  } catch (error) {
    console.error(`创建文件失败 ${dest}: ${error.message}`);
  }
};

// 主函数
function main() {
  console.log('开始准备静态文件...');
  
  // 确保目录存在
  ensureDir(publicDir);
  ensureDir(imagesDir);
  ensureDir(staticDir);
  
  // 创建索引模板文件
  if (!fs.existsSync(path.join(publicDir, 'index-template.html'))) {
    createTextFile(path.join(publicDir, 'index-template.html'), `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dada Blog - 加载中</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
      background-color: #f8f9fa;
    }
    h1 { color: #2563eb; }
    .loader {
      width: 50px;
      height: 50px;
      border: 5px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader"></div>
  <h1>Dada Blog</h1>
  <p>Next.js应用正在加载中，请稍候...</p>
  <script>setTimeout(() => window.location.reload(), 5000);</script>
</body>
</html>
    `);
  }
  
  // 创建简单的SVG占位图
  const defaultImages = [
    { name: 'blog-default.jpg', color: '#3B82F6' },
    { name: 'get-started.jpg', color: '#22C55E' },
    { name: 'database.jpg', color: '#F59E0B' },
    { name: 'vercel.jpg', color: '#000000' },
    { name: 'responsive.jpg', color: '#8B5CF6' },
    { name: 'seo.jpg', color: '#EC4899' },
    { name: 'og-image.jpg', color: '#2563EB' }
  ];
  
  // 创建SVG占位图
  defaultImages.forEach(({ name, color }) => {
    const svgContent = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${color}" />
  <text x="600" y="315" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dominant-baseline="middle">
    ${name.replace('.jpg', '')}
  </text>
</svg>`;
    
    createTextFile(path.join(imagesDir, `${name}.svg`), svgContent);
    createTextFile(path.join(staticDir, `${name}.svg`), svgContent);
    
    // 创建一个简单的JPG占位文件（非真实JPG，只是文本）
    if (!fs.existsSync(path.join(imagesDir, name))) {
      createTextFile(path.join(imagesDir, name), `This is a placeholder for ${name}. Replace with a real JPG file.`);
    }
    if (!fs.existsSync(path.join(staticDir, name))) {
      createTextFile(path.join(staticDir, name), `This is a placeholder for ${name}. Replace with a real JPG file.`);
    }
  });
  
  // 创建占位文本文件
  createTextFile(path.join(staticDir, 'dummy.txt'), '这是占位文件，用于确保目录存在。');
  
  console.log('静态文件准备完成！');
}

// 执行主函数
main(); 