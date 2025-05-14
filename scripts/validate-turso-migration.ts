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

// 数据库路径
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'blog.db');

async function validateMigration() {
  console.log('开始验证数据迁移...');
  
  if (!fs.existsSync(DB_PATH)) {
    console.error(`错误: 本地数据库文件不存在: ${DB_PATH}`);
    process.exit(1);
  }
  
  // 创建Turso客户端
  const tursoClient = await importTursoClient();
  
  // 打开本地SQLite数据库
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
    
    console.log(`找到${tables.length}个表进行验证`);
    
    let allValid = true;
    let tableValidationResults = [];
    
    for (const table of tables) {
      const tableName = table.name;
      
      try {
        // 获取本地数据库中的行数
        const localCount = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
        
        // 检查Turso数据库中是否存在该表
        let tursoTableExists = true;
        try {
          await tursoClient.execute({ sql: `SELECT 1 FROM ${tableName} LIMIT 1` });
        } catch (error) {
          console.error(`❌ 表 ${tableName} 在Turso中不存在`);
          tursoTableExists = false;
          allValid = false;
          tableValidationResults.push({
            table: tableName,
            valid: false,
            error: 'TABLE_NOT_EXIST'
          });
          continue;
        }
        
        // 获取Turso数据库中的行数
        const tursoResult = await tursoClient.execute({
          sql: `SELECT COUNT(*) as count FROM ${tableName}`
        });
        const tursoCount = Number(tursoResult.rows[0]?.count || 0);
        
        // 比较行数
        const rowsMatch = localCount.count === tursoCount;
        console.log(`表 ${tableName}: 本地=${localCount.count}, Turso=${tursoCount}, 匹配=${rowsMatch ? '✅' : '❌'}`);
        
        if (!rowsMatch) {
          allValid = false;
          tableValidationResults.push({
            table: tableName,
            valid: false,
            error: 'COUNT_MISMATCH',
            localCount: localCount.count,
            tursoCount
          });
        } else {
          tableValidationResults.push({
            table: tableName,
            valid: true,
            localCount: localCount.count
          });
        }
        
        // 对于小表，执行详细内容验证
        if (localCount.count > 0 && localCount.count <= 100) {
          // 获取所有列
          const columnsResult = await db.all(`PRAGMA table_info(${tableName})`);
          const columns = columnsResult.map(col => col.name);
          
          // 获取主键列
          const pkColumns = columnsResult
            .filter(col => col.pk > 0)
            .map(col => col.name);
          
          // 确定排序列
          let orderByClause = '';
          if (pkColumns.length > 0) {
            orderByClause = `ORDER BY ${pkColumns.join(', ')}`;
          } else if (columns.length > 0) {
            orderByClause = `ORDER BY ${columns[0]}`;
          }
          
          // 从两个数据库获取数据并比较
          const localRows = await db.all(`SELECT * FROM ${tableName} ${orderByClause} LIMIT 10`);
          const tursoResult = await tursoClient.execute({
            sql: `SELECT * FROM ${tableName} ${orderByClause} LIMIT 10`
          });
          const tursoRows = tursoResult.rows;
          
          // 检查前10行数据是否匹配
          let dataMatches = true;
          let mismatchDetails = [];
          
          for (let i = 0; i < Math.min(localRows.length, tursoRows.length); i++) {
            const localRow = localRows[i];
            const tursoRow = tursoRows[i];
            
            // 比较每一列
            for (const col of columns) {
              // 特殊处理日期时间字段，可能有微秒差异
              if ((col.includes('_at') || col === 'date') && 
                  localRow[col] && tursoRow[col] && 
                  new Date(localRow[col]).getTime() === new Date(tursoRow[col]).getTime()) {
                continue;
              }
              
              // 正常比较其他字段
              if (localRow[col] !== tursoRow[col]) {
                console.log(`  ❌ 行${i+1}, 列 ${col} 不匹配: 本地=${localRow[col]}, Turso=${tursoRow[col]}`);
                dataMatches = false;
                mismatchDetails.push({
                  row: i+1,
                  column: col,
                  local: localRow[col],
                  turso: tursoRow[col]
                });
              }
            }
          }
          
          if (dataMatches) {
            console.log(`  ✅ 前${Math.min(localRows.length, 10)}行数据内容匹配`);
          } else {
            console.log(`  ❌ 数据内容不完全匹配，发现${mismatchDetails.length}处不同`);
            allValid = false;
            
            // 更新验证结果
            const tableResult = tableValidationResults.find(r => r.table === tableName);
            if (tableResult) {
              tableResult.valid = false;
              tableResult.error = 'DATA_MISMATCH';
              tableResult.mismatchDetails = mismatchDetails;
            }
          }
        }
      } catch (error) {
        console.error(`❌ 验证表 ${tableName} 时发生错误:`, error);
        allValid = false;
        tableValidationResults.push({
          table: tableName,
          valid: false,
          error: 'VALIDATION_ERROR',
          details: error.message
        });
      }
    }
    
    // 汇总报告
    console.log('\n === 验证汇总报告 ===');
    console.log(`总表数: ${tables.length}`);
    console.log(`验证通过: ${tableValidationResults.filter(r => r.valid).length}`);
    console.log(`验证失败: ${tableValidationResults.filter(r => !r.valid).length}`);
    
    if (allValid) {
      console.log('\n✅ 验证成功: 所有表的数据数量一致，抽样数据内容匹配');
    } else {
      console.log('\n❌ 验证失败: 存在不匹配的表或数据');
      
      // 列出失败的表
      const failedTables = tableValidationResults.filter(r => !r.valid);
      if (failedTables.length > 0) {
        console.log('\n失败的表:');
        failedTables.forEach(result => {
          console.log(`- ${result.table}: ${result.error}`);
        });
      }
    }
    
    // 保存验证结果到文件
    const resultPath = path.resolve(process.cwd(), 'data', `validation-result-${Date.now()}.json`);
    fs.writeFileSync(resultPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      success: allValid,
      tables: tableValidationResults
    }, null, 2));
    console.log(`\n验证结果已保存到: ${resultPath}`);
    
  } catch (error) {
    console.error('验证过程中发生错误:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

validateMigration().catch(console.error); 