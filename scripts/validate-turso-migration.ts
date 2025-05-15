/**
 * 验证SQLite到Turso数据库迁移结果
 * 
 * 用法:
 *   npm run validate-migration
 * 
 * 该脚本检查以下方面:
 * 1. 表结构是否完整迁移
 * 2. 数据行数是否一致
 * 3. 抽样数据内容是否匹配
 */

// 注意：需要安装以下依赖:
// npm install --save-dev dotenv sqlite3 sqlite

import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import { Command } from 'commander';
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
  .name('validate-turso-migration')
  .description('验证SQLite到Turso数据库迁移结果')
  .option('-d, --dry-run', '模拟运行，不执行真实查询', false)
  .parse(process.argv);

const options = program.opts();

/**
 * 主验证函数
 */
async function validateMigration() {
  console.log('开始验证SQLite到Turso的迁移结果...');

  // 检查环境变量 - 在模拟模式下不强制检查
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
  console.log(`验证模式: ${options.dryRun ? '模拟运行' : '实际验证'}`);

  try {
    // 加载Turso客户端
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
          // 模拟返回一些假数据，假设验证成功
          if (sql.includes('COUNT(*)')) {
            return { rows: [{ count: 10 }] };
          }
          return { rows: [{ value: 'mock data' }] };
        }
      };
    }

    // 打开本地SQLite数据库
    console.log(`打开本地数据库: ${DB_PATH}`);
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // 获取所有表
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    console.log(`找到${tables.length}个表: ${tables.map(t => t.name).join(', ')}`);

    // 全局验证结果
    let allValid = true;
    let tableCount = 0;
    let matchingTablesCount = 0;
    let rowsMismatchCount = 0;
    let dataMismatchCount = 0;

    console.log('\n开始验证表和数据...');

    // 遍历验证每个表
    for (const table of tables) {
      const tableName = table.name;
      tableCount++;

      try {
        // 检查表是否存在于Turso中
        let tursoTableExists = true;
        try {
          await tursoClient.execute({
            sql: `SELECT 1 FROM ${tableName} LIMIT 1`
          });
        } catch (error) {
          tursoTableExists = false;
          console.error(`❌ 表 ${tableName} 在Turso中不存在`);
          allValid = false;
          continue;
        }

        // 获取本地数据库中的行数
        const localCountResult = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
        const localCount = localCountResult?.count || 0;

        // 获取Turso数据库中的行数
        const tursoResult = await tursoClient.execute({
          sql: `SELECT COUNT(*) as count FROM ${tableName}`
        });
        const tursoCount = Number(tursoResult.rows[0]?.count || 0);

        // 比较行数
        const rowsMatch = localCount === tursoCount;
        if (rowsMatch) {
          console.log(`✅ 表 ${tableName}: 行数匹配 (${localCount}行)`);
          matchingTablesCount++;
        } else {
          console.log(`❌ 表 ${tableName}: 行数不匹配 (本地=${localCount}, Turso=${tursoCount})`);
          rowsMismatchCount++;
          allValid = false;
        }

        // 对于数据量不太大的表，抽样比较内容
        if (localCount > 0 && localCount < 1000) {
          // 获取表的列信息
          const columnsResult = await db.all(`PRAGMA table_info(${tableName})`);
          const columns = columnsResult.map(col => col.name);

          // 查找主键列作为排序依据
          const pkColumns = columnsResult
            .filter(col => col.pk > 0)
            .map(col => col.name);

          // 使用主键排序，如果没有主键则使用第一列
          const orderBy = pkColumns.length > 0 
            ? pkColumns.join(', ')
            : columns[0];

          // 限制抽样数量
          const sampleSize = Math.min(10, localCount);

          // 从两个数据库获取抽样数据
          const localRows = await db.all(
            `SELECT * FROM ${tableName} ORDER BY ${orderBy} LIMIT ${sampleSize}`
          );

          const tursoSamplesResult = await tursoClient.execute({
            sql: `SELECT * FROM ${tableName} ORDER BY ${orderBy} LIMIT ${sampleSize}`
          });
          const tursoRows = tursoSamplesResult.rows;

          // 比较抽样数据
          let samplesMatch = true;
          let mismatchDetails = [];

          for (let i = 0; i < Math.min(localRows.length, tursoRows.length); i++) {
            const localRow = localRows[i];
            const tursoRow = tursoRows[i];

            // 比较每一列的值
            for (const column of columns) {
              // 简单的值比较，可能需要针对特定类型进行优化
              if (JSON.stringify(localRow[column]) !== JSON.stringify(tursoRow[column])) {
                samplesMatch = false;
                mismatchDetails.push({
                  row: i + 1,
                  column,
                  local: localRow[column],
                  turso: tursoRow[column]
                });
              }
            }
          }

          if (samplesMatch) {
            console.log(`✅ 表 ${tableName}: 抽样数据内容匹配 (${sampleSize}行)`);
          } else {
            console.log(`❌ 表 ${tableName}: 抽样数据内容不匹配`);
            // 显示最多3个不匹配的详情
            for (const detail of mismatchDetails.slice(0, 3)) {
              console.log(`  - 行${detail.row}, 列${detail.column}: 本地="${detail.local}", Turso="${detail.turso}"`);
            }
            if (mismatchDetails.length > 3) {
              console.log(`  - 还有 ${mismatchDetails.length - 3} 个不匹配项...`);
            }
            dataMismatchCount++;
            allValid = false;
          }
        }
      } catch (error) {
        console.error(`❌ 验证表 ${tableName} 时出错:`, error);
        allValid = false;
      }
    }

    // 关闭本地数据库
    await db.close();

    // 显示总结
    console.log('\n验证结果汇总:');
    console.log(`- 总表数: ${tableCount}`);
    console.log(`- 行数匹配的表: ${matchingTablesCount}`);
    console.log(`- 行数不匹配的表: ${rowsMismatchCount}`);
    console.log(`- 数据内容不匹配的表: ${dataMismatchCount}`);

    if (allValid) {
      console.log('\n✅ 验证成功: 所有表的结构和数据已成功迁移');
    } else {
      console.log('\n❌ 验证失败: 存在不匹配的表或数据，请检查上述详细信息');
    }

  } catch (error) {
    console.error('验证过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行验证函数
validateMigration(); 