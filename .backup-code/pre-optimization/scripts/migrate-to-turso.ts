/**
 * 本地SQLite数据迁移到Turso云数据库的工具
 * 
 * 使用方法:
 *   npm run migrate-to-turso          # 执行完整迁移
 *   npm run migrate-to-turso:dry      # 模拟运行，不执行实际迁移
 *   npm run migrate-to-turso:schema   # 仅创建表结构，不迁移数据
 * 
 * 环境变量要求:
 *   TURSO_DATABASE_URL - Turso数据库URL
 *   TURSO_AUTH_TOKEN - Turso访问令牌
 */

import fs from 'fs';
import path from 'path';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { Command } from 'commander';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 配置程序参数
const program = new Command();
program
  .option('--dry-run', '模拟运行，不执行实际迁移')
  .option('--schema-only', '仅创建表结构，不迁移数据')
  .option('--source <path>', '源SQLite数据库路径', './data/blog.db')
  .parse(process.argv);

const options = program.opts();
const isDryRun = options.dryRun || false;
const isSchemaOnly = options.schemaOnly || false;
const sourceDbPath = options.source;

// 检查目标数据库配置
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('错误: 缺少必要的环境变量 TURSO_DATABASE_URL 或 TURSO_AUTH_TOKEN');
  console.error('请在 .env.local 文件中设置这些环境变量');
  process.exit(1);
}

// 检查源数据库是否存在
if (!fs.existsSync(sourceDbPath)) {
  console.error(`错误: 源数据库文件不存在: ${sourceDbPath}`);
  console.error('请确认数据库文件路径正确，或先运行应用以创建数据库');
  process.exit(1);
}

// 创建Turso客户端
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

/**
 * 主迁移函数
 */
