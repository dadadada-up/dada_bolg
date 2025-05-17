/**
 * Vercel部署前准备脚本
 * 确保Vercel部署环境正确识别404.html和其他必要的静态文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('执行Vercel预构建脚本...');
console.log(`当前工作目录: ${process.cwd()}`);
console.log(`脚本位置: ${__filename}`);
console.log(`根目录: ${rootDir}`);

// 检查环境变量
console.log('检查环境变量...');
const requiredEnvVars = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`警告: 缺少以下环境变量: ${missingVars.join(', ')}`);
  console.warn('请在Vercel项目设置中添加这些环境变量');
}

// 确保public目录存在
const publicDir = path.join(rootDir, 'public');
if (!fs.existsSync(publicDir)) {
  console.log('创建public目录...');
  fs.mkdirSync(publicDir, { recursive: true });
}

// 确保public目录中有404.html文件
const file404 = path.join(publicDir, '404.html');

if (!fs.existsSync(file404)) {
  console.log('创建public/404.html文件...');
  
  const html404 = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面未找到 - Dada Blog</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      margin-bottom: 1rem;
    }
    .back-link {
      display: inline-block;
      margin-top: 1rem;
      color: #0070f3;
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404 - 页面未找到</h1>
    <p>您访问的页面不存在或已被移除。</p>
    <a href="/" class="back-link">返回首页</a>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(file404, html404);
  console.log('✅ 已创建public/404.html文件');
}

// 确保项目根目录也有404.html
const rootFile404 = path.join(rootDir, '404.html');
if (!fs.existsSync(rootFile404)) {
  console.log('复制404.html到项目根目录...');
  fs.copyFileSync(file404, rootFile404);
  console.log('✅ 已复制404.html到项目根目录');
}

// 确保.next目录存在（可能在首次构建时不存在）
const nextDir = path.join(rootDir, '.next');
if (!fs.existsSync(nextDir)) {
  console.log('创建.next目录...');
  fs.mkdirSync(nextDir, { recursive: true });
}

console.log('✅ Vercel预构建脚本执行完成'); 