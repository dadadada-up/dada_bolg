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

console.log('执行Next.js适配器脚本...');

// 确保.next/server/pages目录中有404.html
const nextServerPagesDir = path.join(rootDir, '.next', 'server', 'pages');
if (fs.existsSync(nextServerPagesDir)) {
  const source404 = path.join(rootDir, 'public', '404.html');
  const target404 = path.join(nextServerPagesDir, '404.html');
  
  if (fs.existsSync(source404) && !fs.existsSync(target404)) {
    console.log(`复制404.html到Next.js服务器页面目录...`);
    
    // 确保目录存在
    if (!fs.existsSync(path.dirname(target404))) {
      fs.mkdirSync(path.dirname(target404), { recursive: true });
    }
    
    fs.copyFileSync(source404, target404);
    console.log(`✅ 已复制404.html到: ${target404}`);
  }
}

// 创建或更新.vercel/output/config.json
const vercelOutputDir = path.join(rootDir, '.vercel', 'output');
if (!fs.existsSync(vercelOutputDir)) {
  fs.mkdirSync(vercelOutputDir, { recursive: true });
}

const configFile = path.join(vercelOutputDir, 'config.json');
const config = {
  version: 3,
  routes: [
    { handle: "filesystem" },
    { src: "/(.*)", status: 404, dest: "/404.html" }
  ]
};

fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
console.log(`✅ 已创建Vercel配置文件: ${configFile}`);

console.log('Next.js适配器脚本执行完成'); 