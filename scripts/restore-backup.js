/**
 * 恢复数据库备份
 * 将最新的备份数据库文件恢复为主数据库
 */
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const MAIN_DB_PATH = path.resolve(process.cwd(), 'data', 'blog.db');
const STORAGE_DB_PATH = path.resolve(process.cwd(), 'data', 'storage', 'blog.db');
const BACKUPS_DIR = path.resolve(process.cwd(), 'data', 'storage', 'backups');

// 确保数据目录存在
const dataDir = path.dirname(MAIN_DB_PATH);
if (!fs.existsSync(dataDir)) {
  console.log(`创建数据目录: ${dataDir}`);
  fs.mkdirSync(dataDir, { recursive: true });
}

const storageDir = path.dirname(STORAGE_DB_PATH);
if (!fs.existsSync(storageDir)) {
  console.log(`创建存储目录: ${storageDir}`);
  fs.mkdirSync(storageDir, { recursive: true });
}

// 获取所有备份文件并按修改时间排序
function getLatestBackup() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    console.error(`备份目录不存在: ${BACKUPS_DIR}`);
    return null;
  }

  const backupFiles = fs.readdirSync(BACKUPS_DIR)
    .filter(file => file.startsWith('sqlite-backup-') && file.endsWith('.db'))
    .map(file => ({
      name: file,
      path: path.join(BACKUPS_DIR, file),
      mtime: fs.statSync(path.join(BACKUPS_DIR, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime); // 按修改时间降序排序

  if (backupFiles.length === 0) {
    console.error('没有找到备份文件');
    return null;
  }

  return backupFiles[0]; // 返回最新的备份文件
}

// 复制文件
function copyFile(source, target) {
  try {
    const data = fs.readFileSync(source);
    fs.writeFileSync(target, data);
    console.log(`成功复制文件: ${source} -> ${target}`);
    return true;
  } catch (error) {
    console.error(`复制文件失败: ${error.message}`);
    return false;
  }
}

// 主函数
function main() {
  console.log('开始恢复数据库备份...');
  
  // 获取最新的备份文件
  const latestBackup = getLatestBackup();
  if (!latestBackup) {
    console.error('无法恢复备份，未找到备份文件');
    return;
  }
  
  console.log(`最新备份文件: ${latestBackup.name} (${latestBackup.mtime.toISOString()})`);
  
  // 检查文件大小
  const backupStats = fs.statSync(latestBackup.path);
  console.log(`备份文件大小: ${(backupStats.size / 1024).toFixed(2)} KB`);
  
  // 备份当前数据库（如果存在）
  if (fs.existsSync(MAIN_DB_PATH)) {
    const backupName = `main-db-backup-${new Date().toISOString().replace(/:/g, '-')}.db`;
    const backupPath = path.join(BACKUPS_DIR, backupName);
    console.log(`备份当前主数据库: ${MAIN_DB_PATH} -> ${backupPath}`);
    copyFile(MAIN_DB_PATH, backupPath);
  }
  
  if (fs.existsSync(STORAGE_DB_PATH)) {
    const backupName = `storage-db-backup-${new Date().toISOString().replace(/:/g, '-')}.db`;
    const backupPath = path.join(BACKUPS_DIR, backupName);
    console.log(`备份当前存储数据库: ${STORAGE_DB_PATH} -> ${backupPath}`);
    copyFile(STORAGE_DB_PATH, backupPath);
  }
  
  // 恢复备份到主数据库和存储数据库
  console.log(`恢复备份到主数据库: ${latestBackup.path} -> ${MAIN_DB_PATH}`);
  const mainResult = copyFile(latestBackup.path, MAIN_DB_PATH);
  
  console.log(`恢复备份到存储数据库: ${latestBackup.path} -> ${STORAGE_DB_PATH}`);
  const storageResult = copyFile(latestBackup.path, STORAGE_DB_PATH);
  
  if (mainResult && storageResult) {
    console.log('数据库备份恢复成功!');
    
    // 检查主数据库表
    const { execSync } = require('child_process');
    try {
      const tables = execSync(`sqlite3 "${MAIN_DB_PATH}" ".tables"`).toString();
      console.log('主数据库表:', tables);
      
      const postCount = execSync(`sqlite3 "${MAIN_DB_PATH}" "SELECT COUNT(*) FROM posts"`).toString();
      console.log(`主数据库文章数: ${postCount}`);
    } catch (error) {
      console.error('检查数据库表失败:', error.message);
    }
  } else {
    console.error('数据库备份恢复失败');
  }
}

// 执行主函数
main(); 