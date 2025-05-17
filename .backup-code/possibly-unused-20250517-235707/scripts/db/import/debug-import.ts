/**
 * 模块导入测试脚本
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 解决ESM模块导入问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('开始测试模块导入...');
console.log('项目根目录:', projectRoot);

// 列出src/lib目录下的文件
const libPath = path.join(projectRoot, 'src', 'lib');
console.log('检查目录:', libPath);

if (fs.existsSync(libPath)) {
  console.log('src/lib目录存在，内容:');
  const files = fs.readdirSync(libPath);
  files.forEach(file => {
    const filePath = path.join(libPath, file);
    const stat = fs.statSync(filePath);
    console.log(`- ${file} (${stat.isDirectory() ? '目录' : '文件'})`);
  });
} else {
  console.log('src/lib目录不存在');
}

// 尝试导入数据库模块
async function testImport() {
  try {
    console.log('\n尝试导入 ../src/lib/db/index.ts');
    const dbIndexModule = await import('../src/lib/db/index.ts');
    console.log('成功导入 db/index.ts:', Object.keys(dbIndexModule));
  } catch (err) {
    console.error('导入 db/index.ts 失败:', err);
  }

  try {
    console.log('\n尝试导入 ../src/lib/db.ts');
    const dbModule = await import('../src/lib/db.ts');
    console.log('成功导入 db.ts:', Object.keys(dbModule));
  } catch (err) {
    console.error('导入 db.ts 失败:', err);
  }

  try {
    console.log('\n尝试导入 ../src/lib/db.js');
    const dbJsModule = await import('../src/lib/db.js');
    console.log('成功导入 db.js:', Object.keys(dbJsModule));
  } catch (err) {
    console.error('导入 db.js 失败:', err);
  }
}

testImport().catch(err => {
  console.error('测试失败:', err);
}); 