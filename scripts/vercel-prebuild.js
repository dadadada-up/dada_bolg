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

// 确保public目录中有404.html文件
const publicDir = path.join(rootDir, 'public');
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

// 确保项目根目录也有404.html（Vercel可能会直接从这里读取）
const rootFile404 = path.join(rootDir, '404.html');
if (!fs.existsSync(rootFile404)) {
  console.log('复制404.html到项目根目录...');
  fs.copyFileSync(file404, rootFile404);
  console.log('✅ 已复制404.html到项目根目录');
}

// 创建.vercel/output/static目录（如果还不存在）
const vercelOutputDir = path.join(rootDir, '.vercel', 'output');
const staticDir = path.join(vercelOutputDir, 'static');

if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
  console.log(`✅ 已创建目录: ${staticDir}`);
}

// 复制404.html到.vercel/output/static
const outputFile404 = path.join(staticDir, '404.html');
fs.copyFileSync(file404, outputFile404);
console.log(`✅ 已复制404.html到: ${outputFile404}`);

// 创建.vercel/output/config.json
const configFile = path.join(vercelOutputDir, 'config.json');
const config = {
  version: 3,
  routes: [
    { handle: "filesystem" },
    { src: "/(.*)", status: 404, dest: "/404.html" }
  ],
  overrides: {
    '404.html': { path: '/404.html', contentType: 'text/html; charset=utf-8' }
  }
};

fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
console.log(`✅ 已创建Vercel配置文件: ${configFile}`);

// 创建build-output.json告诉Vercel关于404.html
const buildOutputFile = path.join(vercelOutputDir, 'build-output.json');
const buildOutput = {
  routes: [
    { src: "/(.*)", status: 404, dest: "/404.html" }
  ],
  staticFilesOutputPath: "static",
  publicDirectoryPath: "public",
  buildOutputs: [
    {
      path: "404.html",
      type: "static"
    }
  ]
};

fs.writeFileSync(buildOutputFile, JSON.stringify(buildOutput, null, 2));
console.log(`✅ 已创建构建输出清单: ${buildOutputFile}`);

// 创建.vercel/output/static/404.html
const outputStaticFile404 = path.join(staticDir, '404.html');
fs.copyFileSync(file404, outputStaticFile404);
console.log(`✅ 已复制404.html到静态输出目录: ${outputStaticFile404}`);

// 直接在.vercel/output目录也放置一个404.html
const outputRootFile404 = path.join(vercelOutputDir, '404.html');
fs.copyFileSync(file404, outputRootFile404);
console.log(`✅ 已复制404.html到Vercel输出根目录: ${outputRootFile404}`);

console.log('✅ Vercel预构建脚本执行完成'); 