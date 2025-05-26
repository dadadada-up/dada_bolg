/**
 * SQLite文件生成脚本
 * 
 * 将本地Turso数据库导出为SQLite文件，用于在Navicat中查看
 * 使用方法: node scripts/create-sqlite-db.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();

// 配置
const config = {
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
function ensureOutputDir() {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
    log(`创建输出目录: ${config.outputDir}`);
  }
}

// 执行HTTP API查询
async function executeQuery(query) {
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

// 获取所有表
async function getTables() {
  try {
    log('获取表结构...');
    const result = await executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    
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
    const result = await executeQuery(`PRAGMA table_info(${tableName})`);
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    // 打印原始结果以便调试
    log(`表 ${tableName} 结构原始数据: ${JSON.stringify(result[0].results.rows)}`);
    
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
    log(`获取表 ${tableName} 结构失败: ${error.message}`);
    return [];
  }
}

// 获取表数据
async function getTableData(tableName) {
  try {
    const result = await executeQuery(`SELECT * FROM ${tableName}`);
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    // 打印原始结果的第一行以便调试
    if (result[0].results.rows.length > 0) {
      log(`表 ${tableName} 数据第一行原始格式: ${JSON.stringify(result[0].results.rows[0])}`);
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
    log(`获取表 ${tableName} 数据失败: ${error.message}`);
    return [];
  }
}

// 创建SQLite数据库
async function createSQLiteDatabase(tables) {
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
          log(`处理表: ${table}`);
          
          // 获取表结构
          const structure = await getTableStructure(table);
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
              reject(err);
              return;
            }
            log(`创建表 ${table} 成功`);
          });
          
          // 获取表数据
          const data = await getTableData(table);
          if (!data || data.length === 0) {
            log(`表 ${table} 没有数据`);
            continue;
          }
          
          log(`为表 ${table} 插入 ${data.length} 行数据`);
          
          // 插入数据
          for (const row of data) {
            const columns = Object.keys(row);
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map(col => row[col]);
            
            const insertSQL = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
            
            db.run(insertSQL, values, function(err) {
              if (err) {
                log(`向表 ${table} 插入数据失败: ${err.message}`);
                reject(err);
                return;
              }
            });
          }
        } catch (error) {
          log(`处理表 ${table} 时出错: ${error.message}`);
          reject(error);
          return;
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

// 检查本地Turso服务器状态
async function checkLocalServer() {
  try {
    log('检查本地Turso服务器状态...');
    await executeQuery('SELECT 1');
    log('本地Turso服务器正常运行');
    return true;
  } catch (error) {
    log(`本地Turso服务器未运行或无法连接: ${error.message}`);
    log('请确保Docker容器已启动: docker start turso-local');
    return false;
  }
}

// 主函数
async function main() {
  try {
    log('开始创建SQLite数据库文件...');
    
    // 确保输出目录存在
    ensureOutputDir();
    
    // 检查本地服务器
    const localOk = await checkLocalServer();
    if (!localOk) {
      log('无法连接到本地Turso服务器，操作失败');
      process.exit(1);
    }
    
    // 获取所有表
    const tables = await getTables();
    if (!tables || tables.length === 0) {
      log('未找到任何表，操作失败');
      process.exit(1);
    }
    
    // 创建SQLite数据库
    await createSQLiteDatabase(tables);
    
    log('\n===========================');
    log('操作完成!');
    log(`SQLite数据库已创建: ${config.outputFile}`);
    log('现在可以通过Navicat查看数据库内容');
    log('===========================');
  } catch (error) {
    log(`操作失败: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main(); 