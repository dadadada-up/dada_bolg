/**
 * 清理脚本
 * 用于整理根目录中的散落文件
 */

const fs = require('fs');
const path = require('path');

// 要移动的文件映射
const filesToMove = {
  // 响应示例文件
  'categories-response-fixed.json': 'data/examples/categories-response-fixed.json',
  'categories-response.json': 'data/examples/categories-response.json',
  'dashboard-response-fixed.json': 'data/examples/dashboard-response-fixed.json',
  'dashboard-response-new.json': 'data/examples/dashboard-response-new.json',
  'dashboard-response.json': 'data/examples/dashboard-response.json',
  'posts-response-fixed.json': 'data/examples/posts-response-fixed.json',
  'posts-response-new.json': 'data/examples/posts-response-new.json',
  'posts-response.json': 'data/examples/posts-response.json',
};

// 确保目标目录存在
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`创建目录: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 移动文件
function moveFile(source, target) {
  try {
    // 确保目标目录存在
    const targetDir = path.dirname(target);
    ensureDirectoryExists(targetDir);
    
    // 检查源文件是否存在
    if (!fs.existsSync(source)) {
      console.log(`源文件不存在，跳过: ${source}`);
      return;
    }
    
    // 检查目标文件是否已存在
    if (fs.existsSync(target)) {
      console.log(`目标文件已存在，跳过: ${target}`);
      return;
    }
    
    // 移动文件
    fs.copyFileSync(source, target);
    fs.unlinkSync(source);
    console.log(`已移动: ${source} -> ${target}`);
  } catch (error) {
    console.error(`移动文件失败 ${source} -> ${target}: ${error.message}`);
  }
}

// 主函数
function cleanup() {
  console.log('开始清理根目录...');
  
  // 移动所有映射的文件
  Object.entries(filesToMove).forEach(([source, target]) => {
    moveFile(source, target);
  });
  
  console.log('清理完成!');
}

// 执行清理
cleanup(); 