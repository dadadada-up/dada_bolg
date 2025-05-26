/**
 * 初始化本地Turso实例
 * 
 * 此脚本将从云端Turso数据库同步数据到本地Turso实例
 * 使用方法: node scripts/init-turso.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

// 手动加载.env文件
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    log(`尝试加载环境变量文件: ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      log(`环境变量文件内容长度: ${envContent.length} 字节`);
      
      const envLines = envContent.split('\n');
      envLines.forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          
          // 移除引号
          if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.replace(/^"|"$/g, '');
          }
          
          process.env[key] = value;
          log(`已设置环境变量: ${key}=${value.substring(0, 5)}...`); // 只显示值的前几个字符，保护敏感信息
        }
      });
      
      log('环境变量加载完成');
      return true;
    } else {
      log('环境变量文件不存在');
      return false;
    }
  } catch (error) {
    log(`加载环境变量文件失败: ${error.message}`);
    return false;
  }
}

// 加载环境变量
loadEnv();

// 配置
const config = {
  cloudUrl: process.env.TURSO_DATABASE_URL || '',
  cloudAuthToken: process.env.TURSO_AUTH_TOKEN || '',
  localUrl: 'http://localhost:8080',
  tempDir: path.join(__dirname, '..', 'data', 'storage', 'temp')
};

// 记录日志
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// 打印配置信息（不包含敏感信息）
log('配置信息:');
log(`云端URL是否存在: ${Boolean(config.cloudUrl)}`);
if (config.cloudUrl) {
  log(`云端URL: ${config.cloudUrl}`);
}
log(`认证令牌是否存在: ${Boolean(config.cloudAuthToken)}`);
if (config.cloudAuthToken) {
  log(`认证令牌长度: ${config.cloudAuthToken.length} 字符`);
}
log(`本地URL: ${config.localUrl}`);
log(`临时目录: ${config.tempDir}`);

// 确保临时目录存在
function ensureTempDir() {
  if (!fs.existsSync(config.tempDir)) {
    fs.mkdirSync(config.tempDir, { recursive: true });
    log(`创建临时目录: ${config.tempDir}`);
  }
}

// 从云端Turso获取数据
async function fetchDataFromCloud(query) {
  return new Promise((resolve, reject) => {
    // 验证配置
    if (!config.cloudUrl || !config.cloudAuthToken) {
      reject(new Error('云端Turso配置缺失，请检查环境变量'));
      return;
    }
    
    // 解析URL
    let url;
    try {
      url = new URL(config.cloudUrl);
      log(`解析URL成功: ${url.hostname}`);
    } catch (error) {
      log(`解析URL失败: ${error.message}`);
      reject(new Error(`无效的URL格式: ${error.message}`));
      return;
    }
    
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.cloudAuthToken}`
      }
    };
    
    log(`准备发送请求到: ${url.hostname}`);
    
    const req = https.request(options, (res) => {
      log(`收到响应状态码: ${res.statusCode}`);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          log(`收到响应数据长度: ${data.length} 字节`);
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          console.error('解析云端响应失败:', error, 'Raw data:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      log(`请求错误: ${error.message}`);
      reject(error);
    });
    
    const requestBody = JSON.stringify({
      statements: [{ q: query }]
    });
    log(`发送请求数据长度: ${requestBody.length} 字节`);
    
    req.write(requestBody);
    req.end();
  });
}

// 向本地Turso发送数据
async function sendDataToLocal(query) {
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
          console.error('解析本地响应失败:', error, 'Raw data:', data);
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

// 获取所有表
async function getTables() {
  try {
    log('获取表结构...');
    const result = await fetchDataFromCloud("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    // 打印原始结果以便调试
    log(`原始表结果: ${JSON.stringify(result[0].results.rows)}`);
    
    // 修复表名解析问题
    const tables = result[0].results.rows.map(row => {
      // 检查是否是数组形式的结果
      if (Array.isArray(row)) {
        return row[0]; // 直接取数组的第一个元素作为表名
      } 
      // 如果是对象形式的结果
      else if (row && row.name) {
        return row.name;
      } 
      // 其他情况，尝试找到可能的表名属性
      else {
        const keys = Object.keys(row || {});
        if (keys.length > 0) {
          log(`找到可能的表名属性: ${keys[0]}, 值: ${row[keys[0]]}`);
          return row[keys[0]];
        }
        log(`无法解析表名: ${JSON.stringify(row)}`);
        return null;
      }
    }).filter(name => name !== null); // 过滤掉null值
    
    log(`找到 ${tables.length} 个表: ${tables.join(', ')}`);
    return tables;
  } catch (error) {
    log(`获取表失败: ${error.message}`);
    throw error;
  }
}

// 获取表结构
async function getTableStructure(tableName) {
  try {
    const result = await fetchDataFromCloud(`PRAGMA table_info(${tableName})`);
    
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
async function getTableData(tableName) {
  try {
    const result = await fetchDataFromCloud(`SELECT * FROM ${tableName}`);
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    return result[0].results.rows;
  } catch (error) {
    log(`获取表 ${tableName} 数据失败: ${error.message}`);
    return [];
  }
}

// 同步表结构和数据
async function syncTable(tableName) {
  log(`开始同步表: ${tableName}`);
  
  // 获取表结构
  const structure = await getTableStructure(tableName);
  if (!structure || structure.length === 0) {
    log(`表 ${tableName} 没有结构信息，跳过`);
    return;
  }
  
  // 删除本地表（如果存在）
  try {
    await sendDataToLocal(`DROP TABLE IF EXISTS ${tableName}`);
    log(`删除本地表 ${tableName}（如果存在）`);
  } catch (error) {
    log(`删除表 ${tableName} 失败: ${error.message}`);
  }
  
  // 创建表
  const columns = structure.map(col => {
    let def = `${col.name} ${col.type}`;
    if (col.notnull === 1) def += ' NOT NULL';
    if (col.dflt_value !== null) def += ` DEFAULT ${col.dflt_value}`;
    if (col.pk === 1) def += ' PRIMARY KEY';
    return def;
  });
  
  const createTableSQL = `CREATE TABLE ${tableName} (${columns.join(', ')})`;
  await sendDataToLocal(createTableSQL);
  log(`创建表 ${tableName} 成功`);
  
  // 获取表数据
  const data = await getTableData(tableName);
  if (!data || data.length === 0) {
    log(`表 ${tableName} 没有数据`);
    return;
  }
  
  log(`为表 ${tableName} 准备插入 ${data.length} 行数据`);
  
  // 批量插入数据
  const batchSize = 100; // 每批处理的行数
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    // 构建批量插入语句
    for (const row of batch) {
      const columns = Object.keys(row);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        return val;
      });
      
      const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
      await sendDataToLocal(insertSQL);
    }
    
    log(`已插入表 ${tableName} 的 ${Math.min((i + batchSize), data.length)} / ${data.length} 行数据`);
  }
  
  log(`表 ${tableName} 同步完成`);
}

// 检查本地Turso服务器状态
async function checkLocalServer() {
  try {
    log('检查本地Turso服务器状态...');
    await sendDataToLocal('SELECT 1');
    log('本地Turso服务器正常运行');
    return true;
  } catch (error) {
    log(`本地Turso服务器未运行或无法连接: ${error.message}`);
    log('请确保Docker容器已启动: docker start turso-local');
    return false;
  }
}

// 检查云端Turso连接
async function checkCloudConnection() {
  try {
    log('检查云端Turso连接...');
    await fetchDataFromCloud('SELECT 1');
    log('云端Turso连接正常');
    return true;
  } catch (error) {
    log(`无法连接到云端Turso: ${error.message}`);
    log('请检查环境变量TURSO_DATABASE_URL和TURSO_AUTH_TOKEN是否正确设置');
    return false;
  }
}

// 主函数
async function main() {
  try {
    log('开始初始化本地Turso实例...');
    
    // 确保临时目录存在
    ensureTempDir();
    
    // 检查本地服务器
    const localOk = await checkLocalServer();
    if (!localOk) {
      log('无法连接到本地Turso服务器，操作失败');
      process.exit(1);
    }
    
    // 检查云端连接
    const cloudOk = await checkCloudConnection();
    if (!cloudOk) {
      log('无法连接到云端Turso，操作失败');
      process.exit(1);
    }
    
    // 获取所有表
    const tables = await getTables();
    if (!tables || tables.length === 0) {
      log('未找到任何表，操作失败');
      process.exit(1);
    }
    
    // 同步每个表
    for (const table of tables) {
      await syncTable(table);
    }
    
    log('\n===========================');
    log('初始化完成!');
    log('本地Turso实例已成功从云端同步');
    log('===========================');
  } catch (error) {
    log(`操作失败: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main(); 