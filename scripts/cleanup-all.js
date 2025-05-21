/**
 * 项目全面清理脚本
 * 清理 data、scripts 和 .backup-code 目录下的冗余文件
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 项目根目录
const ROOT_DIR = path.resolve(__dirname, '..');

// 要保留的重要文件
const IMPORTANT_FILES = [
  'data/backup-single/blog.db.backup',     // 最新数据库备份
  'data/db/blog_dump.sql',                 // SQL 转储
  'data/db/turso_schema_fixed.sql',        // 修复后的 schema
  'scripts/cleanup-all.js',                // 本清理脚本
  'scripts/README.md',                     // 脚本说明文档
];

// 要完全删除的目录
const DIRS_TO_DELETE = [
  'data/backup',
  'data/storage',
  'data/temp',
  'data/reports',
  'scripts/cleanup',
  'scripts/utils/test',
  '.backup-code',                          // 完全删除所有备份代码
];

// 要保留的目录（不删除，但可能清空）
const DIRS_TO_KEEP = [
  'data/contents/posts',
  'data/contents/assets',
  'data/contents/drafts',
  'scripts/migrations',
];

// 要删除的文件模式
const FILE_PATTERNS_TO_DELETE = [
  'data/*.db*',
  'data/*.backup*',
  'data/storage/*.db*',
  'data/storage/*.backup*',
  'scripts/*.sh',
  'scripts/restore-backup.js',
  'scripts/import-test-data.js',
  'scripts/next-env.d.ts',
  'scripts/cleanup-data.js',               // 旧的清理脚本
  '*.bak',                                 // 所有 .bak 文件
  '*.backup',                              // 所有 .backup 文件
];

// 辅助函数：创建目录
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`创建目录: ${dir}`);
  }
}

// 辅助函数：检查文件是否重要
function isImportantFile(file) {
  return IMPORTANT_FILES.some(important => {
    const absoluteImportant = path.resolve(ROOT_DIR, important);
    const absoluteFile = path.resolve(ROOT_DIR, file);
    return absoluteImportant === absoluteFile;
  });
}

// 辅助函数：删除目录
function removeDir(dir) {
  try {
    const absoluteDir = path.resolve(ROOT_DIR, dir);
    if (fs.existsSync(absoluteDir)) {
      console.log(`删除目录: ${dir}`);
      execSync(`rm -rf "${absoluteDir}"`);
    }
  } catch (error) {
    console.error(`删除目录 ${dir} 时出错:`, error.message);
  }
}

// 辅助函数：清空目录但保留结构
function clearDir(dir) {
  try {
    const absoluteDir = path.resolve(ROOT_DIR, dir);
    if (fs.existsSync(absoluteDir)) {
      console.log(`清空目录: ${dir}`);
      // 保留 .gitkeep 文件
      execSync(`find "${absoluteDir}" -type f -not -name ".gitkeep" -delete`);
      // 确保有 .gitkeep 文件
      const gitkeepFile = path.join(absoluteDir, '.gitkeep');
      if (!fs.existsSync(gitkeepFile)) {
        fs.writeFileSync(gitkeepFile, '');
      }
    }
  } catch (error) {
    console.error(`清空目录 ${dir} 时出错:`, error.message);
  }
}

// 辅助函数：删除匹配的文件
function removeFilePattern(pattern) {
  try {
    console.log(`删除匹配 ${pattern} 的文件...`);
    const result = execSync(`find ${pattern} -type f 2>/dev/null || echo "没有找到匹配文件"`).toString();
    
    if (!result.includes('没有找到匹配文件')) {
      const files = result.trim().split('\n');
      
      // 过滤掉重要文件
      const filesToDelete = files.filter(file => !isImportantFile(file));
      
      if (filesToDelete.length > 0) {
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file);
            console.log(`已删除: ${file}`);
          } catch (err) {
            console.error(`删除 ${file} 时出错:`, err.message);
          }
        });
      } else {
        console.log(`所有匹配的文件都是重要文件，跳过删除`);
      }
    } else {
      console.log(`没有找到匹配 ${pattern} 的文件`);
    }
  } catch (error) {
    console.error(`处理文件模式 ${pattern} 时出错:`, error.message);
  }
}

// 辅助函数：获取目录大小（以MB为单位）
function getDirSize(dir) {
  try {
    const result = execSync(`du -sm "${dir}" | cut -f1`).toString().trim();
    return parseFloat(result);
  } catch (error) {
    console.error(`获取目录 ${dir} 大小时出错:`, error.message);
    return 0;
  }
}

// 开始清理
console.log('开始全面清理项目...');

// 显示清理前的大小
const beforeSize = getDirSize(ROOT_DIR);
console.log(`清理前项目大小: ${beforeSize.toFixed(2)} MB`);

// 确保备份目录存在
ensureDir(path.resolve(ROOT_DIR, 'data/backup-single'));

// 1. 删除不需要的目录
console.log('\n1. 删除不需要的目录');
DIRS_TO_DELETE.forEach(removeDir);

// 2. 清空保留的目录
console.log('\n2. 清空保留的目录');
DIRS_TO_KEEP.forEach(clearDir);

// 3. 删除匹配的文件
console.log('\n3. 删除匹配的文件');
FILE_PATTERNS_TO_DELETE.forEach(removeFilePattern);

// 4. 确认重要文件存在
console.log('\n4. 检查重要文件');
IMPORTANT_FILES.forEach(file => {
  const absolutePath = path.resolve(ROOT_DIR, file);
  if (fs.existsSync(absolutePath)) {
    const stats = fs.statSync(absolutePath);
    console.log(`✓ ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  } else {
    console.log(`✗ ${file} (文件不存在)`);
  }
});

// 显示清理后的大小
const afterSize = getDirSize(ROOT_DIR);
console.log(`\n清理后项目大小: ${afterSize.toFixed(2)} MB`);
console.log(`减少了: ${(beforeSize - afterSize).toFixed(2)} MB (${((beforeSize - afterSize) / beforeSize * 100).toFixed(2)}%)`);

console.log('\n清理完成！');
console.log('项目现在应该更加整洁，只保留了必要的文件和目录结构。');
console.log('你可以安全地部署到 Vercel 而不会上传不必要的数据库文件。'); 