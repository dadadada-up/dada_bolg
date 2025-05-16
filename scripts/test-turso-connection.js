/**
 * Turso数据库连接测试脚本
 * 
 * 用法:
 *   node scripts/test-turso-connection.js
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config();

// 获取Turso连接信息
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

// 彩色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * 打印信息
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().substring(11, 19);
  let color = colors.reset;
  let prefix = '[信息]';
  
  switch (type) {
    case 'success':
      color = colors.green;
      prefix = '[成功]';
      break;
    case 'error':
      color = colors.red;
      prefix = '[错误]';
      break;
    case 'warn':
      color = colors.yellow;
      prefix = '[警告]';
      break;
    case 'debug':
      color = colors.blue;
      prefix = '[调试]';
      break;
    case 'info':
    default:
      color = colors.cyan;
      prefix = '[信息]';
      break;
  }
  
  console.log(`${color}${timestamp} ${prefix} ${message}${colors.reset}`);
}

/**
 * 测试Turso数据库连接
 */
async function testTursoConnection() {
  log('开始测试Turso数据库连接');
  
  // 检查环境变量
  if (!TURSO_URL) {
    log('未设置TURSO_DATABASE_URL环境变量', 'error');
    log('请添加到.env.local文件，格式为: TURSO_DATABASE_URL=libsql://your-db-url.turso.io', 'info');
    process.exit(1);
  }
  
  if (!TURSO_TOKEN) {
    log('未设置TURSO_AUTH_TOKEN环境变量', 'error');
    log('请添加到.env.local文件，格式为: TURSO_AUTH_TOKEN=your-token', 'info');
    process.exit(1);
  }
  
  log(`Turso数据库URL: ${TURSO_URL}`, 'debug');
  log('Turso认证令牌已配置', 'debug');
  
  try {
    // 创建Turso客户端
    const client = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
    
    log('成功创建Turso客户端', 'success');
    
    // 测试基本查询
    log('测试基本查询...', 'info');
    const testResult = await client.execute({ 
      sql: 'SELECT 1 as test' 
    });
    
    if (testResult?.rows?.[0]?.test === 1) {
      log('基本查询测试成功', 'success');
    } else {
      log(`基本查询返回意外结果: ${JSON.stringify(testResult)}`, 'warn');
    }
    
    // 测试数据库结构
    log('检查数据库表结构...', 'info');
    const tablesResult = await client.execute({ 
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'" 
    });
    
    const tables = tablesResult.rows.map(row => row.name);
    
    if (tables.length > 0) {
      log(`发现${tables.length}个表: ${tables.join(', ')}`, 'success');
      
      // 显示表行数
      log('检查表数据...', 'info');
      for (const table of tables) {
        try {
          const countResult = await client.execute({ 
            sql: `SELECT COUNT(*) as count FROM "${table}"` 
          });
          const count = countResult.rows[0].count;
          log(`表 ${table}: ${count}行数据`, 'info');
        } catch (error) {
          log(`无法查询表 ${table} 的行数: ${error.message}`, 'error');
        }
      }
    } else {
      log('数据库中没有找到表', 'warn');
      log('如果这是新数据库，请运行迁移: npm run migrate-to-turso', 'info');
    }
    
    log('Turso连接测试完成！', 'success');
  } catch (error) {
    log(`连接Turso数据库失败: ${error.message}`, 'error');
    log('请检查URL和令牌是否正确', 'info');
    process.exit(1);
  }
}

// 执行测试
testTursoConnection().catch(error => {
  log(`测试过程出错: ${error.message}`, 'error');
  process.exit(1);
}); 