#!/usr/bin/env node

/**
 * API路径更新脚本
 * 此脚本用于将前端代码中的旧API路径(/api/posts, /api/categories, /api/dashboard)
 * 更新为新API路径(/api/posts-new, /api/categories-new, /api/dashboard-new)
 * 
 * 使用方法：node scripts/update-api-routes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// 要搜索的目录
const searchDirs = [
  path.join(rootDir, 'src', 'app'),
  path.join(rootDir, 'src', 'components'),
  path.join(rootDir, 'src', 'lib')
];

// 要替换的路径映射
const routeMappings = [
  { from: '/api/posts', to: '/api/posts-new' },
  { from: '/api/categories', to: '/api/categories-new' },
  { from: '/api/dashboard', to: '/api/dashboard-new' }
];

// 处理的文件类型
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

// 统计信息
let filesScanned = 0;
let filesUpdated = 0;
let totalReplacements = 0;

// 递归搜索目录
function searchDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 递归搜索子目录
      searchDirectory(fullPath);
    } else if (stat.isFile() && fileExtensions.includes(path.extname(file))) {
      // 处理文件
      const replacements = processFile(fullPath);
      
      if (replacements > 0) {
        console.log(`更新了文件: ${fullPath} (${replacements}处替换)`);
        filesUpdated++;
        totalReplacements += replacements;
      }
      
      filesScanned++;
    }
  }
}

// 处理单个文件
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;
  
  // 对每个路径映射进行替换
  for (const mapping of routeMappings) {
    const regex = new RegExp(mapping.from.replace(/\//g, '\\/') + '(?![\\w-])', 'g');
    const newContent = content.replace(regex, mapping.to);
    
    if (newContent !== content) {
      replacements += (content.match(regex) || []).length;
      content = newContent;
    }
  }
  
  // 如果有替换，写回文件
  if (replacements > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  return replacements;
}

// 主函数
function main() {
  console.log('开始更新API路径...');
  
  try {
    // 搜索并处理每个目录
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        searchDirectory(dir);
      }
    }
    
    console.log('\n更新完成!');
    console.log(`扫描文件数: ${filesScanned}`);
    console.log(`更新文件数: ${filesUpdated}`);
    console.log(`总替换次数: ${totalReplacements}`);
    
    if (filesUpdated > 0) {
      console.log('\n注意：已更新前端代码中的API路径。请确保：');
      console.log('1. 测试确认所有API请求能正常工作');
      console.log('2. 当确认所有功能正常后，可以将API端点重命名（去掉-new后缀）');
    }
  } catch (error) {
    console.error('更新过程中出错:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 