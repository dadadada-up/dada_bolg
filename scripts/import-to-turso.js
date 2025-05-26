/**
 * 将Navicat数据库文件中的数据导入到本地Turso实例中
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');

// 配置
const config = {
  navicatDbPath: path.join(__dirname, '..', 'navicat_import', 'blog_database.db'),
  localTursoUrl: 'http://localhost:8080'
};

// 记录日志
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// 从Navicat数据库文件中读取数据
async function readFromNavicatDb(tableName) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.navicatDbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(`打开Navicat数据库文件失败: ${err.message}`);
        return;
      }
      
      log(`成功打开Navicat数据库文件: ${config.navicatDbPath}`);
      
      db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
        if (err) {
          db.close();
          reject(`读取表 ${tableName} 数据失败: ${err.message}`);
          return;
        }
        
        log(`从表 ${tableName} 读取到 ${rows.length} 行数据`);
        db.close();
        resolve(rows);
      });
    });
  });
}

// 获取Navicat数据库中的所有表
async function getNavicatTables() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.navicatDbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(`打开Navicat数据库文件失败: ${err.message}`);
        return;
      }
      
      log(`成功打开Navicat数据库文件: ${config.navicatDbPath}`);
      
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], (err, rows) => {
        if (err) {
          db.close();
          reject(`读取表列表失败: ${err.message}`);
          return;
        }
        
        const tables = rows.map(row => row.name);
        log(`从Navicat数据库中读取到 ${tables.length} 个表: ${tables.join(', ')}`);
        db.close();
        resolve(tables);
      });
    });
  });
}

// 向本地Turso实例发送查询
async function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      statements: [{ q: query, params: params }]
    });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };
    
    const req = http.request(config.localTursoUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(`解析响应失败: ${error.message}`);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(`请求错误: ${error.message}`);
    });
    
    req.write(requestBody);
    req.end();
  });
}

// 创建表
async function createTable(tableName, columns) {
  try {
    const columnDefs = columns.map(col => {
      let def = `${col.name} ${col.type}`;
      if (col.notnull === 1) def += ' NOT NULL';
      if (col.dflt_value !== null) def += ` DEFAULT ${col.dflt_value}`;
      if (col.pk === 1) def += ' PRIMARY KEY';
      return def;
    });
    
    const createSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs.join(', ')})`;
    await executeQuery(createSQL);
    log(`创建表 ${tableName} 成功`);
    return true;
  } catch (error) {
    log(`创建表 ${tableName} 失败: ${error.message}`);
    return false;
  }
}

// 获取Navicat表结构
async function getNavicatTableStructure(tableName) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.navicatDbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(`打开Navicat数据库文件失败: ${err.message}`);
        return;
      }
      
      db.all(`PRAGMA table_info(${tableName})`, [], (err, rows) => {
        if (err) {
          db.close();
          reject(`获取表 ${tableName} 结构失败: ${err.message}`);
          return;
        }
        
        log(`从Navicat数据库中读取表 ${tableName} 结构: ${rows.length} 列`);
        db.close();
        resolve(rows);
      });
    });
  });
}

// 获取表结构
async function getTableStructure(tableName) {
  try {
    const result = await executeQuery(`PRAGMA table_info(${tableName})`);
    
    if (result && result.error) {
      log(`表 ${tableName} 不存在，需要创建`);
      return [];
    }
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    const columns = result[0].results.rows.map(row => {
      if (Array.isArray(row)) {
        return row[1]; // 列名在第二个位置
      } else if (row && row.name) {
        return row.name;
      }
      return null;
    }).filter(name => name !== null);
    
    return columns;
  } catch (error) {
    log(`获取表 ${tableName} 结构失败: ${error.message}`);
    return [];
  }
}

// 清空表
async function clearTable(tableName) {
  try {
    await executeQuery(`DELETE FROM ${tableName}`);
    log(`已清空表 ${tableName}`);
    return true;
  } catch (error) {
    log(`清空表 ${tableName} 失败: ${error.message}`);
    return false;
  }
}

// 导入数据到表
async function importDataToTable(tableName, data) {
  try {
    if (!data || data.length === 0) {
      log(`表 ${tableName} 没有数据需要导入`);
      return true;
    }
    
    // 获取表结构
    const columns = await getTableStructure(tableName);
    
    // 如果表不存在，创建表
    if (columns.length === 0) {
      log(`表 ${tableName} 不存在，尝试创建`);
      const structure = await getNavicatTableStructure(tableName);
      if (structure.length === 0) {
        throw new Error(`无法获取表 ${tableName} 的结构`);
      }
      
      // 创建表
      await createTable(tableName, structure);
      
      // 重新获取列
      const newColumns = await getTableStructure(tableName);
      if (newColumns.length === 0) {
        throw new Error(`创建表 ${tableName} 后仍无法获取列信息`);
      }
    } else {
      log(`表 ${tableName} 的列: ${columns.join(', ')}`);
      
      // 清空表
      await clearTable(tableName);
    }
    
    // 插入数据
    let successCount = 0;
    for (const row of data) {
      try {
        // 准备列和值，只包含目标表中存在的列
        const availableColumns = await getTableStructure(tableName);
        const rowColumns = Object.keys(row).filter(col => availableColumns.includes(col));
        
        if (rowColumns.length === 0) {
          log(`警告: 行数据中没有与表 ${tableName} 匹配的列`);
          continue;
        }
        
        const placeholders = rowColumns.map(() => '?').join(', ');
        const values = rowColumns.map(col => row[col]);
        
        log(`向表 ${tableName} 插入数据，列: ${rowColumns.join(', ')}`);
        const insertSQL = `INSERT INTO ${tableName} (${rowColumns.join(', ')}) VALUES (${placeholders})`;
        
        await executeQuery(insertSQL, values);
        successCount++;
      } catch (insertError) {
        log(`向表 ${tableName} 插入数据失败: ${insertError.message}`);
      }
    }
    
    log(`成功向表 ${tableName} 插入 ${successCount}/${data.length} 行数据`);
    return true;
  } catch (error) {
    log(`导入数据到表 ${tableName} 失败: ${error.message}`);
    return false;
  }
}

// 获取所有表
async function getAllTables() {
  try {
    const result = await executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    const tables = result[0].results.rows.map(row => {
      if (Array.isArray(row)) {
        return row[0];
      } else if (row && row.name) {
        return row.name;
      }
      return null;
    }).filter(name => name !== null);
    
    return tables;
  } catch (error) {
    log(`获取表列表失败: ${error.message}`);
    return [];
  }
}

// 主函数
async function main() {
  try {
    log('开始将Navicat数据库文件中的数据导入到本地Turso实例中...');
    
    // 检查Navicat数据库文件是否存在
    if (!fs.existsSync(config.navicatDbPath)) {
      throw new Error(`Navicat数据库文件不存在: ${config.navicatDbPath}`);
    }
    
    // 获取Navicat数据库中的所有表
    const navicatTables = await getNavicatTables();
    if (navicatTables.length === 0) {
      throw new Error('Navicat数据库中未找到任何表');
    }
    
    log(`从Navicat数据库中找到 ${navicatTables.length} 个表: ${navicatTables.join(', ')}`);
    
    // 导入顺序：先导入基础表，再导入关联表
    const importOrder = [
      'categories', 'tags', 'posts', 
      'post_categories', 'post_tags', 'slug_mapping', 
      'sync_status', 'users', 'verification_test', 'test'
    ];
    
    // 确保所有表都被导入
    const allTables = [...new Set([...importOrder, ...navicatTables])];
    
    // 按顺序导入
    for (const tableName of allTables) {
      if (navicatTables.includes(tableName)) {
        log(`开始导入表 ${tableName}...`);
        
        try {
          // 读取数据
          const data = await readFromNavicatDb(tableName);
          
          // 导入数据
          await importDataToTable(tableName, data);
        } catch (tableError) {
          log(`处理表 ${tableName} 时出错: ${tableError}`);
        }
      }
    }
    
    // 检查导入结果
    const tursoTables = await getAllTables();
    log(`导入后本地Turso实例中有 ${tursoTables.length} 个表: ${tursoTables.join(', ')}`);
    
    log('数据导入完成');
  } catch (error) {
    log(`导入失败: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main(); 