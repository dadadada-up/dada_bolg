/**
 * SQLite到Turso数据库迁移脚本
 * 
 * 用法:
 *   npm run migrate-to-turso        # 完整迁移(结构+数据)
 *   npm run migrate-to-turso:dry    # 模拟运行，不实际写入
 *   npm run migrate-to-turso:schema # 仅迁移数据库结构
 */

// 注意：需要安装以下依赖:
// npm install --save-dev dotenv commander sqlite3 sqlite

import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Command } from 'commander';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config();

// 本地SQLite数据库路径
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'blog.db');

// Turso连接信息
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

// 命令行解析
const program = new Command();
program
  .name('migrate-to-turso')
  .description('将SQLite数据库迁移到Turso云数据库')
  .option('-d, --dry-run', '模拟运行，不实际写入目标数据库', false)
  .option('-s, --schema-only', '仅迁移数据库结构，不迁移数据', false)
  .option('-f, --force', '强制执行，覆盖目标数据库中现有数据', false)
  .parse(process.argv);

const options = program.opts();

/**
 * 主迁移函数
 */
async function migrateToTurso() {
  console.log('开始迁移SQLite数据库到Turso...');

  // 检查环境变量（在模拟运行模式下不强制要求）
  if (!options.dryRun && (!TURSO_URL || !TURSO_TOKEN)) {
    console.error('错误: 未设置TURSO_DATABASE_URL或TURSO_AUTH_TOKEN环境变量');
    console.error('请在.env.local文件中设置这些变量，或参考文档进行设置');
    process.exit(1);
  }

  // 检查本地数据库是否存在
  if (!fs.existsSync(DB_PATH)) {
    console.error(`错误: 本地数据库文件不存在: ${DB_PATH}`);
    process.exit(1);
  }

  console.log(`本地数据库: ${DB_PATH}`);
  console.log(`Turso数据库: ${TURSO_URL || '模拟模式 - 未连接'}`);
  console.log(`迁移模式: ${options.dryRun ? '模拟运行' : options.schemaOnly ? '仅结构' : '完整迁移'}`);

  try {
    // 加载Turso客户端（仅在非模拟模式下）
    let tursoClient;
    if (!options.dryRun) {
      try {
        tursoClient = createClient({
          url: TURSO_URL || '',
          authToken: TURSO_TOKEN
        });
        console.log('✅ 成功连接到Turso数据库');
      } catch (error) {
        console.error('❌ 连接Turso数据库失败:', error);
        process.exit(1);
      }
    } else {
      // 在模拟模式下创建一个模拟客户端
      console.log('🔍 模拟模式：创建模拟Turso客户端');
      tursoClient = {
        execute: async ({ sql, args }: { sql: string; args?: any[] }) => {
          console.log(`[DRY RUN] 将执行: ${sql}`);
          if (args && args.length > 0) {
            console.log(`[DRY RUN] 参数: ${JSON.stringify(args)}`);
          }
          return { rows: [] };
        }
      };
    }

    // 打开本地SQLite数据库
    console.log(`打开本地数据库: ${DB_PATH}`);
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // 创建备份
    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(process.cwd(), 'data', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, `sqlite-backup-${backupTimestamp}.db`);
    
    if (!options.dryRun) {
      fs.copyFileSync(DB_PATH, backupPath);
      console.log(`✅ 备份已创建: ${backupPath}`);
    } else {
      console.log(`[DRY RUN] 将创建备份: ${backupPath}`);
    }

    // 获取所有表
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' 
      ORDER BY name
    `);

    console.log(`找到${tables.length}个表: ${tables.map(t => t.name).join(', ')}`);

    // 迁移表结构
    console.log('\n开始迁移表结构...');
    for (const table of tables) {
      const tableName = table.name;

      // 获取表结构
      const createTableSql = await db.get(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name=?
      `, tableName);

      if (!createTableSql || !createTableSql.sql) {
        console.warn(`⚠️ 警告: 无法获取表 ${tableName} 的创建语句`);
        continue;
      }

      // 执行建表语句
      if (!options.dryRun) {
        try {
          // 如果force选项开启，先删除现有表
          if (options.force) {
            await tursoClient.execute({
              sql: `DROP TABLE IF EXISTS ${tableName}`,
              args: []
            });
            console.log(`已删除现有表: ${tableName}`);
          }

          await tursoClient.execute({
            sql: createTableSql.sql,
            args: []
          });
          console.log(`✅ 创建表: ${tableName}`);
        } catch (error) {
          console.error(`❌ 创建表 ${tableName} 失败:`, error);
        }
      } else {
        console.log(`[DRY RUN] 将执行: ${createTableSql.sql}`);
      }

      // 获取并创建索引
      const indexes = await db.all(`
        SELECT sql FROM sqlite_master 
        WHERE type='index' AND tbl_name=? AND sql IS NOT NULL
      `, tableName);

      for (const index of indexes) {
        if (!options.dryRun) {
          try {
            await tursoClient.execute({
              sql: index.sql,
              args: []
            });
            console.log(`✅ 创建索引: ${index.sql}`);
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
          for (let offset = 0; offset < rowCount; offset += batchSize) {
            const rows = await db.all(
              `SELECT * FROM ${tableName} LIMIT ${batchSize} OFFSET ${offset}`
            );

            // 逐行执行插入
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
                } catch (error) {
                  console.error(`❌ 插入数据到 ${tableName} 失败:`, error);
                }
              } else {
                if (offset === 0 && rows.indexOf(row) === 0) {
                  // 为节省输出，只显示第一行数据
                  console.log(`[DRY RUN] 将执行插入到 ${tableName}`);
                  console.log(`[DRY RUN] 示例SQL: ${insertSql}`);
                  console.log(`[DRY RUN] 示例值: ${JSON.stringify(values)}`);
                }
              }
            }

            console.log(`✅ ${tableName}: 已处理 ${Math.min(offset + rows.length, rowCount)}/${rowCount} 行`);
          }
        }
      }
    }

    // 关闭本地数据库
    await db.close();

    console.log('\n数据库迁移完成!');
    if (options.dryRun) {
      console.log('注意: 这是模拟运行，没有实际修改目标数据库');
    }

    // 建议运行验证脚本
    console.log('\n建议运行 npm run validate-migration 验证迁移结果');

  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行迁移函数
migrateToTurso(); 