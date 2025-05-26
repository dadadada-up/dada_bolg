/**
 * 数据库导出脚本
 * 用于将Turso数据库导出为可被Navicat打开的SQLite文件
 * 
 * 使用方法：node scripts/export-for-navicat.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

// 创建导出目录
const exportDir = path.join(__dirname, '..', 'navicat_import');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const sqlFilePath = path.join(exportDir, 'turso_export.sql');
const dbFilePath = path.join(exportDir, 'turso_export.db');

// 直接使用HTTP API执行查询
async function executeQuery(query) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:8080/`;
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result && result[0] && result[0].results) {
            resolve(result[0].results.rows || []);
          } else {
            console.error('无效的响应格式:', result);
            resolve([]);
          }
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

// 获取所有表名
async function getAllTables() {
  try {
    // 手动指定已知的表名
    const knownTables = [
      'posts',
      'categories',
      'tags',
      'post_categories',
      'post_tags',
      'slug_mapping',
      'sync_status'
    ];
    
    console.log('使用已知的表名列表:', knownTables);
    return knownTables;
  } catch (error) {
    console.error('获取表名失败:', error);
    return [];
  }
}

// 导出表到SQL
async function exportTableToSQL(tableName) {
  try {
    console.log(`导出表 ${tableName}...`);
    
    // 获取表结构
    const tableInfo = await executeQuery(`PRAGMA table_info(${tableName})`);
    
    if (!tableInfo || tableInfo.length === 0) {
      console.warn(`表 ${tableName} 没有结构信息`);
      return '';
    }
    
    // 创建表SQL
    let createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    const columns = tableInfo.map(column => {
      let def = `  ${column.name} ${column.type}`;
      if (column.notnull === 1) def += ' NOT NULL';
      if (column.dflt_value !== null) def += ` DEFAULT ${column.dflt_value}`;
      if (column.pk === 1) def += ' PRIMARY KEY';
      return def;
    });
    createTableSQL += columns.join(',\n');
    createTableSQL += '\n);\n\n';
    
    // 获取表数据
    const rows = await executeQuery(`SELECT * FROM ${tableName}`);
    
    if (!rows || rows.length === 0) {
      console.log(`表 ${tableName} 没有数据`);
      return createTableSQL;
    }
    
    // 创建插入语句
    let insertSQL = '';
    for (const row of rows) {
      const columnNames = Object.keys(row).join(', ');
      const values = Object.values(row).map(value => {
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        return value;
      }).join(', ');
      
      insertSQL += `INSERT INTO ${tableName} (${columnNames}) VALUES (${values});\n`;
    }
    
    return createTableSQL + insertSQL;
  } catch (error) {
    console.error(`导出表 ${tableName} 失败:`, error);
    return '';
  }
}

// 使用SQLite3命令创建数据库
function createSQLiteDatabase(sqlFilePath, dbFilePath) {
  try {
    if (fs.existsSync(dbFilePath)) {
      fs.unlinkSync(dbFilePath);
    }
    
    console.log('创建空SQLite数据库文件...');
    fs.writeFileSync(dbFilePath, ''); // 创建空文件
    
    console.log('导入SQL到数据库...');
    // 尝试使用命令行工具
    try {
      execSync(`sqlite3 ${dbFilePath} < ${sqlFilePath}`);
      return true;
    } catch (error) {
      console.error('使用sqlite3命令导入失败:', error.message);
      
      // 如果sqlite3命令不可用，提供手动导入说明
      console.log('\n*** 手动导入步骤 ***');
      console.log('1. 在Navicat中创建新的SQLite数据库连接');
      console.log(`2. 打开SQL文件: ${sqlFilePath}`);
      console.log('3. 执行SQL文件中的所有语句');
      
      return false;
    }
  } catch (error) {
    console.error('创建数据库文件失败:', error);
    return false;
  }
}

// 主函数
async function main() {
  try {
    console.log('开始导出Turso数据库到SQLite文件...');
    
    // 获取所有表
    const tables = await getAllTables();
    console.log(`找到 ${tables.length} 个表:`, tables);
    
    if (tables.length === 0) {
      console.error('没有找到任何表，导出失败');
      return;
    }
    
    // 导出所有表
    let sqlContent = '';
    for (const table of tables) {
      const tableSQL = await exportTableToSQL(table);
      sqlContent += tableSQL + '\n';
    }
    
    // 写入SQL文件
    fs.writeFileSync(sqlFilePath, sqlContent);
    console.log(`SQL文件已保存到: ${sqlFilePath}`);
    
    // 尝试创建SQLite数据库
    const success = createSQLiteDatabase(sqlFilePath, dbFilePath);
    
    if (success) {
      console.log(`\nSQLite数据库文件已创建: ${dbFilePath}`);
      console.log('\n现在你可以使用Navicat打开这个数据库文件了:');
      console.log(`1. 在Navicat中创建新的SQLite连接`);
      console.log(`2. 数据库文件路径: ${dbFilePath}`);
    } else {
      console.log(`\nSQL文件已生成: ${sqlFilePath}`);
      console.log('你可以使用这个SQL文件在Navicat中手动创建数据库');
    }
  } catch (error) {
    console.error('导出失败:', error);
  }
}

// 执行主函数
main(); 