#!/usr/bin/env node

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  console.log(`请求: ${req.url}`);
  
  try {
    // 规范化URL并提取路径
    let path = req.url.split('?')[0];
    
    // 处理默认路径
    if (path === '/') {
      path = '/index.html';
    }
    
    // 如果路径以/结尾，添加index.html
    if (path.endsWith('/')) {
      path = path + 'index.html';
    }
    
    // 获取文件扩展名
    const ext = extname(path);
    
    // 构建文件系统路径
    const filePath = join(publicDir, path);
    
    // 读取文件
    const content = await readFile(filePath);
    
    // 设置内容类型
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // 返回响应
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
    
  } catch (error) {
    console.error(`错误: ${error.message}`);
    
    // 尝试返回404页面
    try {
      const content = await readFile(join(publicDir, '404.html'));
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch (e) {
      // 如果没有404页面，返回简单的错误消息
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`静态服务器运行在 http://localhost:${PORT}`);
}); 