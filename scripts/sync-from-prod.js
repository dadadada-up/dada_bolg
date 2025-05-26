/**
 * 生产环境数据同步脚本
 * 
 * 从Turso生产环境数据库同步数据到本地开发环境
 * 使用方法: node scripts/sync-from-prod.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 配置
const config = {
  prodUrl: process.env.PROD_DATABASE_URL,
  prodAuthToken: process.env.PROD_DATABASE_TOKEN,
  localUrl: 'http://localhost:8080',
  outputDir: path.join(__dirname, '..', 'navicat_import'),
  schemaFile: path.join(__dirname, '..', 'schema.sql'),
  dataFile: path.join(__dirname, '..', 'data.sql')
};

// 记录日志
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// 执行HTTP API查询 - 本地Turso
async function executeLocalQuery(query) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(config.localUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          console.error('解析响应失败:', error, 'Raw data:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify({
      statements: [{ q: query }]
    }));
    
    req.end();
  });
}

// 执行HTTP API查询 - 生产环境Turso
async function executeProdQuery(query) {
  return new Promise((resolve, reject) => {
    if (!config.prodUrl || !config.prodAuthToken) {
      return reject(new Error('生产环境数据库配置缺失，请检查.env.local文件中的PROD_DATABASE_URL和PROD_DATABASE_TOKEN'));
    }
    
    // 提取主机名和路径
    let url;
    try {
      url = new URL(config.prodUrl);
    } catch (error) {
      return reject(new Error(`无效的数据库URL: ${config.prodUrl}`));
    }
    
    // 构建HTTP请求选项
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.prodAuthToken}`
      }
    };
    
    // 使用正确的URL和端口
    const targetHost = url.hostname;
    const targetPort = url.port || 443;
    const targetPath = url.pathname || '/';
    
    // 确定使用https还是http
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? require('https') : require('http');
    
    log(`连接到生产环境: ${targetHost}:${targetPort}${targetPath}`);
    
    const req = httpModule.request({
      hostname: targetHost,
      port: targetPort,
      path: targetPath,
      method: 'POST',
      headers: options.headers
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          console.error('解析响应失败:', error, 'Raw data:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify({
      statements: [{ q: query }]
    }));
    
    req.end();
  });
}

// 检查本地Turso服务器状态
async function checkLocalServer() {
  try {
    log('检查本地Turso服务器状态...');
    await executeLocalQuery('SELECT 1');
    log('本地Turso服务器正常运行');
    return true;
  } catch (error) {
    log(`本地Turso服务器未运行或无法连接: ${error.message}`);
    log('请确保Docker容器已启动: docker start turso-local');
    return false;
  }
}

// 检查生产环境连接
async function checkProdConnection() {
  try {
    log('检查生产环境Turso连接...');
    await executeProdQuery('SELECT 1');
    log('生产环境Turso连接正常');
    return true;
  } catch (error) {
    log(`无法连接到生产环境Turso: ${error.message}`);
    return false;
  }
}

// 获取生产环境的表结构
async function getProdTables() {
  try {
    log('获取生产环境表结构...');
    const result = await executeProdQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    const tables = result[0].results.rows.map(row => row.name);
    log(`找到 ${tables.length} 个表: ${tables.join(', ')}`);
    return tables;
  } catch (error) {
    log(`获取生产环境表失败: ${error.message}`);
    throw error;
  }
}

// 获取表结构
async function getTableStructure(tableName, isProd = false) {
  try {
    const executeQuery = isProd ? executeProdQuery : executeLocalQuery;
    const result = await executeQuery(`PRAGMA table_info(${tableName})`);
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    return result[0].results.rows;
  } catch (error) {
    log(`获取表 ${tableName} 结构失败: ${error.message}`);
    return [];
  }
}

// 获取表数据
async function getTableData(tableName, isProd = false) {
  try {
    const executeQuery = isProd ? executeProdQuery : executeLocalQuery;
    const result = await executeQuery(`SELECT * FROM ${tableName}`);
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    return result[0].results.rows;
  } catch (error) {
    log(`获取表 ${tableName} 数据失败: ${error.message}`);
    return [];
  }
}

// 生成表的SQL
async function generateTableSQL(tableName) {
  log(`处理表: ${tableName}`);
  
  // 获取生产环境表结构
  const structure = await getTableStructure(tableName, true);
  if (!structure || structure.length === 0) {
    log(`表 ${tableName} 没有结构信息`);
    return '';
  }
  
  // 创建表SQL
  let createSQL = `-- 表: ${tableName}\n`;
  createSQL += `DROP TABLE IF EXISTS ${tableName};\n`;
  createSQL += `CREATE TABLE ${tableName} (\n`;
  
  const columns = structure.map(col => {
    let def = `  ${col.name} ${col.type}`;
    if (col.notnull === 1) def += ' NOT NULL';
    if (col.dflt_value !== null) def += ` DEFAULT ${col.dflt_value}`;
    if (col.pk === 1) def += ' PRIMARY KEY';
    return def;
  });
  
  createSQL += columns.join(',\n');
  createSQL += '\n);\n\n';
  
  // 获取生产环境表数据
  const data = await getTableData(tableName, true);
  if (!data || data.length === 0) {
    log(`表 ${tableName} 没有数据`);
    return createSQL;
  }
  
  // 生成INSERT语句
  log(`为表 ${tableName} 生成 ${data.length} 行数据`);
  
  for (const row of data) {
    const columns = Object.keys(row).join(', ');
    const values = Object.values(row).map(value => {
      if (value === null) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      return value;
    }).join(', ');
    
    createSQL += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
  }
  
  return createSQL + '\n';
}

// 将生成的SQL导入到本地数据库
async function importSQLToLocal(sqlContent) {
  // 保存SQL文件
  fs.writeFileSync(config.schemaFile, sqlContent, 'utf8');
  log(`SQL文件已保存到: ${config.schemaFile}`);
  
  // 执行SQL文件
  try {
    log('正在将SQL导入到本地数据库...');
    const queries = sqlContent.split(';').filter(q => q.trim());
    
    for (const query of queries) {
      if (query.trim()) {
        await executeLocalQuery(query);
      }
    }
    
    log('SQL导入完成');
    return true;
  } catch (error) {
    log(`导入SQL失败: ${error.message}`);
    return false;
  }
}

// 主函数
async function main() {
  try {
    log('开始从生产环境同步数据到本地开发环境...');
    
    // 检查本地服务器和生产环境连接
    const localOk = await checkLocalServer();
    if (!localOk) {
      log('无法连接到本地Turso服务器，同步失败');
      process.exit(1);
    }
    
    const prodOk = await checkProdConnection();
    if (!prodOk) {
      log('无法连接到生产环境Turso，同步失败');
      process.exit(1);
    }
    
    // 获取生产环境的表
    const tables = await getProdTables();
    if (!tables || tables.length === 0) {
      log('未找到任何表，同步失败');
      process.exit(1);
    }
    
    // 生成SQL
    let sqlContent = '-- 自动生成的同步SQL\n';
    sqlContent += `-- 同步时间: ${new Date().toISOString()}\n\n`;
    sqlContent += 'PRAGMA foreign_keys = OFF;\n';
    sqlContent += 'BEGIN TRANSACTION;\n\n';
    
    for (const table of tables) {
      const tableSQL = await generateTableSQL(table);
      sqlContent += tableSQL;
    }
    
    sqlContent += '\nCOMMIT;\n';
    sqlContent += 'PRAGMA foreign_keys = ON;\n';
    
    // 导入到本地数据库
    const importOk = await importSQLToLocal(sqlContent);
    if (!importOk) {
      log('导入数据失败');
      process.exit(1);
    }
    
    // 创建Navicat可用的SQLite文件
    log('正在创建Navicat可用的SQLite文件...');
    await execSync('node scripts/create-sqlite-db.js');
    
    log('\n===========================');
    log('同步完成!');
    log('生产环境数据已同步到本地开发环境');
    log('可通过Navicat查看: /navicat_import/blog_database.db');
    log('===========================');
  } catch (error) {
    log(`同步失败: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main(); 