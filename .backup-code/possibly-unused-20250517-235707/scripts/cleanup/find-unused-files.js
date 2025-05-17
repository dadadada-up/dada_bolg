#!/usr/bin/env node

/**
 * 此脚本用于检测项目中可能未被使用的文件
 * 它通过分析导入语句和引用来确定哪些文件没有被项目中的其他文件引用
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

// 项目根目录
const ROOT_DIR = process.cwd();

// 要扫描的目录
const SCAN_DIRS = ['src', 'scripts'];

// 要排除的目录
const EXCLUDE_DIRS = ['node_modules', '.git', '.next', '.vercel', 'public'];

// 要扫描的文件扩展名
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];

// 保存所有找到的文件
const allFiles = [];

// 保存所有导入的文件路径
const imports = new Set();

// 特殊文件 - 这些文件通常不会被直接导入，但是很重要
const specialFiles = [
  'next.config.js',
  'next.config.mjs',
  'package.json',
  'tsconfig.json',
  'postcss.config.js',
  'tailwind.config.js',
  '.babelrc',
  '.eslintrc',
  'src/app/layout.tsx',
  'src/app/page.tsx'
];

/**
 * 扫描目录
 */
async function scanDirectory(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      // 排除某些目录
      if (EXCLUDE_DIRS.includes(entry.name)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        // 递归扫描子目录
        await scanDirectory(fullPath);
      } else {
        const ext = path.extname(entry.name);
        if (FILE_EXTENSIONS.includes(ext)) {
          const relativePath = path.relative(ROOT_DIR, fullPath);
          allFiles.push({ path: relativePath, fullPath });
        }
      }
    }
  } catch (error) {
    console.error(`扫描目录 ${directory} 出错:`, error);
  }
}

/**
 * 检测文件中的导入语句
 */
async function detectImports() {
  for (const file of allFiles) {
    try {
      const content = await readFile(file.fullPath, 'utf8');
      
      // 正则表达式匹配常见的导入语法
      const importPatterns = [
        // ES6 import
        /(?:import|export)\s+(?:.+\s+from\s+)?['"]([^'"]+)['"]/g,
        // require
        /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        // dynamic import
        /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
      ];
      
      for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          let importPath = match[1];
          
          // 处理相对路径导入
          if (importPath.startsWith('.')) {
            const dir = path.dirname(file.fullPath);
            let resolvedPath = path.resolve(dir, importPath);
            
            // 处理没有扩展名的导入
            if (!path.extname(resolvedPath)) {
              for (const ext of FILE_EXTENSIONS) {
                const withExt = `${resolvedPath}${ext}`;
                if (fs.existsSync(withExt)) {
                  resolvedPath = withExt;
                  break;
                }
                // 检查索引文件
                const withIndex = path.join(resolvedPath, `index${ext}`);
                if (fs.existsSync(withIndex)) {
                  resolvedPath = withIndex;
                  break;
                }
              }
            }
            
            imports.add(path.relative(ROOT_DIR, resolvedPath));
          } else if (importPath.startsWith('@/')) {
            // 处理别名导入 (@/...)
            importPath = importPath.replace('@/', '');
            let resolvedPath = path.join(ROOT_DIR, 'src', importPath);
            
            // 处理没有扩展名的导入
            if (!path.extname(resolvedPath)) {
              for (const ext of FILE_EXTENSIONS) {
                const withExt = `${resolvedPath}${ext}`;
                if (fs.existsSync(withExt)) {
                  resolvedPath = withExt;
                  break;
                }
                // 检查索引文件
                const withIndex = path.join(resolvedPath, `index${ext}`);
                if (fs.existsSync(withIndex)) {
                  resolvedPath = withIndex;
                  break;
                }
              }
            }
            
            imports.add(path.relative(ROOT_DIR, resolvedPath));
          }
        }
      }
    } catch (error) {
      console.error(`分析文件 ${file.path} 时出错:`, error);
    }
  }
}

/**
 * 检查API路由
 */
function isApiRoute(filePath) {
  return (
    filePath.includes('/api/') && 
    (filePath.endsWith('/route.js') || filePath.endsWith('/route.ts'))
  );
}

/**
 * 检查页面文件
 */
function isPageFile(filePath) {
  const basename = path.basename(filePath);
  return (
    basename === 'page.tsx' || 
    basename === 'page.jsx' || 
    basename === 'page.js' || 
    basename === 'layout.tsx' || 
    basename === 'layout.jsx' || 
    basename === 'layout.js' ||
    basename === 'loading.tsx' ||
    basename === 'error.tsx' ||
    basename === 'not-found.tsx'
  );
}

/**
 * 主函数
 */
async function main() {
  console.log('开始扫描项目文件...');
  
  // 扫描指定目录
  for (const dir of SCAN_DIRS) {
    await scanDirectory(path.join(ROOT_DIR, dir));
  }
  
  console.log(`共找到 ${allFiles.length} 个代码文件`);
  
  // 检测导入
  await detectImports();
  
  // 查找未使用的文件
  const unusedFiles = [];
  
  for (const file of allFiles) {
    // 跳过特殊文件
    if (specialFiles.some(special => file.path.endsWith(special))) {
      continue;
    }
    
    // API路由和页面文件通常不会被导入，但会被Next.js直接使用
    if (isApiRoute(file.path) || isPageFile(file.path)) {
      continue;
    }
    
    // 如果文件没有被导入，则认为是未使用的
    if (!imports.has(file.path)) {
      unusedFiles.push(file);
    }
  }
  
  // 输出结果
  if (unusedFiles.length > 0) {
    console.log('\n可能未使用的文件:');
    
    // 按目录分组
    const byDir = {};
    
    for (const file of unusedFiles) {
      const dir = path.dirname(file.path);
      if (!byDir[dir]) {
        byDir[dir] = [];
      }
      byDir[dir].push(file.path);
    }
    
    for (const dir in byDir) {
      console.log(`\n目录: ${dir}`);
      console.log('------------------------------');
      
      for (const filePath of byDir[dir]) {
        console.log(`- ${path.basename(filePath)}`);
      }
    }
    
    console.log(`\n共发现 ${unusedFiles.length} 个可能未使用的文件`);
    console.log('\n注意: 这只是静态分析的结果，可能有误报。请手动确认后再删除。');
    console.log('某些文件可能通过动态导入或其他方式使用，静态分析无法检测到。');
  } else {
    console.log('未发现可能未使用的文件');
  }
}

// 执行主函数
main().catch(error => {
  console.error('发生错误:', error);
  process.exit(1);
}); 