/**
 * Next.js适配器脚本
 * 确保Next.js构建过程正确处理自定义路由和404页面
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Vercel输出目录
const vercelOutputDir = path.join(rootDir, '.vercel', 'output');
const staticDir = path.join(vercelOutputDir, 'static');
const configFile = path.join(vercelOutputDir, 'config.json');

/**
 * 确保Vercel输出目录中存在404.html
 */
function ensure404Page() {
  console.log('开始处理404页面...');
  
  // 检查Vercel输出目录是否存在
  if (!fs.existsSync(vercelOutputDir)) {
    fs.mkdirSync(vercelOutputDir, { recursive: true });
    console.log(`创建了Vercel输出目录: ${vercelOutputDir}`);
  }
  
  // 检查static目录是否存在
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
    console.log(`创建了static输出目录: ${staticDir}`);
  }
  
  // 检查public目录中是否有404.html
  const publicDir = path.join(rootDir, 'public');
  const source404 = path.join(publicDir, '404.html');
  const target404 = path.join(staticDir, '404.html');
  
  if (fs.existsSync(source404)) {
    console.log(`找到404.html，复制到输出目录...`);
    fs.copyFileSync(source404, target404);
    console.log(`✅ 已复制404.html到: ${target404}`);
  } else {
    console.log('⚠️ 公共目录中没有找到404.html，创建一个基本的404页面');
    
    // 创建一个基本的404页面
    const basic404 = `<!DOCTYPE html>
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
    
    fs.writeFileSync(target404, basic404);
    console.log('✅ 已创建基本的404.html页面');
  }
  
  // 创建或更新config.json
  let config = {
    version: 3,
    routes: [
      { handle: "filesystem" },
      { src: "/(.*)", status: 404, dest: "/404.html" }
    ],
    overrides: {
      '404.html': { path: '/404.html', contentType: 'text/html; charset=utf-8' }
    }
  };
  
  // 如果已存在配置文件，读取并合并配置
  if (fs.existsSync(configFile)) {
    try {
      const existingConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      config = { ...existingConfig, ...config };
      console.log('合并了现有的配置文件');
    } catch (error) {
      console.error(`读取配置文件失败: ${error.message}`);
    }
  }
  
  // 写入配置文件
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  console.log(`✅ 已创建/更新Vercel配置: ${configFile}`);
}

// 执行适配器函数
ensure404Page();
console.log('Next.js适配器脚本执行完成'); 