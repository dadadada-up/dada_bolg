/**
 * Turso数据库客户端
 * 用于在Vercel环境中连接Turso云数据库
 */

import { createClient } from '@libsql/client';
const dbConfig = require('./database-config');

// 检查必要的环境变量
const requiredEnvVars = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && dbConfig.useTurso) {
  console.error(`错误: 缺少Turso数据库连接所需的环境变量: ${missingVars.join(', ')}`);
  console.error('请确保在环境变量中设置TURSO_DATABASE_URL和TURSO_AUTH_TOKEN');
}

// 创建Turso客户端
let tursoClient = null;

/**
 * 获取Turso客户端实例
 * @returns {Object} Turso客户端实例
 */
export function getTursoClient() {
  if (!tursoClient) {
    // 仅在需要使用Turso且环境变量存在时创建客户端
    if (dbConfig.useTurso && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
      tursoClient = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      
      if (dbConfig.logging.queries) {
        console.log(`Turso客户端已初始化，连接到: ${process.env.TURSO_DATABASE_URL}`);
      }
    } else if (dbConfig.useTurso) {
      // 如果配置为使用Turso但缺少环境变量，则抛出错误
      throw new Error('无法初始化Turso客户端: 缺少必要的环境变量');
    } else {
      // 如果配置为不使用Turso，则返回null
      if (dbConfig.logging.queries) {
        console.log('当前配置为不使用Turso，跳过Turso客户端初始化');
      }
      return null;
    }
  }
  
  return tursoClient;
}

/**
 * 执行SQL查询
 * @param {string} sql SQL查询语句
 * @param {Array|Object} params 查询参数
 * @returns {Promise<Object>} 查询结果
 */
export async function executeTursoQuery(sql, params = []) {
  const client = getTursoClient();
  
  if (!client) {
    throw new Error('Turso客户端未初始化');
  }
  
  try {
    if (dbConfig.logging.queries) {
      console.log(`执行Turso查询: ${sql}`, params);
    }
    
    const result = await client.execute({ sql, args: params });
    return result;
  } catch (error) {
    if (dbConfig.logging.errors) {
      console.error('Turso查询执行失败:', error);
      console.error('SQL:', sql);
      console.error('参数:', params);
    }
    throw error;
  }
}

export default {
  getTursoClient,
  executeTursoQuery
}; 