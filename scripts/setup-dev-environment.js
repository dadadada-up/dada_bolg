/**
 * 开发环境一键设置脚本
 * 
 * 一键完成本地开发环境的初始化和从生产环境同步数据
 * 使用方法: node scripts/setup-dev-environment.js [--no-sync]
 * 
 * 参数:
 *   --no-sync: 跳过从生产环境同步数据的步骤
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 检查命令行参数
const args = process.argv.slice(2);
const skipSync = args.includes('--no-sync');

// 记录日志
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌ ' : type === 'success' ? '✅ ' : type === 'warning' ? '⚠️ ' : '🔹 ';
  console.log(`${prefix}[${timestamp}] ${message}`);
}

// 执行命令并返回结果
function execCommand(command, silent = false) {
  try {
    if (!silent) log(`执行命令: ${command}`);
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    log(`命令执行失败: ${error.message}`, 'error');
    return null;
  }
}

// 运行脚本并等待完成
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    log(`运行脚本: ${scriptPath}`);
    
    const process = spawn('node', [scriptPath], { stdio: 'inherit' });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`脚本执行失败，退出代码: ${code}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
}

// 检查环境变量
function checkEnvironmentVariables() {
  log('检查环境变量...');
  
  const requiredVars = ['DATABASE_URL'];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (!skipSync) {
    const syncVars = ['PROD_DATABASE_URL', 'PROD_DATABASE_TOKEN'];
    for (const varName of syncVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }
  }
  
  if (missingVars.length > 0) {
    log(`缺少必要的环境变量: ${missingVars.join(', ')}`, 'error');
    log('请在.env.local文件中添加这些变量', 'warning');
    return false;
  }
  
  log('环境变量检查通过', 'success');
  return true;
}

// 检查Docker是否安装
function checkDocker() {
  try {
    const result = execCommand('docker --version', true);
    if (result) {
      log(`Docker已安装: ${result.trim()}`, 'success');
      return true;
    } else {
      log('Docker检测失败', 'error');
      return false;
    }
  } catch (error) {
    log('Docker未安装或无法访问', 'error');
    log('请安装Docker: https://docs.docker.com/get-docker/', 'warning');
    return false;
  }
}

// 创建示例.env.local文件
function createEnvExample() {
  const envPath = path.join(__dirname, '..', '.env.local.example');
  
  if (!fs.existsSync(envPath)) {
    log('创建.env.local.example示例文件...');
    
    const envContent = `# Turso数据库配置
DATABASE_URL=http://localhost:8080
DATABASE_AUTH_TOKEN=

# 生产环境数据库配置 (用于数据同步)
PROD_DATABASE_URL=https://your-prod-database-url
PROD_DATABASE_TOKEN=your-prod-database-token

# 站点URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
`;
    
    fs.writeFileSync(envPath, envContent, 'utf8');
    log('.env.local.example文件创建成功', 'success');
  }
}

// 主函数
async function main() {
  try {
    log('======================================');
    log('🚀 开始设置本地开发环境...');
    log('======================================');
    
    // 创建示例环境变量文件
    createEnvExample();
    
    // 检查环境变量
    if (!checkEnvironmentVariables()) {
      process.exit(1);
    }
    
    // 检查Docker
    if (!checkDocker()) {
      log('Docker是运行本地开发环境的必要条件', 'error');
      process.exit(1);
    }
    
    // 步骤1: 初始化本地开发数据库
    log('======================================');
    log('步骤1: 初始化本地开发数据库');
    log('======================================');
    
    try {
      await runScript(path.join(__dirname, 'init-dev-db.js'));
      log('本地开发数据库初始化成功', 'success');
    } catch (error) {
      log(`初始化本地开发数据库失败: ${error.message}`, 'error');
      process.exit(1);
    }
    
    // 步骤2: 从生产环境同步数据 (如果未跳过)
    if (!skipSync) {
      log('======================================');
      log('步骤2: 从生产环境同步数据');
      log('======================================');
      
      try {
        await runScript(path.join(__dirname, 'sync-from-prod.js'));
        log('数据同步成功', 'success');
      } catch (error) {
        log(`数据同步失败: ${error.message}`, 'error');
        log('本地开发环境仍可使用，但数据可能不是最新的', 'warning');
      }
    } else {
      log('跳过从生产环境同步数据的步骤', 'warning');
    }
    
    // 步骤3: 创建SQLite文件用于Navicat查看
    log('======================================');
    log('步骤3: 创建SQLite文件用于Navicat查看');
    log('======================================');
    
    try {
      await runScript(path.join(__dirname, 'create-sqlite-db.js'));
      log('SQLite文件创建成功', 'success');
    } catch (error) {
      log(`创建SQLite文件失败: ${error.message}`, 'error');
      log('这不会影响开发环境的正常使用', 'warning');
    }
    
    // 完成
    log('======================================');
    log('✨ 本地开发环境设置完成!');
    log('======================================');
    log('你现在可以:');
    log('1. 运行 "pnpm dev" 启动Next.js开发服务器');
    log('2. 使用Navicat打开 navicat_import/blog_database.db 查看数据库');
    log('3. 访问 http://localhost:3000 查看博客');
    log('======================================');
  } catch (error) {
    log(`设置过程中出现错误: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 执行主函数
main(); 