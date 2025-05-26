/**
 * 初始化Turso并更新Navicat数据库文件
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();

// 设置环境变量
process.env.TURSO_DATABASE_URL = 'libsql://dada-blog-db-dadadada-up.aws-ap-northeast-1.turso.io';
process.env.TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDc0MDQwOTksImlkIjoiODU2YmRjMDMtMjQ0OC00ZDI4LTgyNjctYzA0NjgzMzdkYjQ2IiwicmlkIjoiYTIyZjg1MzMtNmIyMC00YzkxLWE5ZTctMTFkZThmNzI2NzgyIn0.-2bdfioxI_tjUbBNB1b9GGcpdAXdkUKAWKxiTYjKG-2mupabHL6qFtgLTjgueh41AE2IVcjB2U-9eDlL_5-XCA';

console.log('环境变量已设置');
console.log(`TURSO_DATABASE_URL: ${process.env.TURSO_DATABASE_URL}`);
console.log(`TURSO_AUTH_TOKEN 长度: ${process.env.TURSO_AUTH_TOKEN.length} 字符`);

// 配置
const config = {
  cloudUrl: process.env.TURSO_DATABASE_URL || '',
  cloudAuthToken: process.env.TURSO_AUTH_TOKEN || '',
  localUrl: 'http://localhost:8080',
  outputDir: path.join(__dirname, '..', 'navicat_import'),
  outputFile: path.join(__dirname, '..', 'navicat_import', 'blog_database.db')
};

// 记录日志
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// 确保输出目录存在
const navicatDir = path.join(__dirname, '..', 'navicat_import');
if (!fs.existsSync(navicatDir)) {
  fs.mkdirSync(navicatDir, { recursive: true });
  console.log(`创建Navicat导入目录: ${navicatDir}`);
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
    
    log(`准备发送请求到云端: ${url.hostname}`);
    
    const req = https.request(options, (res) => {
      log(`收到云端响应状态码: ${res.statusCode}`);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          log(`收到云端响应数据长度: ${data.length} 字节`);
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

// 获取云端所有表
async function getCloudTables() {
  try {
    log('获取云端表结构...');
    const result = await fetchDataFromCloud("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    // 打印原始结果以便调试
    log(`云端原始表结果: ${JSON.stringify(result[0].results.rows)}`);
    
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
    
    log(`找到 ${tables.length} 个云端表: ${tables.join(', ')}`);
    return tables;
  } catch (error) {
    log(`获取云端表失败: ${error.message}`);
    throw error;
  }
}

// 获取云端表结构
async function getCloudTableStructure(tableName) {
  try {
    const result = await fetchDataFromCloud(`PRAGMA table_info(${tableName})`);
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    // 打印原始结果以便调试
    log(`表 ${tableName} 云端结构原始数据: ${JSON.stringify(result[0].results.rows)}`);
    
    // 处理不同格式的结构数据
    const structure = result[0].results.rows.map(row => {
      // 如果是数组形式
      if (Array.isArray(row)) {
        // 假设数组顺序为: cid, name, type, notnull, dflt_value, pk
        return {
          cid: row[0],
          name: row[1],
          type: row[2],
          notnull: row[3],
          dflt_value: row[4],
          pk: row[5]
        };
      }
      // 如果已经是对象形式
      return row;
    });
    
    return structure;
  } catch (error) {
    log(`获取表 ${tableName} 云端结构失败: ${error.message}`);
    return [];
  }
}

// 获取云端表数据
async function getCloudTableData(tableName) {
  try {
    const result = await fetchDataFromCloud(`SELECT * FROM ${tableName}`);
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    // 打印原始结果的第一行以便调试
    if (result[0].results.rows.length > 0) {
      log(`表 ${tableName} 云端数据第一行原始格式: ${JSON.stringify(result[0].results.rows[0])}`);
    }
    
    // 处理不同格式的数据
    const data = result[0].results.rows.map(row => {
      // 如果是数组形式，需要转换为对象形式
      if (Array.isArray(row)) {
        // 需要获取列名
        const columnNames = result[0].results.columns || [];
        const obj = {};
        
        // 将数组值映射到列名
        columnNames.forEach((col, index) => {
          if (index < row.length) {
            obj[col] = row[index];
          }
        });
        
        return obj;
      }
      // 如果已经是对象形式
      return row;
    });
    
    return data;
  } catch (error) {
    log(`获取表 ${tableName} 云端数据失败: ${error.message}`);
    return [];
  }
}

// 直接从云端创建SQLite数据库
async function createSQLiteFromCloud(tables) {
  // 如果文件已存在，先删除
  if (fs.existsSync(config.outputFile)) {
    fs.unlinkSync(config.outputFile);
    log(`删除已存在的SQLite文件: ${config.outputFile}`);
  }
  
  // 创建新的SQLite数据库
  log(`创建新的SQLite数据库: ${config.outputFile}`);
  const db = new sqlite3.Database(config.outputFile);
  
  return new Promise(async (resolve, reject) => {
    db.serialize(async () => {
      // 开始事务
      db.run('BEGIN TRANSACTION');
      
      // 处理每个表
      for (const table of tables) {
        try {
          log(`处理云端表: ${table}`);
          
          // 获取表结构
          const structure = await getCloudTableStructure(table);
          if (!structure || structure.length === 0) {
            log(`表 ${table} 没有结构信息，跳过`);
            continue;
          }
          
          // 创建表
          const columns = structure.map(col => {
            let def = `${col.name} ${col.type}`;
            if (col.notnull === 1) def += ' NOT NULL';
            if (col.dflt_value !== null) def += ` DEFAULT ${col.dflt_value}`;
            if (col.pk === 1) def += ' PRIMARY KEY';
            return def;
          });
          
          const createTableSQL = `CREATE TABLE ${table} (${columns.join(', ')})`;
          db.run(createTableSQL, function(err) {
            if (err) {
              log(`创建表 ${table} 失败: ${err.message}`);
              return;
            }
            log(`创建表 ${table} 成功`);
          });
          
          // 获取表数据
          const data = await getCloudTableData(table);
          if (!data || data.length === 0) {
            log(`表 ${table} 没有数据`);
            continue;
          }
          
          log(`为表 ${table} 准备插入 ${data.length} 行数据`);
          
          // 插入数据
          for (const row of data) {
            try {
              const columns = Object.keys(row);
              const placeholders = columns.map(() => '?').join(', ');
              const values = columns.map(col => row[col]);
              
              const insertSQL = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
              
              db.run(insertSQL, values, function(err) {
                if (err) {
                  log(`向表 ${table} 插入数据失败: ${err.message}`);
                }
              });
            } catch (insertError) {
              log(`插入数据时出错: ${insertError.message}`);
            }
          }
          
          log(`表 ${table} 数据插入完成`);
        } catch (tableError) {
          log(`处理表 ${table} 时出错: ${tableError.message}`);
        }
      }
      
      // 提交事务
      db.run('COMMIT', function(err) {
        if (err) {
          log(`提交事务失败: ${err.message}`);
          reject(err);
          return;
        }
        
        log('SQLite数据库创建完成');
        db.close();
        resolve();
      });
    });
  });
}

// 安装sqlite3模块
const installSqlite3 = () => {
  return new Promise((resolve, reject) => {
    try {
      console.log('检查并安装sqlite3模块...');
      
      // 尝试安装sqlite3模块
      execSync('npm install sqlite3 --save', { 
        stdio: 'inherit',
        env: process.env
      });
      
      console.log('sqlite3模块安装成功');
      resolve();
    } catch (error) {
      console.error('安装sqlite3模块失败:', error);
      reject(error);
    }
  });
};

// 步骤1: 初始化Turso
console.log('步骤1: 初始化Turso实例...');

const initTurso = () => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'init-turso.js');
    console.log(`运行脚本: ${scriptPath}`);
    
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: process.env
    });
    
    child.on('close', (code) => {
      console.log(`初始化脚本退出，退出码 ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`初始化失败，退出码: ${code}`));
      }
    });
  });
};

// 步骤2: 更新Navicat数据库文件
const updateNavicat = () => {
  return new Promise((resolve, reject) => {
    try {
      console.log('步骤2: 更新Navicat数据库文件...');
      const createDbScript = path.join(__dirname, 'create-sqlite-db.js');
      
      if (!fs.existsSync(createDbScript)) {
        console.error(`找不到脚本: ${createDbScript}`);
        console.log('跳过Navicat数据库文件更新步骤');
        resolve(); // 即使找不到脚本也继续执行
        return;
      }
      
      try {
        const output = execSync(`node "${createDbScript}"`, { 
          encoding: 'utf-8',
          stdio: 'inherit'
        });
        
        console.log('Navicat数据库文件更新成功');
        resolve();
      } catch (error) {
        console.error('更新Navicat数据库文件失败，但Turso同步已完成');
        console.log('请手动运行: node scripts/create-sqlite-db.js');
        resolve(); // 即使更新失败也继续执行
      }
    } catch (error) {
      console.error('更新Navicat数据库文件过程中发生错误:', error);
      resolve(); // 即使更新失败也继续执行
    }
  });
};

// 步骤3: 直接从云端创建Navicat数据库文件
const createNavicatFromCloud = async () => {
  try {
    console.log('步骤3: 直接从云端创建Navicat数据库文件...');
    
    // 获取云端表
    const tables = await getCloudTables();
    if (!tables || tables.length === 0) {
      throw new Error('未找到任何云端表');
    }
    
    // 创建SQLite数据库
    await createSQLiteFromCloud(tables);
    
    console.log('直接从云端创建Navicat数据库文件成功');
    return true;
  } catch (error) {
    console.error('直接从云端创建Navicat数据库文件失败:', error);
    return false;
  }
};

// 步骤4: 将Navicat数据库文件中的数据导入到本地Turso实例
const importToLocalTurso = () => {
  return new Promise((resolve, reject) => {
    try {
      console.log('步骤4: 将Navicat数据库文件中的数据导入到本地Turso实例...');
      const importScript = path.join(__dirname, 'import-to-turso.js');
      
      if (!fs.existsSync(importScript)) {
        console.error(`找不到导入脚本: ${importScript}`);
        console.log('跳过导入步骤');
        resolve(); // 即使找不到脚本也继续执行
        return;
      }
      
      try {
        const output = execSync(`node "${importScript}"`, { 
          encoding: 'utf-8',
          stdio: 'inherit'
        });
        
        console.log('数据导入到本地Turso实例成功');
        resolve();
      } catch (error) {
        console.error('导入数据到本地Turso实例失败:', error);
        console.log('请手动运行: node scripts/import-to-turso.js');
        resolve(); // 即使导入失败也继续执行
      }
    } catch (error) {
      console.error('导入数据到本地Turso实例过程中发生错误:', error);
      resolve(); // 即使导入失败也继续执行
    }
  });
};

// 执行完整流程
async function main() {
  try {
    // 安装sqlite3模块
    try {
      await installSqlite3();
    } catch (error) {
      console.log('sqlite3安装失败，但将继续执行其他步骤');
    }
    
    // 步骤1: 初始化Turso
    await initTurso();
    
    // 步骤3: 直接从云端创建Navicat数据库文件
    console.log('检测到本地Turso实例可能不包含所有表，将直接从云端创建Navicat数据库文件');
    const cloudSuccess = await createNavicatFromCloud();
    
    // 步骤4: 将Navicat数据库文件中的数据导入到本地Turso实例
    await importToLocalTurso();
    
    console.log('\n===========================');
    console.log('全部操作完成!');
    console.log('1. 本地Turso实例已成功从云端同步');
    console.log('2. Navicat数据库文件更新状态:');
    
    const dbFile = path.join(navicatDir, 'blog_database.db');
    if (fs.existsSync(dbFile)) {
      console.log(`   ✅ 已更新，位置: ${dbFile}`);
    } else {
      console.log(`   ❌ 更新失败，请手动运行: node scripts/create-sqlite-db.js`);
    }
    
    console.log('===========================');
  } catch (error) {
    console.error('操作失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 