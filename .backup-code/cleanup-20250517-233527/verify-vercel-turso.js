/**
 * 验证Vercel环境中的Turso数据库连接
 * 
 * 这个脚本用于验证Vercel部署环境中是否能正确连接Turso数据库
 * 主要用于调试Vercel部署问题
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config();

// 获取Turso连接信息
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const ENV_MODE = process.env.NODE_ENV || 'development';
const IS_VERCEL = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_VERCEL === '1';

// 日志输出
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  let prefix = '[INFO]';
  
  switch (type) {
    case 'success': prefix = '[SUCCESS]'; break;
    case 'error': prefix = '[ERROR]'; break;
    case 'warn': prefix = '[WARNING]'; break;
    case 'debug': prefix = '[DEBUG]'; break;
  }
  
  console.log(`${timestamp} ${prefix} ${message}`);
}

// 主函数
async function verifyTursoConnection() {
  log('开始验证Turso数据库连接');
  log(`运行环境: ${ENV_MODE}`);
  log(`是否Vercel环境: ${IS_VERCEL ? '是' : '否'}`);
  
  // 显示环境变量
  log(`TURSO_DATABASE_URL=${TURSO_URL ? `${TURSO_URL.substring(0, 20)}...` : '未设置'}`, 'debug');
  log(`TURSO_AUTH_TOKEN=${TURSO_TOKEN ? '已设置' : '未设置'}`, 'debug');
  
  // 检查环境变量
  if (!TURSO_URL) {
    log('未设置TURSO_DATABASE_URL环境变量', 'error');
    return false;
  }
  
  if (!TURSO_TOKEN) {
    log('未设置TURSO_AUTH_TOKEN环境变量', 'error');
    return false;
  }
  
  try {
    log('创建Turso客户端...');
    const client = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
    
    log('执行基本查询测试...');
    const testResult = await client.execute({ 
      sql: 'SELECT 1 as test' 
    });
    
    if (testResult?.rows?.[0]?.test === 1) {
      log('基本查询测试成功', 'success');
    } else {
      log(`基本查询返回意外结果: ${JSON.stringify(testResult)}`, 'warn');
    }
    
    // 测试写入操作
    try {
      log('测试写入操作...');
      const testTable = 'verification_test';
      
      // 检查测试表是否存在
      const tableCheck = await client.execute({ 
        sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='${testTable}'` 
      });
      
      // 如果表不存在，创建它
      if (tableCheck.rows.length === 0) {
        log(`创建测试表: ${testTable}`);
        await client.execute({ 
          sql: `CREATE TABLE ${testTable} (id INTEGER PRIMARY KEY, timestamp TEXT, env TEXT)` 
        });
      }
      
      // 插入测试数据
      const timestamp = new Date().toISOString();
      await client.execute({ 
        sql: `INSERT INTO ${testTable} (timestamp, env) VALUES (?, ?)`,
        args: [timestamp, `Vercel:${IS_VERCEL ? 'true' : 'false'}-${ENV_MODE}`]
      });
      
      // 读取验证
      const readResult = await client.execute({ 
        sql: `SELECT * FROM ${testTable} ORDER BY id DESC LIMIT 1` 
      });
      
      log(`写入测试成功! 最新记录: ${JSON.stringify(readResult.rows[0])}`, 'success');
    } catch (writeError) {
      log(`写入测试失败: ${writeError.message}`, 'error');
    }
    
    log('Turso连接验证完成', 'success');
    return true;
  } catch (error) {
    log(`连接Turso数据库失败: ${error.message}`, 'error');
    return false;
  }
}

// 执行验证
verifyTursoConnection()
  .then(success => {
    if (success) {
      log('✅ Turso数据库连接正常', 'success');
      process.exit(0);
    } else {
      log('❌ Turso数据库连接失败', 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`验证过程出错: ${error.message}`, 'error');
    process.exit(1);
  }); 