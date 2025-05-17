/**
 * Vercel部署Turso数据库初始化脚本
 * 
 * 本脚本在Vercel构建过程中执行，负责：
 * 1. 检测Turso环境变量是否配置
 * 2. 测试Turso数据库连接
 * 3. 在必要时进行数据库初始化和结构创建
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前脚本路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 加载SQL架构文件
const schemaPath = path.join(rootDir, 'data', 'db', 'turso_schema_fixed.sql');

// 判断是否在Vercel环境中运行
const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_VERCEL === '1';

// 获取Turso数据库连接配置
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

// 日志函数
function log(message) {
  console.log(`[Vercel-Turso] ${message}`);
}

/**
 * 检查Turso数据库连接并初始化
 */
async function setupTursoDatabase() {
  log('开始Turso数据库设置');
  
  // 检查环境变量
  if (!tursoUrl || !tursoToken) {
    log('❌ 错误: 未设置TURSO_DATABASE_URL或TURSO_AUTH_TOKEN环境变量');
    log('请在Vercel项目设置中配置这些环境变量');
    return false;
  }
  
  log(`Turso数据库URL: ${tursoUrl}`);
  log('Turso认证令牌已配置');
  
  try {
    // 创建Turso客户端
    const client = createClient({
      url: tursoUrl,
      authToken: tursoToken
    });
    
    log('✅ 成功连接到Turso数据库');
    
    // 测试数据库连接
    const testResult = await client.execute({ 
      sql: 'SELECT 1 as test' 
    });
    
    if (testResult?.rows?.[0]?.test === 1) {
      log('✅ 数据库连接测试成功');
    } else {
      log('⚠️ 数据库连接测试返回意外结果');
    }
    
    // 检查数据库结构
    try {
      const tablesResult = await client.execute({ 
        sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      });
      
      const tables = tablesResult.rows.map(row => row.name);
      log(`发现${tables.length}个表: ${tables.join(', ')}`);
      
      // 如果没有表，创建数据库结构
      if (tables.length === 0) {
        log('数据库为空，开始创建表结构...');
        
        // 读取并执行SQL架构
        if (fs.existsSync(schemaPath)) {
          const schema = fs.readFileSync(schemaPath, 'utf8');
          // 拆分SQL语句
          const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(s => ({ sql: s + ';' }));
          
          // 批量执行SQL语句
          log(`执行${statements.length}条创建表语句...`);
          for (const stmt of statements) {
            try {
              await client.execute(stmt);
            } catch (error) {
              log(`❌ 执行SQL失败: ${stmt.sql.substring(0, 50)}...`);
              log(`错误: ${error.message}`);
            }
          }
          log('✅ 数据库结构创建完成');
        } else {
          log(`❌ 错误: 找不到架构文件 ${schemaPath}`);
          return false;
        }
      } else {
        log('✅ 数据库结构已存在，跳过初始化');
      }
    } catch (error) {
      log(`❌ 检查数据库结构失败: ${error.message}`);
      return false;
    }
    
    log('✅ Turso数据库设置完成');
    return true;
  } catch (error) {
    log(`❌ 连接Turso数据库失败: ${error.message}`);
    return false;
  }
}

// 只在Vercel环境中执行
if (isVercel) {
  log('检测到Vercel环境，开始执行数据库初始化...');
  setupTursoDatabase()
    .then(success => {
      if (success) {
        log('🚀 Turso数据库设置成功，可以继续构建过程');
      } else {
        log('⚠️ Turso数据库设置遇到问题，构建可能不完整');
      }
    })
    .catch(error => {
      log(`❌ Turso设置过程出错: ${error.message}`);
      process.exit(1);
    });
} else {
  log('非Vercel环境，跳过数据库初始化');
} 