/**
 * 环境变量检查脚本
 * 
 * 检查.env.local文件中的环境变量是否正确配置
 * 使用方法: node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const https = require('https');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 记录日志
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌ ' : type === 'success' ? '✅ ' : type === 'warning' ? '⚠️ ' : '🔹 ';
  console.log(`${prefix}[${timestamp}] ${message}`);
}

// 检查URL是否可访问
async function checkUrlAccess(url, authToken = null) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const httpModule = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = httpModule.request(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.write(JSON.stringify({
        statements: [{ q: 'SELECT 1' }]
      }));
      
      req.end();
      
      // 设置超时
      setTimeout(() => {
        req.destroy();
        resolve(false);
      }, 5000);
    } catch (error) {
      resolve(false);
    }
  });
}

// 检查本地数据库配置
async function checkLocalDatabase() {
  log('检查本地数据库配置...');
  
  const localUrl = process.env.DATABASE_URL;
  
  if (!localUrl) {
    log('缺少本地数据库URL (DATABASE_URL)', 'error');
    return false;
  }
  
  log(`本地数据库URL: ${localUrl}`);
  
  const isAccessible = await checkUrlAccess(localUrl);
  
  if (isAccessible) {
    log('本地数据库连接成功', 'success');
    return true;
  } else {
    log('无法连接到本地数据库', 'error');
    log('请确保Docker容器已启动: pnpm db:init', 'warning');
    return false;
  }
}

// 检查生产环境数据库配置
async function checkProdDatabase() {
  log('检查生产环境数据库配置...');
  
  const prodUrl = process.env.PROD_DATABASE_URL;
  const prodToken = process.env.PROD_DATABASE_TOKEN;
  
  if (!prodUrl) {
    log('缺少生产环境数据库URL (PROD_DATABASE_URL)', 'error');
    return false;
  }
  
  if (!prodToken) {
    log('缺少生产环境数据库令牌 (PROD_DATABASE_TOKEN)', 'error');
    return false;
  }
  
  log(`生产环境数据库URL: ${prodUrl}`);
  
  const isAccessible = await checkUrlAccess(prodUrl, prodToken);
  
  if (isAccessible) {
    log('生产环境数据库连接成功', 'success');
    return true;
  } else {
    log('无法连接到生产环境数据库', 'error');
    log('请检查PROD_DATABASE_URL和PROD_DATABASE_TOKEN是否正确', 'warning');
    return false;
  }
}

// 检查其他必要的环境变量
function checkOtherEnvVars() {
  log('检查其他环境变量...');
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  if (!siteUrl) {
    log('缺少站点URL (NEXT_PUBLIC_SITE_URL)', 'warning');
    log('建议设置NEXT_PUBLIC_SITE_URL=http://localhost:3000', 'info');
    return false;
  }
  
  log(`站点URL: ${siteUrl}`, 'success');
  return true;
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
    log('🔍 开始检查环境变量配置...');
    log('======================================');
    
    // 创建示例环境变量文件
    createEnvExample();
    
    // 检查.env.local文件是否存在
    const envPath = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(envPath)) {
      log('.env.local文件不存在', 'error');
      log('请根据.env.local.example创建.env.local文件', 'warning');
      process.exit(1);
    }
    
    // 检查本地数据库配置
    const localDbOk = await checkLocalDatabase();
    
    // 检查生产环境数据库配置
    const prodDbOk = await checkProdDatabase();
    
    // 检查其他环境变量
    const otherEnvOk = checkOtherEnvVars();
    
    // 总结
    log('======================================');
    log('环境变量检查结果:');
    log('======================================');
    log(`本地数据库配置: ${localDbOk ? '正常 ✅' : '异常 ❌'}`);
    log(`生产环境数据库配置: ${prodDbOk ? '正常 ✅' : '异常 ❌'}`);
    log(`其他环境变量: ${otherEnvOk ? '正常 ✅' : '警告 ⚠️'}`);
    log('======================================');
    
    if (!localDbOk) {
      log('本地数据库配置异常，请先运行: pnpm db:init', 'warning');
    }
    
    if (!prodDbOk) {
      log('生产环境数据库配置异常，无法从生产环境同步数据', 'warning');
    }
    
    if (localDbOk && prodDbOk) {
      log('环境变量配置正常，可以运行: pnpm setup-dev', 'success');
    } else if (localDbOk) {
      log('本地开发环境可以使用，但无法从生产环境同步数据', 'warning');
      log('可以运行: pnpm setup-dev:no-sync', 'info');
    } else {
      log('请先修复环境变量配置问题，再运行设置脚本', 'error');
    }
  } catch (error) {
    log(`检查过程中出现错误: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 执行主函数
main(); 