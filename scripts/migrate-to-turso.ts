import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config();

// 检查是否有必要的环境变量
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('错误: 未设置TURSO_DATABASE_URL或TURSO_AUTH_TOKEN环境变量');
  process.exit(1);
}

// 动态导入@libsql/client以避免构建错误
const importTursoClient = async () => {
  const { createClient } = await import('@libsql/client');
  return createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN
  });
};

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run') || args.includes('-d'),
  schemaOnly: args.includes('--schema-only') || args.includes('-s'),
  force: args.includes('--force') || args.includes('-f'),
};

// 打印使用信息
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
数据库迁移工具: 将SQLite数据库迁移到Turso

选项:
  --dry-run, -d       模拟运行，不实际写入目标数据库
  --schema-only, -s   仅迁移数据库结构，不迁移数据
  --force, -f         强制执行，覆盖目标数据库中现有数据
  --help, -h          显示帮助信息
  `);
  process.exit(0);
}

// 数据库路径
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'blog.db');

async function migrateToTurso() {
  console.log('开始迁移SQLite数据库到Turso...');
  console.log(`选项: ${JSON.stringify(options)}`);
  
  // 创建Turso客户端
  const tursoClient = await importTursoClient();
  
  // 打开本地SQLite数据库
  console.log(`打开本地数据库: ${DB_PATH}`);
  
  if (!fs.existsSync(DB_PATH)) {
    console.error(`错误: 数据库文件不存在: ${DB_PATH}`);
    process.exit(1);
  }
  
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  
  try {
    // 测试Turso连接
    try {
      await tursoClient.execute({ sql: 'SELECT 1' });
      console.log('✅ Turso数据库连接成功');
    } catch (error) {
      console.error('❌ Turso数据库连接失败:', error);
      process.exit(1);
    }
    
    // 获取所有表名
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' 
      ORDER BY name
    `);
    
    console.log(`找到${tables.length}个表: ${tables.map(t => t.name).join(', ')}`);
    
    // 备份当前模式和数据
    console.log('正在创建本地数据库备份...');
    const backupTimestamp = Date.now();
    const backupPath = `${DB_PATH}.backup.${backupTimestamp}`;
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`备份已创建: ${backupPath}`);
    
    // 获取并应用数据库模式
    console.log('获取数据库表结构...');
    for (const table of tables) {
      const tableName = table.name;
      
      // 获取表结构
      const createTableSql = await db.get(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name=?
      `, tableName);
      
      if (!createTableSql || !createTableSql.sql) {
        console.warn(`警告: 无法获取表 ${tableName} 的创建语句`);
        continue;
      }
      
      // 应用表结构到Turso（除非是dry-run模式）
      console.log(`创建表: ${tableName}`);
      if (!options.dryRun) {
        try {
          // 如果force选项开启，先删除现有表
          if (options.force) {
            await tursoClient.execute({
              sql: `DROP TABLE IF EXISTS ${tableName}`
            });
          }
          
          // 创建表
          await tursoClient.execute({ sql: createTableSql.sql });
          console.log(`✅ 表 ${tableName} 创建成功`);
        } catch (error) {
          console.error(`❌ 创建表 ${tableName} 失败:`, error);
          console.error('详细错误:', error);
          // 继续执行，不中断整个迁移过程
        }
      } else {
        console.log(`[DRY RUN] 将执行: ${createTableSql.sql}`);
      }
      
      // 获取索引
      const indexes = await db.all(`
        SELECT sql FROM sqlite_master 
        WHERE type='index' AND tbl_name=? AND sql IS NOT NULL
      `, tableName);
      
      // 应用索引到Turso
      for (const index of indexes) {
        if (!options.dryRun) {
          try {
            await tursoClient.execute({ sql: index.sql });
            console.log(`✅ 索引创建成功: ${index.sql}`);
          } catch (error) {
            console.error(`❌ 创建索引失败:`, error);
          }
        } else {
          console.log(`[DRY RUN] 将执行: ${index.sql}`);
        }
      }
    }
    
    // 如果不是只迁移结构，则迁移数据
    if (!options.schemaOnly) {
      console.log('\n开始迁移数据...');
      
      for (const table of tables) {
        const tableName = table.name;
        
        // 获取表中的数据行数
        const countResult = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = countResult?.count || 0;
        
        console.log(`迁移表 ${tableName} 的数据 (${rowCount}行)...`);
        
        if (rowCount > 0) {
          // 获取所有列
          const columnsResult = await db.all(`PRAGMA table_info(${tableName})`);
          const columns = columnsResult.map(col => col.name);
          
          // 批量获取和插入数据（每批500行）
          const batchSize = 500;
          let successCount = 0;
          let errorCount = 0;
          
          for (let offset = 0; offset < rowCount; offset += batchSize) {
            const rows = await db.all(
              `SELECT * FROM ${tableName} LIMIT ${batchSize} OFFSET ${offset}`
            );
            
            // 对每行数据生成INSERT语句
            for (const row of rows) {
              const placeholders = columns.map(() => '?').join(', ');
              const values = columns.map(col => row[col]);
              
              const insertSql = `
                INSERT INTO ${tableName} (${columns.join(', ')})
                VALUES (${placeholders})
              `;
              
              if (!options.dryRun) {
                try {
                  await tursoClient.execute({
                    sql: insertSql,
                    args: values
                  });
                  successCount++;
                } catch (error) {
                  console.error(`❌ 插入数据到 ${tableName} 失败:`, error);
                  // 只有在特定错误条件下打印详细信息
                  if (errorCount < 3) {
                    console.error('失败的SQL:', insertSql);
                    console.error('失败的值:', values);
                  } else if (errorCount === 3) {
                    console.error('后续错误将不再显示详细信息...');
                  }
                  errorCount++;
                }
              } else {
                successCount++;
                if (offset === 0 && successCount <= 2) {
                  console.log(`[DRY RUN] 将执行插入到 ${tableName}: ${insertSql.substring(0, 100)}...`);
                }
              }
            }
            
            console.log(`✅ ${tableName}: 已处理 ${Math.min(offset + rows.length, rowCount)}/${rowCount} 行`);
          }
          
          console.log(`✅ ${tableName}: 完成 (成功: ${successCount}, 失败: ${errorCount})`);
        }
      }
    }
    
    console.log('\n数据库迁移完成!');
    if (options.dryRun) {
      console.log('注意: 这是模拟运行，没有实际修改目标数据库');
    }
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

migrateToTurso().catch(console.error); 