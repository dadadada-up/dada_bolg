#!/usr/bin/env node

/**
 * 此脚本用于检测重复功能的API路由
 * 它会扫描src/app/api目录下的所有路由，并根据路由名称和内容分析可能的重复项
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

// 可能重复的功能前缀
const possibleDuplicatePrefixes = [
  ['post', 'posts', 'article', 'articles'],
  ['tag', 'tags'],
  ['category', 'categories'],
  ['sync', 'synchronize'],
  ['cache', 'caching'],
  ['init', 'initialize'],
  ['backup', 'backups'],
  ['admin', 'dashboard'],
  ['image', 'images', 'media'],
  ['auth', 'authentication', 'login']
];

// API路径
const API_PATH = path.join(process.cwd(), 'src', 'app', 'api');

// 路由信息存储
const routes = [];

/**
 * 扫描API目录
 */
async function scanApiDirectory(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        // 如果是目录，递归扫描
        await scanApiDirectory(fullPath);
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        // 如果是路由文件，添加到路由列表
        const relativePath = path.relative(API_PATH, directory);
        const content = await readFile(fullPath, 'utf8');
        
        routes.push({
          path: relativePath,
          file: fullPath,
          content: content,
          methods: extractHttpMethods(content)
        });
      }
    }
  } catch (error) {
    console.error(`扫描路径 ${directory} 出错:`, error);
  }
}

/**
 * 从路由文件中提取HTTP方法
 */
function extractHttpMethods(content) {
  const methods = [];
  
  if (content.includes('export async function GET') || content.includes('export const GET')) {
    methods.push('GET');
  }
  if (content.includes('export async function POST') || content.includes('export const POST')) {
    methods.push('POST');
  }
  if (content.includes('export async function PUT') || content.includes('export const PUT')) {
    methods.push('PUT');
  }
  if (content.includes('export async function DELETE') || content.includes('export const DELETE')) {
    methods.push('DELETE');
  }
  if (content.includes('export async function PATCH') || content.includes('export const PATCH')) {
    methods.push('PATCH');
  }
  
  return methods;
}

/**
 * 检查可能重复的路由
 */
function findPotentialDuplicates() {
  const potentialDuplicates = [];
  
  // 按前缀分组，检查可能重复的功能
  for (const prefixGroup of possibleDuplicatePrefixes) {
    const matchingRoutes = [];
    
    for (const route of routes) {
      const routeParts = route.path.split('/');
      
      for (const prefix of prefixGroup) {
        if (routeParts.some(part => part.toLowerCase().includes(prefix.toLowerCase()))) {
          matchingRoutes.push(route);
          break;
        }
      }
    }
    
    if (matchingRoutes.length > 1) {
      potentialDuplicates.push({
        group: prefixGroup.join('/'),
        routes: matchingRoutes
      });
    }
  }
  
  return potentialDuplicates;
}

/**
 * 主函数
 */
async function main() {
  console.log('开始扫描API路由...');
  await scanApiDirectory(API_PATH);
  console.log(`共找到 ${routes.length} 个API路由`);
  
  const duplicates = findPotentialDuplicates();
  
  if (duplicates.length > 0) {
    console.log('\n可能重复的API路由:');
    
    for (const group of duplicates) {
      console.log(`\n功能组: ${group.group}`);
      console.log('------------------------------');
      
      for (const route of group.routes) {
        console.log(`- ${route.path} [${route.methods.join(', ')}]`);
      }
    }
    
    console.log('\n建议:');
    console.log('1. 仔细检查上述路由是否确实有重复功能');
    console.log('2. 考虑合并功能相似的路由');
    console.log('3. 确保使用一致的API命名规范');
  } else {
    console.log('未发现可能重复的API路由');
  }
}

// 执行主函数
main().catch(error => {
  console.error('发生错误:', error);
  process.exit(1);
}); 