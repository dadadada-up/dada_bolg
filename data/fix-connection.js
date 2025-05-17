/**
 * 数据库连接问题修复脚本
 * 尝试从storage/blog.db创建一个硬链接到data/blog.db
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const sourcePath = path.resolve(__dirname, 'storage', 'blog.db');
const targetPath = path.resolve(__dirname, 'blog.db');

console.log(`创建从 ${sourcePath} 到 ${targetPath} 的硬链接`);

// 如果目标文件已存在，先备份
if (fs.existsSync(targetPath)) {
  const backupPath = `${targetPath}.backup.${Date.now()}`;
  console.log(`目标文件已存在，备份到 ${backupPath}`);
  fs.copyFileSync(targetPath, backupPath);
  fs.unlinkSync(targetPath);
}

// 尝试创建硬链接
try {
  fs.linkSync(sourcePath, targetPath);
  console.log('硬链接创建成功！');
} catch (error) {
  console.error('创建硬链接失败，尝试复制文件:', error);
  
  // 如果硬链接失败，直接复制文件
  try {
    fs.copyFileSync(sourcePath, targetPath);
    console.log('文件复制成功！');
  } catch (copyError) {
    console.error('文件复制也失败了:', copyError);
  }
}

// 验证结果
if (fs.existsSync(targetPath)) {
  console.log(`目标文件 ${targetPath} 现在存在，大小: ${fs.statSync(targetPath).size} 字节`);
  console.log('数据库连接问题应该已修复，请重启服务器。');
} else {
  console.error('修复失败，目标文件不存在。');
}

// 检查data/blog.db的内容
console.log('\n检查数据库内容...');
exec(`sqlite3 "${targetPath}" "SELECT COUNT(*) FROM posts;"`, (error, stdout, stderr) => {
  if (error) {
    console.error('检查数据库失败:', error);
    return;
  }
  
  console.log(`data/blog.db 中的文章数量: ${stdout.trim()}`);
  
  // 检查几篇示例文章
  exec(`sqlite3 "${targetPath}" "SELECT id, title, slug FROM posts LIMIT 3;"`, (error2, stdout2, stderr2) => {
    if (error2) {
      console.error('获取示例文章失败:', error2);
      return;
    }
    
    console.log('示例文章:');
    console.log(stdout2);
  });
}); 