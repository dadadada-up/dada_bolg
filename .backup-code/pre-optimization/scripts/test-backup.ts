/**
 * 备份测试脚本
 * 此脚本用于测试备份过程，但不会将内容推送到GitHub
 */
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

// 解决ESM模块导入问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 动态导入模块
async function main() {
  // 动态导入数据库模块
  const { getDb } = await import('../src/lib/db.ts');
  
  // 动态导入备份模块
  const backupModule = await import('./backup-to-github.ts');
  const { testBackupExport } = backupModule;
  
  await testBackup(getDb, testBackupExport);
}

/**
 * 测试导出函数
 */
async function testBackup(getDbFunc: any, testBackupExportFunc: any) {
  console.log('开始测试备份导出...');
  
  // 创建测试目录
  const testDir = path.join(projectRoot, 'temp-backup-test');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
  fs.mkdirSync(testDir, { recursive: true });
  
  try {
    // 连接数据库
    const db = await getDbFunc();
    
    // 执行测试导出
    await testBackupExportFunc(db, testDir);
    
    // 显示导出结果统计
    const stats = collectStats(testDir);
    console.log('\n📊 导出统计:');
    console.log(`- 分类数量: ${stats.categories}`);
    console.log(`- 文章数量: ${stats.posts}`);
    console.log(`- 元数据文件: ${stats.metaFiles}`);
    console.log(`- 总共文件: ${stats.totalFiles}`);
    console.log(`- 总导出大小: ${formatBytes(stats.totalSize)}`);
    
    console.log('\n✅ 测试备份成功!');
    console.log(`导出目录: ${testDir}`);
    console.log('请检查上述目录以确认导出内容是否符合预期');
    
  } catch (error) {
    console.error('❌ 测试备份失败:', error);
  }
}

/**
 * 收集导出目录统计信息
 */
function collectStats(dir: string) {
  let totalFiles = 0;
  let totalSize = 0;
  let posts = 0;
  let metaFiles = 0;
  let categories = 0;
  
  // 读取分类JSON
  if (fs.existsSync(path.join(dir, 'categories.json'))) {
    const categoriesContent = fs.readFileSync(path.join(dir, 'categories.json'), 'utf8');
    const categoriesData = JSON.parse(categoriesContent);
    categories = categoriesData.length;
  }
  
  // 递归遍历目录
  function scanDir(directory: string) {
    const items = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(directory, item.name);
      
      if (item.isDirectory()) {
        scanDir(itemPath);
      } else {
        const stats = fs.statSync(itemPath);
        totalFiles++;
        totalSize += stats.size;
        
        if (item.name.endsWith('.md')) {
          posts++;
        } else if (item.name.endsWith('.meta.json')) {
          metaFiles++;
        }
      }
    }
  }
  
  // 执行扫描
  scanDir(dir);
  
  return {
    totalFiles,
    totalSize,
    posts,
    metaFiles,
    categories
  };
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// 执行测试
main().catch(error => {
  console.error('测试脚本执行错误:', error);
  process.exit(1);
}); 