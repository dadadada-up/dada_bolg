/**
 * 内容同步工具
 * 
 * 此脚本将本地Turso数据库内容同步到生产环境
 */

const { createClient } = require('@libsql/client');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.development.local' });

// 获取命令行参数
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
let tablesToSync = [];

// 解析要同步的表
const tablesArg = args.find(arg => arg.startsWith('--tables='));
if (tablesArg) {
  tablesToSync = tablesArg.replace('--tables=', '').split(',');
}

// 配置
const config = {
  localDbUrl: process.env.DEV_DATABASE_URL || 'http://localhost:8080',
  prodDbUrl: process.env.PROD_DATABASE_URL,
  prodDbToken: process.env.PROD_DATABASE_TOKEN,
  backupDir: path.join(__dirname, '../backups'),
  maxBackups: 5
};

// 创建客户端
async function createClients() {
  const localClient = createClient({
    url: config.localDbUrl
  });

  if (!config.prodDbUrl || !config.prodDbToken) {
    throw new Error('未配置生产环境数据库URL或认证令牌');
  }

  const prodClient = createClient({
    url: config.prodDbUrl,
    authToken: config.prodDbToken
  });

  return { localClient, prodClient };
}

// 获取所有表
async function getAllTables(client) {
  const result = await client.execute(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `);
  return result.rows.map(row => row.name);
}

// 导出表结构
async function exportTableSchema(client, table) {
  const result = await client.execute(`
    SELECT sql FROM sqlite_master 
    WHERE type='table' AND name='${table}'
  `);
  return result.rows[0].sql;
}

// 导出表数据
async function exportTableData(client, table) {
  const data = await client.execute(`SELECT * FROM ${table}`);
  return data.rows;
}

// 将数据转换为INSERT语句
function generateInsertStatements(table, data) {
  if (!data || data.length === 0) return [];

  const statements = [];
  
  for (const row of data) {
    const columns = Object.keys(row).join(', ');
    const values = Object.values(row)
      .map(val => {
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        return val;
      })
      .join(', ');
    
    statements.push(`INSERT INTO ${table} (${columns}) VALUES (${values});`);
  }

  return statements;
}

// 创建备份
async function createBackup(schemas, dataStatements) {
  try {
    // 确保备份目录存在
    await fs.mkdir(config.backupDir, { recursive: true });
    
    // 创建备份文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(config.backupDir, `backup-${timestamp}.sql`);
    
    // 组合SQL语句
    const sql = [
      '-- 自动生成的备份',
      `-- 创建时间: ${new Date().toISOString()}`,
      '',
      '-- 表结构',
      ...schemas,
      '',
      '-- 表数据',
      ...dataStatements
    ].join('\n');
    
    // 写入文件
    await fs.writeFile(backupFile, sql);
    console.log(`备份已创建: ${backupFile}`);
    
    // 清理旧备份
    await cleanupOldBackups();
    
    return backupFile;
  } catch (error) {
    console.error('创建备份失败:', error);
    throw error;
  }
}

// 清理旧备份
async function cleanupOldBackups() {
  try {
    const files = await fs.readdir(config.backupDir);
    const backups = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(config.backupDir, file),
        time: fs.stat(path.join(config.backupDir, file)).then(stat => stat.mtime.getTime())
      }));
    
    // 获取文件时间
    for (const backup of backups) {
      backup.time = await backup.time;
    }
    
    // 按时间排序
    backups.sort((a, b) => b.time - a.time);
    
    // 删除旧文件
    if (backups.length > config.maxBackups) {
      const toDelete = backups.slice(config.maxBackups);
      for (const backup of toDelete) {
        await fs.unlink(backup.path);
        console.log(`已删除旧备份: ${backup.name}`);
      }
    }
  } catch (error) {
    console.error('清理旧备份失败:', error);
  }
}

// 应用SQL到生产环境
async function applyToProduction(client, schemas, dataStatements) {
  try {
    console.log('正在将更改应用到生产环境...');
    
    // 开始事务
    await client.execute('BEGIN TRANSACTION');
    
    // 应用模式
    for (const schema of schemas) {
      console.log(`应用表结构: ${schema.substring(0, 50)}...`);
      await client.execute(schema);
    }
    
    // 应用数据
    console.log(`正在插入 ${dataStatements.length} 条数据记录...`);
    for (const statement of dataStatements) {
      await client.execute(statement);
    }
    
    // 提交事务
    await client.execute('COMMIT');
    
    console.log('同步完成!');
  } catch (error) {
    console.error('同步失败:', error);
    // 回滚事务
    await client.execute('ROLLBACK');
    throw error;
  }
}

// 主函数
async function main() {
  try {
    console.log('内容同步工具启动');
    console.log(`模式: ${isDryRun ? '试运行 (不会实际同步)' : '实际同步'}`);
    
    // 创建客户端
    const { localClient, prodClient } = await createClients();
    console.log('已连接到本地和生产数据库');
    
    // 获取要同步的表
    let tables = tablesToSync;
    if (tables.length === 0) {
      tables = await getAllTables(localClient);
    }
    console.log(`将同步以下表: ${tables.join(', ')}`);
    
    // 收集表结构和数据
    const schemas = [];
    const dataStatements = [];
    
    for (const table of tables) {
      console.log(`处理表: ${table}`);
      
      // 获取表结构
      const schema = await exportTableSchema(localClient, table);
      schemas.push(schema);
      
      // 获取表数据
      const data = await exportTableData(localClient, table);
      const statements = generateInsertStatements(table, data);
      dataStatements.push(...statements);
      
      console.log(`表 ${table}: ${data.length} 行数据`);
    }
    
    // 创建备份
    const backupFile = await createBackup(schemas, dataStatements);
    
    // 如果不是试运行，应用到生产环境
    if (!isDryRun) {
      await applyToProduction(prodClient, schemas, dataStatements);
    } else {
      console.log('试运行模式 - 跳过应用到生产环境');
      console.log(`备份文件已创建: ${backupFile}`);
    }
  } catch (error) {
    console.error('同步过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 