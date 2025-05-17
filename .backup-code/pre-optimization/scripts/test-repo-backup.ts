/**
 * 测试仓库备份脚本
 * 此脚本用于测试备份和推送功能，但不实际推送到GitHub
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 解决ESM模块导入问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 假设的GitHub仓库信息
const MOCK_REPO_DIR = path.join(projectRoot, 'mock-github-repo');

/**
 * 主测试函数
 */
async function testRepoBackup() {
  console.log('开始测试仓库备份和推送功能...');
  
  // 创建临时目录和模拟GitHub仓库
  setupTestEnvironment();
  
  try {
    // 1. 动态导入数据库模块
    const { getDb } = await import('../src/lib/db.js');
    const db = await getDb();
    console.log('数据库连接成功');
    
    // 2. 修改backup-to-github.ts的pushToGitHub函数，使其支持测试模式
    patchBackupScript();
    
    // 3. 动态导入备份模块并执行测试备份
    const backupModule = await import('./backup-to-github.js');
    const originalBackupToBlog = backupModule.backupToBlog;
    
    // 4. 执行备份函数（会使用修改后的pushToGitHub函数）
    await originalBackupToBlog();
    
    // 5. 验证结果
    verifyBackupResults();
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    // 清理测试环境
    cleanupTestEnvironment();
  }
}

/**
 * 设置测试环境
 */
function setupTestEnvironment() {
  console.log('设置测试环境...');
  
  // 创建模拟GitHub仓库目录
  if (fs.existsSync(MOCK_REPO_DIR)) {
    fs.rmSync(MOCK_REPO_DIR, { recursive: true });
  }
  fs.mkdirSync(MOCK_REPO_DIR, { recursive: true });
  
  // 初始化模拟GitHub仓库
  execSync('git init', { cwd: MOCK_REPO_DIR });
  execSync('git config --local user.name "Test User"', { cwd: MOCK_REPO_DIR });
  execSync('git config --local user.email "test@example.com"', { cwd: MOCK_REPO_DIR });
  
  // 创建一些初始文件模拟现有仓库
  fs.writeFileSync(path.join(MOCK_REPO_DIR, 'README.md'), '# 模拟仓库\n\n这是一个用于测试的模拟GitHub仓库。');
  fs.writeFileSync(path.join(MOCK_REPO_DIR, '.gitignore'), 'node_modules\n.env\n.DS_Store');
  fs.writeFileSync(path.join(MOCK_REPO_DIR, 'CONTRIBUTING.md'), '# 贡献指南\n\n这是模拟的贡献指南文件。');
  fs.writeFileSync(path.join(MOCK_REPO_DIR, '项目开发需求文档.md'), '# 项目需求\n\n这是一个模拟的项目需求文档。');
  
  // 创建一个初始的content目录结构
  const oldContentDir = path.join(MOCK_REPO_DIR, 'content');
  fs.mkdirSync(oldContentDir, { recursive: true });
  fs.mkdirSync(path.join(oldContentDir, 'posts'), { recursive: true });
  fs.mkdirSync(path.join(oldContentDir, 'posts', 'tech'), { recursive: true });
  fs.writeFileSync(
    path.join(oldContentDir, 'posts', 'tech', 'old-post.md'),
    '# 旧文章\n\n这是一篇模拟的旧文章。'
  );
  
  // 提交初始文件
  execSync('git add .', { cwd: MOCK_REPO_DIR });
  execSync('git commit -m "Initial commit"', { cwd: MOCK_REPO_DIR });
  
  console.log('测试环境设置完成。');
}

/**
 * 修补备份脚本，添加测试模式支持
 */
function patchBackupScript() {
  console.log('修补备份脚本以支持测试模式...');
  
  // 创建临时环境变量文件
  const envPath = path.join(projectRoot, '.env.test');
  fs.writeFileSync(envPath, `MOCK_REPO_DIR=${MOCK_REPO_DIR}\nTEST_MODE=true\n`);
  
  // 设置环境变量
  process.env.MOCK_REPO_DIR = MOCK_REPO_DIR;
  process.env.TEST_MODE = 'true';
  
  console.log('备份脚本修补完成。');
}

/**
 * 验证备份结果
 */
function verifyBackupResults() {
  console.log('\n开始验证备份结果...');
  
  // 检查模拟仓库是否存在必要文件
  const requiredFiles = [
    'README.md',
    '.gitignore',
    'CONTRIBUTING.md',
    '项目开发需求文档.md',
    'categories.json',
    'posts-overview.json',
    'content/posts'
  ];
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(MOCK_REPO_DIR, file));
    console.log(`- ${file}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
    if (!exists) allFilesExist = false;
  }
  
  if (allFilesExist) {
    console.log('✅ 所有必要文件验证通过！');
  } else {
    console.log('❌ 部分必要文件缺失，请检查备份脚本。');
  }
  
  // 检查Git历史
  try {
    const gitLog = execSync('git log --oneline', { cwd: MOCK_REPO_DIR }).toString();
    console.log('\nGit 提交历史:');
    console.log(gitLog);
  } catch (error) {
    console.error('获取Git历史失败:', error);
  }
  
  console.log('\n验证完成。');
}

/**
 * 清理测试环境
 */
function cleanupTestEnvironment() {
  console.log('清理测试环境...');
  
  // 删除环境变量
  delete process.env.MOCK_REPO_DIR;
  delete process.env.TEST_MODE;
  
  // 删除临时环境变量文件
  const envPath = path.join(projectRoot, '.env.test');
  if (fs.existsSync(envPath)) {
    fs.unlinkSync(envPath);
  }
  
  // 保留模拟仓库目录以便查看结果
  console.log(`模拟GitHub仓库目录保留在: ${MOCK_REPO_DIR}`);
  console.log('测试环境清理完成。');
}

// 执行测试
testRepoBackup().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
}); 