async function migrateToTurso() {
  console.log('========== SQLite到Turso迁移工具 ==========');
  console.log(`源数据库: ${sourceDbPath}`);
  console.log(`目标数据库: ${process.env.TURSO_DATABASE_URL}`);
  console.log(`执行模式: ${isDryRun ? '模拟运行' : isSchemaOnly ? '仅结构' : '完整迁移'}`);
  
  // 打开源数据库
  const sourceDb = await open({
    filename: sourceDbPath,
    driver: sqlite3.Database
  });
  
  try {
    // 第1步: 获取表结构
    console.log('\n[1/4] 获取源数据库表结构...');
    const tables = await sourceDb.all(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    );
    
    if (tables.length === 0) {
      console.error('错误: 源数据库中没有找到任何表');
      process.exit(1);
    }
    
    console.log(`找到 ${tables.length} 张表: ${tables.map(t => t.name).join(', ')}`);
    
    // 第2步: 获取每个表的CREATE语句
    console.log('\n[2/4] 获取表创建语句...');
    const tableSchemas = [];
    
    for (const table of tables) {
      const schema = await sourceDb.get(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, 
        table.name
      );
      
      tableSchemas.push({
        name: table.name,
        createSql: schema.sql
      });
      
      console.log(`- 表 ${table.name} 的创建语句已获取`);
    }
    
    // 第3步: 在Turso中创建表结构
    console.log('\n[3/4] 在Turso中创建表结构...');
    
    if (!isDryRun) {
      // 禁用外键约束，以便我们可以安全地删除表
      await tursoClient.execute({ 
        sql: `PRAGMA foreign_keys = OFF;` 
      });
    }
    
    for (const schema of tableSchemas) {
      console.log(`- 正在创建表 ${schema.name}...`);
      
      if (!isDryRun) {
        try {
          // 先尝试删除表（如果存在）
          await tursoClient.execute({ 
            sql: `DROP TABLE IF EXISTS ${schema.name}` 
          });
          
          // 创建表
          await tursoClient.execute({ 
            sql: schema.createSql 
          });
          
          console.log(`  表 ${schema.name} 创建成功`);
        } catch (error) {
          console.error(`  创建表 ${schema.name} 失败:`, error);
          throw error;
        }
      } else {
        console.log(`  [模拟] 将执行SQL: ${schema.createSql}`);
      }
    }
    
    // 如果只需创建表结构，到此结束
    if (isSchemaOnly) {
      console.log('\n表结构已成功迁移到Turso数据库。数据迁移已跳过。');
      return;
    }
    
    // 第4步: 迁移数据
    console.log('\n[4/4] 迁移表数据...');
    
    // 定义表迁移顺序，先迁移主表，后迁移关联表，解决外键约束问题
    const tableOrder = [
      'posts',       // 先迁移文章表
      'categories',  // 再迁移分类表
      'tags',        // 再迁移标签表
      'sync_status', // 其他没有外键约束的表
      'post_categories', // 有外键约束的关联表放后面
      'post_tags',      // 有外键约束的关联表放后面
      'slug_mapping'    // 有外键约束的关联表放后面
    ];
    
    // 确保所有表都在迁移列表中
    const allTableNames = tables.map(t => t.name);
    for (const tableName of allTableNames) {
      if (!tableOrder.includes(tableName)) {
        tableOrder.push(tableName);
      }
    }
    
    if (!isDryRun) {
      // 暂时禁用外键约束，以避免迁移时的约束问题
      await tursoClient.execute({ 
        sql: `PRAGMA foreign_keys = OFF;` 
      });
    }
    
    // 按顺序迁移表数据
    for (const tableName of tableOrder) {
      // 检查表是否在数据库中
      if (!allTableNames.includes(tableName)) {
        console.log(`- 表 ${tableName} 不在源数据库中，跳过`);
        continue;
      }
      
      // 获取表中的数据
      const rows = await sourceDb.all(`SELECT * FROM ${tableName}`);
      console.log(`- 表 ${tableName}: 找到 ${rows.length} 条记录`);
      
      if (rows.length === 0) {
        console.log(`  表 ${tableName} 为空，跳过`);
        continue;
      }
      
      if (!isDryRun) {
        // 获取列名
        const columnsResult = await sourceDb.all(`PRAGMA table_info(${tableName})`);
        const columns = columnsResult.map(col => col.name);
        
        // 批量插入数据
        const chunkSize = 50; // 每批次处理的记录数
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const batch = chunk.map(row => {
            // 构建INSERT语句
            const values = columns.map(col => row[col]);
            const placeholders = columns.map(() => '?').join(', ');
            const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
            return {
              sql,
              args: values
            };
          });
          
          try {
            await tursoClient.batch(batch);
            console.log(`  已导入记录 ${i+1} 至 ${Math.min(i+chunkSize, rows.length)} / ${rows.length}`);
          } catch (error) {
            console.error(`  导入表 ${tableName} 数据失败:`, error);
            throw error;
          }
        }
        
        console.log(`  表 ${tableName} 数据迁移完成`);
      } else {
        console.log(`  [模拟] 将迁移 ${rows.length} 条记录`);
      }
    }
    
    if (!isDryRun) {
      // 重新启用外键约束
      await tursoClient.execute({ 
        sql: `PRAGMA foreign_keys = ON;` 
      });
      
      // 验证数据完整性
      for (const tableName of allTableNames) {
        const sourceCount = (await sourceDb.get(`SELECT COUNT(*) as count FROM ${tableName}`)).count;
        const result = await tursoClient.execute({ 
          sql: `SELECT COUNT(*) as count FROM ${tableName}` 
        });
        const tursoCount = result.rows[0].count;
        
        if (sourceCount !== tursoCount) {
          console.warn(`⚠️ 警告: 表 ${tableName} 的记录数不匹配! 源: ${sourceCount}, Turso: ${tursoCount}`);
        } else {
          console.log(`✓ 表 ${tableName} 记录数验证通过: ${sourceCount} 条记录`);
        }
      }
    }
    
    console.log('\n=== 迁移完成! ===');
    console.log(`${isDryRun ? '[模拟] ' : ''}已成功将 ${tables.length} 张表迁移到Turso数据库`);
    
  } catch (error) {
    console.error('\n迁移过程中出错:', error);
    process.exit(1);
  } finally {
    await sourceDb.close();
  }
}

// 执行迁移
migrateToTurso()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('迁移失败:', err);
    process.exit(1);
  }); 