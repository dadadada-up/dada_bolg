#!/usr/bin/env node

/**
 * 此脚本用于更新代码中的导入路径，以适应新的目录结构
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// 需要替换的导入路径映射
const importPathMap = {
  // 数据库相关
  '@/lib/db': '@/lib/db',
  '@/lib/db.ts': '@/lib/db',
  '@/lib/db-posts': '@/lib/db/posts',
  '@/lib/db-posts.ts': '@/lib/db/posts',
  '@/lib/db-posts.patch': '@/lib/db/posts-patch',
  '@/lib/db-posts.patch.ts': '@/lib/db/posts-patch',
  
  // API相关
  '@/lib/api-client': '@/lib/api/client',
  '@/lib/api-client.ts': '@/lib/api/client',
  '@/lib/api-cache-optimizer': '@/lib/api/cache-optimizer',
  '@/lib/api-cache-optimizer.ts': '@/lib/api/cache-optimizer',
  '@/lib/client-api': '@/lib/api/client-api',
  '@/lib/client-api.ts': '@/lib/api/client-api',
  '@/lib/deprecation-middleware': '@/lib/api/deprecation-middleware',
  '@/lib/deprecation-middleware.ts': '@/lib/api/deprecation-middleware',
  
  // 内容相关
  '@/lib/content-manager': '@/lib/content/manager',
  '@/lib/content-manager.ts': '@/lib/content/manager',
  '@/lib/category-service': '@/lib/content/category-service',
  '@/lib/category-service.ts': '@/lib/content/category-service',
  '@/lib/slug-manager': '@/lib/content/slug-manager',
  '@/lib/slug-manager.ts': '@/lib/content/slug-manager',
  '@/lib/search-utils': '@/lib/content/search-utils',
  '@/lib/search-utils.ts': '@/lib/content/search-utils',
  
  // 缓存相关
  '@/lib/cache': '@/lib/cache',
  '@/lib/cache.ts': '@/lib/cache',
  '@/lib/fs-cache': '@/lib/cache/fs-cache',
  '@/lib/fs-cache.ts': '@/lib/cache/fs-cache',
  '@/lib/fs-cache-client': '@/lib/cache/fs-cache-client',
  '@/lib/fs-cache-client.ts': '@/lib/cache/fs-cache-client',
  
  // 同步相关
  '@/lib/sync-service': '@/lib/sync/service',
  '@/lib/sync-service.ts': '@/lib/sync/service',
  '@/lib/sync-service-client': '@/lib/sync/service-client',
  '@/lib/sync-service-client.ts': '@/lib/sync/service-client',
  '@/lib/sync-unified': '@/lib/sync/unified',
  '@/lib/sync-unified.ts': '@/lib/sync/unified',
  '@/lib/unified-sync-client': '@/lib/sync/unified-client',
  '@/lib/unified-sync-client.ts': '@/lib/sync/unified-client',
  '@/lib/sync-enhancer': '@/lib/sync/enhancer',
  '@/lib/sync-enhancer.ts': '@/lib/sync/enhancer',
  
  // GitHub相关
  '@/lib/github': '@/lib/github',
  '@/lib/github.ts': '@/lib/github',
  '@/lib/github-client': '@/lib/github/client',
  '@/lib/github-client.ts': '@/lib/github/client',
  '@/lib/git-service': '@/lib/github/git-service',
  '@/lib/git-service.ts': '@/lib/github/git-service',
  
  // Markdown相关
  '@/lib/markdown': '@/lib/markdown',
  '@/lib/markdown.ts': '@/lib/markdown',
  '@/lib/remark-admonitions': '@/lib/markdown/remark-admonitions',
  '@/lib/remark-admonitions.ts': '@/lib/markdown/remark-admonitions',
  
  // 工具函数
  '@/lib/utils': '@/lib/utils',
  '@/lib/utils.ts': '@/lib/utils',
  '@/lib/logger': '@/lib/utils/logger',
  '@/lib/logger.ts': '@/lib/utils/logger',
  '@/lib/env': '@/lib/utils/env',
  '@/lib/env.ts': '@/lib/utils/env',
  '@/lib/platforms': '@/lib/utils/platforms',
  '@/lib/platforms.ts': '@/lib/utils/platforms',
  '@/lib/performance-optimizer': '@/lib/utils/performance-optimizer',
  '@/lib/performance-optimizer.ts': '@/lib/utils/performance-optimizer',
  '@/lib/static-generation': '@/lib/utils/static-generation',
  '@/lib/static-generation.ts': '@/lib/utils/static-generation',
  '@/lib/metadata': '@/lib/utils/metadata',
  '@/lib/metadata.ts': '@/lib/utils/metadata',
  '@/lib/image-loader': '@/lib/utils/image-loader',
  '@/lib/image-loader.js': '@/lib/utils/image-loader',
};

// 将路径映射转换为正则表达式替换配置
const regexReplacements = Object.entries(importPathMap).map(([from, to]) => {
  // 转义正则表达式特殊字符
  const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 创建匹配导入语句的正则表达式
  return {
    regex: new RegExp(`(from\\s+['"])${escapedFrom}(['"])`, 'g'),
    replacement: `$1${to}$2`
  };
});

// 递归扫描目录中的所有 .ts 和 .tsx 文件
async function scanDirectory(directory) {
  const files = await readdir(directory);
  const result = [];

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      // 跳过 node_modules 和 .git 目录
      if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== '.vercel') {
        const subDirFiles = await scanDirectory(fullPath);
        result.push(...subDirFiles);
      }
    } else if (
      stats.isFile() && 
      (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))
    ) {
      result.push(fullPath);
    }
  }

  return result;
}

// 处理文件中的导入路径
async function processFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let hasChanges = false;

    // 应用所有替换规则
    for (const { regex, replacement } of regexReplacements) {
      const newContent = content.replace(regex, replacement);
      if (newContent !== content) {
        hasChanges = true;
        content = newContent;
      }
    }

    // 如果有更改，写入文件
    if (hasChanges) {
      await writeFile(filePath, content, 'utf8');
      console.log(`已更新导入路径: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`处理文件失败 ${filePath}:`, error);
    return false;
  }
}

// 主函数
async function main() {
  try {
    console.log('开始扫描文件...');
    const files = await scanDirectory('.');
    console.log(`找到 ${files.length} 个文件需要检查`);

    let updatedCount = 0;
    for (const file of files) {
      const updated = await processFile(file);
      if (updated) updatedCount++;
    }

    console.log(`已完成。已更新 ${updatedCount} 个文件的导入路径。`);
  } catch (error) {
    console.error('发生错误:', error);
    process.exit(1);
  }
}

main(); 