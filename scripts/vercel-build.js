#!/usr/bin/env node

console.log('启动Vercel专用构建脚本...');
console.log('=== 禁用Next.js构建过程 ===');

// 导入核心模块
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = path.join(__dirname, '..');

// 日志函数
function log(message) {
  console.log(`[VERCEL BUILD] ${message}`);
}

// 执行子脚本
function runScript(scriptPath) {
  log(`执行脚本: ${scriptPath}`);
  const result = spawnSync('node', [scriptPath], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env
  });
  
  if (result.status !== 0) {
    throw new Error(`脚本执行失败: ${scriptPath}`);
  }
  
  return result;
}

async function vercelBuild() {
  try {
    log('开始执行纯静态部署流程');
    
    // 0. 运行预构建脚本
    log('执行预构建检查...');
    runScript('scripts/vercel-prebuild.js');

    // 1. 生成静态页面
    log('生成静态页面...');
    runScript('scripts/generate-static-pages.js');
    
    // 2. 复制静态资源
    log('复制静态资源...');
    runScript('scripts/static-build.js');

    // 3. 创建空的.nojekyll文件(防止GitHub Pages处理下划线文件)
    const nojekyllPath = path.join(rootDir, 'public', '.nojekyll');
    await fs.writeFile(nojekyllPath, '');
    log('创建.nojekyll文件');
    
    // 4. 确保有404页面
    const notFoundPath = path.join(rootDir, 'public', '404.html');
    try {
      await fs.access(notFoundPath);
      log('404页面已存在');
    } catch (error) {
      log('创建默认404页面');
      const defaultNotFoundContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面未找到 - Dada Blog</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
      await fs.writeFile(notFoundPath, defaultNotFoundContent);
    }

    log('静态部署流程完成');
  } catch (error) {
    console.error('构建过程中出错:', error);
    process.exit(1);
  }
}

vercelBuild(); 