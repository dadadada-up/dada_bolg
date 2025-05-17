#!/usr/bin/env node

/**
 * 此脚本用于整理项目根目录下的文件
 * 将相关的配置文件整合到config目录中
 * 清理临时文件和测试文件
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 项目根目录
const ROOT_DIR = process.cwd();

// 要整理的配置文件
const configFilesToMove = [
  // 配置文件
  { file: '.babelrc', dest: 'config/babel/.babelrc' },
  { file: '.eslintrc.js', dest: 'config/eslint/.eslintrc.js' },
  { file: '.eslintrc.json', dest: 'config/eslint/.eslintrc.json' },
  { file: '.prettierrc', dest: 'config/prettier/.prettierrc' },
  { file: '.prettierrc.js', dest: 'config/prettier/.prettierrc.js' },
  { file: '.prettierrc.json', dest: 'config/prettier/.prettierrc.json' },
  { file: 'postcss.config.js', dest: 'config/postcss/postcss.config.js' },
  { file: 'tailwind.config.js', dest: 'config/tailwind/tailwind.config.js' },
  { file: 'tsconfig.json', dest: 'config/typescript/tsconfig.json' },
  { file: 'jest.config.js', dest: 'config/jest/jest.config.js' },
  { file: 'next.config.mjs', dest: 'config/next/next.config.mjs' },
  { file: 'vercel.json', dest: 'config/vercel/vercel.json' },
  
  // 测试文件
  { file: 'test.js', dest: 'scripts/utils/test.js' },
];

// 要删除的临时文件和测试文件
const filesToRemove = [
  'temp.js',
  'temp.ts',
  'temp.json',
  'tmp.js',
  'tmp.ts',
  'tmp.json',
  'demo.js',
  'demo.ts',
  'example.js',
  'example.ts',
  'debug.log',
  'TODO.md',
  'NOTES.md',
  'CHANGELOG.md'
];

// 创建符号链接以便于访问配置文件
const symlinksToCreate = [
  { from: 'config/next/next.config.mjs', to: 'next.config.mjs' },
  { from: 'config/typescript/tsconfig.json', to: 'tsconfig.json' },
  { from: 'config/postcss/postcss.config.js', to: 'postcss.config.js' },
  { from: 'config/tailwind/tailwind.config.js', to: 'tailwind.config.js' },
  { from: 'config/vercel/vercel.json', to: 'vercel.json' },
];

/**
 * 创建目录 (如果不存在)
 */
function ensureDir(dirPath) {
  const normalizedPath = path.normalize(dirPath);
  const parts = normalizedPath.split(path.sep);
  
  // 从根目录或驱动器开始
  let currentPath = parts[0] || path.sep;
  
  for (let i = 1; i < parts.length; i++) {
    currentPath = path.join(currentPath, parts[i]);
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
  }
}

/**
 * 移动文件
 */
function moveFile(source, dest) {
  if (fs.existsSync(source)) {
    // 确保目标目录存在
    ensureDir(path.dirname(dest));
    
    console.log(`移动文件: ${source} -> ${dest}`);
    
    try {
      // 首先复制文件
      fs.copyFileSync(source, dest);
      // 然后删除源文件
      fs.unlinkSync(source);
    } catch (error) {
      console.error(`移动文件 ${source} 失败:`, error);
    }
  }
}

/**
 * 创建符号链接
 */
function createSymlink(source, target) {
  const sourceAbs = path.resolve(ROOT_DIR, source);
  const targetAbs = path.resolve(ROOT_DIR, target);
  
  // 如果目标已经存在，先删除
  if (fs.existsSync(targetAbs)) {
    try {
      fs.unlinkSync(targetAbs);
    } catch (error) {
      console.error(`删除已存在的文件 ${target} 失败:`, error);
      return;
    }
  }
  
  // 确保源文件存在
  if (!fs.existsSync(sourceAbs)) {
    console.error(`源文件 ${source} 不存在，无法创建符号链接`);
    return;
  }
  
  console.log(`创建符号链接: ${target} -> ${source}`);
  
  try {
    // 在macOS和Linux上创建符号链接
    if (process.platform !== 'win32') {
      fs.symlinkSync(path.relative(path.dirname(targetAbs), sourceAbs), targetAbs);
    } else {
      // 在Windows上创建符号链接，需要管理员权限
      const targetDir = path.dirname(targetAbs);
      const relativeSource = path.relative(targetDir, sourceAbs);
      
      // 判断是文件还是目录
      const stats = fs.statSync(sourceAbs);
      const type = stats.isDirectory() ? 'dir' : 'file';
      
      execSync(`mklink ${type === 'dir' ? '/D' : ''} "${targetAbs}" "${relativeSource}"`, { shell: 'cmd.exe' });
    }
  } catch (error) {
    console.error(`创建符号链接 ${target} 失败:`, error);
    console.log('尝试创建硬链接...');
    
    try {
      // 如果符号链接失败，尝试创建硬链接
      fs.linkSync(sourceAbs, targetAbs);
    } catch (error) {
      console.error(`创建硬链接 ${target} 也失败:`, error);
      console.log('复制文件作为备选方案...');
      
      try {
        // 如果硬链接也失败，就复制文件
        fs.copyFileSync(sourceAbs, targetAbs);
      } catch (error) {
        console.error(`复制文件 ${source} 到 ${target} 失败:`, error);
      }
    }
  }
}

/**
 * 删除文件(如果存在)
 */
function removeFile(file) {
  const filePath = path.join(ROOT_DIR, file);
  
  if (fs.existsSync(filePath)) {
    console.log(`删除文件: ${file}`);
    
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`删除文件 ${file} 失败:`, error);
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('开始整理项目根目录...');
  
  // 移动配置文件到config目录
  console.log('\n1. 移动配置文件到config目录');
  for (const item of configFilesToMove) {
    moveFile(item.file, item.dest);
  }
  
  // 删除临时文件
  console.log('\n2. 删除临时文件和测试文件');
  for (const file of filesToRemove) {
    removeFile(file);
  }
  
  // 创建符号链接
  console.log('\n3. 创建符号链接');
  for (const link of symlinksToCreate) {
    createSymlink(link.from, link.to);
  }
  
  console.log('\n项目根目录整理完成！');
}

// 执行主函数
main(); 