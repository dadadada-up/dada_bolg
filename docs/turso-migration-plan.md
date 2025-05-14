# Turso数据库迁移方案

## 1. 概述

本文档描述了将博客系统从本地SQLite数据库迁移到Turso分布式SQLite云服务的详细计划。迁移过程将确保所有现有数据安全迁移且功能正常工作。

## 2. 前期准备

### 2.1 Turso账户设置

1. 注册Turso账户：访问[Turso官网](https://turso.tech)注册账户
2. 安装Turso CLI：
   ```bash
   # 使用Homebrew安装（macOS）
   brew install tursodatabase/tap/turso
   
   # 或使用npm安装
   npm install -g turso
   ```
3. CLI登录：
   ```bash
   turso auth login
   ```

### 2.2 创建Turso数据库

```bash
# 创建新数据库
turso db create dada-blog-db

# 验证数据库创建成功
turso db list
```

### 2.3 配置全球数据分布（可选）

```bash
# 查看可用区域
turso db locations

# 在其他区域创建副本，提高全球访问速度
turso db locations add dada-blog-db sin  # 新加坡
turso db locations add dada-blog-db syd  # 悉尼
```

## 3. 依赖安装与配置

### 3.1 安装所需依赖

```bash
# 安装Turso客户端和Prisma适配器（如果决定使用Prisma）
npm install @libsql/client

# 如果决定使用Prisma ORM
npm install prisma @prisma/client
npm install @prisma/adapter-libsql

# 用于数据迁移的工具
npm install -D drizzle-kit @libsql/sqlite
```

### 3.2 环境变量配置

创建`.env.local`文件（如果尚不存在）并添加以下配置：

```env
# Turso数据库连接信息
TURSO_DATABASE_URL=libsql://dada-blog-db-xxxxx.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here

# 本地开发环境仍使用SQLite文件
DATABASE_URL=file:./data/blog.db
```

获取连接URL和认证令牌：
```bash
# 获取数据库URL
turso db show dada-blog-db --url

# 创建认证令牌
turso db tokens create dada-blog-db
```

## 4. 数据库适配器实现

### 4.1 创建Turso客户端适配器

创建文件：`src/lib/db/turso-client.ts`：

```typescript
import { createClient } from '@libsql/client';
import { isVercelEnv } from '@/lib/env';

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN,
  // 可选：使用内嵌副本以获得最佳性能
  syncUrl: process.env.NODE_ENV === 'production' 
    ? process.env.TURSO_DATABASE_URL 
    : undefined,
});

// 记录数据库连接信息（仅开发环境）
if (process.env.NODE_ENV !== 'production') {
  console.log(`[数据库] 使用Turso数据库: ${process.env.TURSO_DATABASE_URL}`);
}

export default tursoClient;
```

### 4.2 更新数据库访问逻辑

修改`src/lib/db/database.ts`文件，添加Turso支持：

```typescript
import path from 'path';
import fs from 'fs';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { isVercelEnv } from '@/lib/env';
import tursoClient from './turso-client';

// 数据库文件路径（本地开发用）
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'blog.db');

// 是否使用Turso
const useTurso = !!process.env.TURSO_DATABASE_URL && !!process.env.TURSO_AUTH_TOKEN;

// 打印数据库连接信息
if (useTurso) {
  console.log(`[数据库] 使用Turso云数据库`);
} else {
  console.log(`[数据库] 使用本地SQLite数据库: ${DB_PATH}`);
}

// 创建一个Turso数据库包装类，保持与现有SQLite接口兼容
class TursoDatabase implements Database {
  // 实现所有Database接口方法，将调用转发到tursoClient
  async exec(sql: string): Promise<void> {
    await tursoClient.execute(sql);
  }

  async run(sql: string, ...params: any[]): Promise<any> {
    return await tursoClient.execute({ sql, args: params });
  }

  async get(sql: string, ...params: any[]): Promise<any> {
    const result = await tursoClient.execute({ sql, args: params });
    return result.rows[0] || null;
  }

  async all(sql: string, ...params: any[]): Promise<any[]> {
    const result = await tursoClient.execute({ sql, args: params });
    return result.rows;
  }

  // 实现其他必要方法...
  async close(): Promise<void> {
    // Turso客户端不需要显式关闭
  }

  // 返回Turso原始客户端，用于特殊情况
  getRawClient() {
    return tursoClient;
  }
}

// 单例数据库实例
let dbInstance: Database | null = null;

/**
 * 获取数据库连接
 */
export async function getDatabase(): Promise<Database> {
  // 在Vercel构建时始终使用模拟数据库
  if (isVercelEnv()) {
    console.log('[数据库] Vercel环境，使用模拟数据库');
    return createMockDatabase();
  }
  
  if (!dbInstance) {
    await initializeDatabase();
  }
  return dbInstance!;
}

/**
 * 初始化数据库连接
 */
export async function initializeDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    if (useTurso) {
      // 使用Turso数据库
      console.log('[数据库] 初始化Turso数据库连接');
      dbInstance = new TursoDatabase();
      console.log('[数据库] Turso数据库初始化成功');
    } else {
      // 使用本地SQLite
      console.log(`[数据库] 初始化本地SQLite数据库: ${DB_PATH}`);
      
      // 确保数据目录存在
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // 打开数据库连接
      dbInstance = await open({
        filename: DB_PATH,
        driver: sqlite3.Database,
      });

      // 启用外键约束
      await dbInstance.exec('PRAGMA foreign_keys = ON');
      
      console.log('[数据库] 本地SQLite数据库初始化成功');
    }
    
    return dbInstance;
  } catch (error) {
    console.error('[数据库] 初始化失败:', error);
    throw error;
  }
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    if (!useTurso) {
      // 只对本地SQLite连接执行关闭
      await (dbInstance as any).close?.();
    }
    dbInstance = null;
    console.log('[数据库] 连接已关闭');
  }
}

/**
 * 创建模拟数据库（用于Vercel构建过程）
 */
function createMockDatabase(): Database {
  // 模拟数据库实现代码，保持不变...
}
```

## 5. 数据迁移实现

### 5.1 创建数据库迁移脚本

创建文件：`scripts/migrate-to-turso.ts`

```typescript
import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Command } from 'commander';
import dotenv from 'dotenv';
import tursoClient from '../src/lib/db/turso-client';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config();

const DB_PATH = path.resolve(process.cwd(), 'data', 'blog.db');

const program = new Command();

program
  .name('migrate-to-turso')
  .description('将SQLite数据库迁移到Turso云数据库')
  .option('-d, --dry-run', '模拟运行，不实际写入目标数据库', false)
  .option('-s, --schema-only', '仅迁移数据库结构，不迁移数据', false)
  .option('-f, --force', '强制执行，覆盖目标数据库中现有数据', false)
  .parse(process.argv);

const options = program.opts();

async function migrateToTurso() {
  console.log('开始迁移SQLite数据库到Turso...');
  
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('错误: 未设置TURSO_DATABASE_URL或TURSO_AUTH_TOKEN环境变量');
    process.exit(1);
  }
  
  // 打开本地SQLite数据库
  console.log(`打开本地数据库: ${DB_PATH}`);
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  
  try {
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
                } catch (error) {
                  console.error(`❌ 插入数据到 ${tableName} 失败:`, error);
                  console.error('失败的SQL:', insertSql);
                  console.error('失败的值:', values);
                }
              } else {
                console.log(`[DRY RUN] 将执行插入到 ${tableName}`);
              }
            }
            
            console.log(`✅ ${tableName}: 已处理 ${Math.min(offset + rows.length, rowCount)}/${rowCount} 行`);
          }
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
```

### 5.2 配置迁移命令

在`package.json`的`scripts`部分添加：

```json
"migrate-to-turso": "ts-node scripts/migrate-to-turso.ts",
"migrate-to-turso:dry": "ts-node scripts/migrate-to-turso.ts --dry-run",
"migrate-to-turso:schema": "ts-node scripts/migrate-to-turso.ts --schema-only"
```

## 6. 数据迁移执行计划

### 6.1 测试环境迁移

1. 安装所需依赖：
   ```bash
   npm install @libsql/client dotenv commander
   ```

2. 添加必要的环境变量（`.env.local`）：
   ```
   TURSO_DATABASE_URL=libsql://your-db-url.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   ```

3. 执行模拟迁移：
   ```bash
   npm run migrate-to-turso:dry
   ```

4. 执行架构迁移：
   ```bash
   npm run migrate-to-turso:schema
   ```

5. 执行完整迁移：
   ```bash
   npm run migrate-to-turso
   ```

### 6.2 迁移数据验证

创建数据验证脚本：`scripts/validate-turso-migration.ts`

```typescript
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import tursoClient from '../src/lib/db/turso-client';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config();

const DB_PATH = path.resolve(process.cwd(), 'data', 'blog.db');

async function validateMigration() {
  console.log('开始验证数据迁移...');
  
  // 打开本地SQLite数据库
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  
  try {
    // 获取所有表名
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    let allValid = true;
    
    for (const table of tables) {
      const tableName = table.name;
      
      // 获取本地数据库中的行数
      const localCount = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
      
      // 获取Turso数据库中的行数
      const tursoResult = await tursoClient.execute({
        sql: `SELECT COUNT(*) as count FROM ${tableName}`
      });
      const tursoCount = tursoResult.rows[0]?.count || 0;
      
      // 比较行数
      const rowsMatch = localCount.count === tursoCount;
      console.log(`表 ${tableName}: 本地=${localCount.count}, Turso=${tursoCount}, 匹配=${rowsMatch ? '✅' : '❌'}`);
      
      if (!rowsMatch) {
        allValid = false;
      }
      
      // 对于小表，执行详细内容验证
      if (localCount.count > 0 && localCount.count < 100) {
        // 获取所有列
        const columnsResult = await db.all(`PRAGMA table_info(${tableName})`);
        const columns = columnsResult.map(col => col.name).join(', ');
        
        // 获取主键列
        const pkColumns = columnsResult
          .filter(col => col.pk > 0)
          .map(col => col.name)
          .join(', ');
        
        const orderBy = pkColumns || columns.split(',')[0];
        
        // 从两个数据库获取数据并比较
        const localRows = await db.all(`SELECT * FROM ${tableName} ORDER BY ${orderBy} LIMIT 10`);
        const tursoResult = await tursoClient.execute({
          sql: `SELECT * FROM ${tableName} ORDER BY ${orderBy} LIMIT 10`
        });
        const tursoRows = tursoResult.rows;
        
        // 检查前10行数据是否匹配
        let dataMatches = true;
        for (let i = 0; i < Math.min(localRows.length, tursoRows.length); i++) {
          const localRow = localRows[i];
          const tursoRow = tursoRows[i];
          
          // 比较每一列
          for (const col of Object.keys(localRow)) {
            if (localRow[col] !== tursoRow[col]) {
              console.log(`  ❌ 行${i+1}, 列 ${col} 不匹配: 本地=${localRow[col]}, Turso=${tursoRow[col]}`);
              dataMatches = false;
            }
          }
        }
        
        if (dataMatches) {
          console.log(`  ✅ 前10行数据内容匹配`);
        } else {
          console.log(`  ❌ 数据内容不完全匹配`);
          allValid = false;
        }
      }
    }
    
    if (allValid) {
      console.log('\n✅ 验证成功: 所有表的数据数量一致，抽样数据内容匹配');
    } else {
      console.log('\n❌ 验证失败: 存在不匹配的表或数据');
    }
    
  } catch (error) {
    console.error('验证过程中发生错误:', error);
  } finally {
    await db.close();
  }
}

validateMigration().catch(console.error);
```

将脚本添加到package.json：

```json
"validate-migration": "ts-node scripts/validate-turso-migration.ts"
```

### 6.3 生产环境切换计划

1. **准备工作**：
   - 设置Turso备份策略
   - 确保所有迁移测试通过
   - 配置生产环境变量

2. **执行迁移**：
   - 创建生产环境备份
   - 执行数据迁移脚本
   - 运行验证脚本确认数据完整性

3. **功能验证**：
   - 在独立环境中测试Turso数据库功能
   - 确认所有API和功能工作正常
   - 执行性能测试

4. **生产切换**：
   - 制定回滚计划
   - 更新生产环境配置指向Turso
   - 部署应用并监控

## 7. Turso数据库管理

### 7.1 Turso云控制台使用

1. 访问Turso云控制台：https://app.turso.io
2. 查看数据库性能指标和使用情况
3. 管理用户权限和访问令牌

### 7.2 数据库备份策略

1. **定期备份**：使用Turso CLI导出数据
   ```bash
   turso db dump dada-blog-db > backup_$(date +%Y%m%d).sql
   ```

2. **备份脚本**：创建`scripts/backup-turso.sh`：
   ```bash
   #!/bin/bash
   BACKUP_DIR="./data/backups"
   mkdir -p $BACKUP_DIR
   BACKUP_FILE="$BACKUP_DIR/turso_backup_$(date +%Y%m%d_%H%M%S).sql"
   
   # 导出数据库
   turso db dump dada-blog-db > $BACKUP_FILE
   
   # 保留最近30天备份
   find $BACKUP_DIR -name "turso_backup_*.sql" -type f -mtime +30 -delete
   
   echo "备份已完成: $BACKUP_FILE"
   ```

3. **定时执行**：配置cron作业
   ```
   0 2 * * * cd /path/to/project && ./scripts/backup-turso.sh >> ./logs/backup.log 2>&1
   ```

### 7.3 监控与通知

1. 设置性能监控和告警
2. 配置错误通知到邮件/Slack
3. 定期检查数据库状态和性能

## 8. 最佳实践

### 8.1 并发与连接管理

1. **连接复用**：使用连接池或单例模式管理数据库连接
2. **超时设置**：配置适当的查询超时时间
3. **重试机制**：实现网络错误自动重试

### 8.2 查询优化

1. **使用正确的索引**：确保常用查询都有索引支持
2. **限制结果集大小**：避免返回过多数据
3. **批量操作**：合并小操作为批量事务

### 8.3 性能监控

1. **查询性能**：监控慢查询并优化
2. **吞吐量**：监控系统整体性能
3. **错误率**：跟踪并分析错误模式

## 9. 工作时间表

| 阶段 | 估计时间 | 负责人 |
|------|---------|-------|
| 前期准备 | 1天 | 系统管理员 |
| 依赖安装与配置 | 0.5天 | 开发人员 |
| 适配器实现 | 1天 | 开发人员 |
| 迁移脚本开发 | 1天 | 开发人员 |
| 测试环境迁移 | 0.5天 | 开发人员 |
| 功能验证 | 1天 | 测试人员 |
| 生产环境迁移 | 0.5天 | 系统管理员 |
| 上线后监控 | 持续 | 系统管理员 |

## 10. 回滚计划

如果在迁移过程中或迁移后发现重大问题，可以按照以下步骤回滚：

1. **立即回滚**：更改环境变量，重新指向本地SQLite数据库
2. **分析问题**：确定问题原因并记录
3. **制定新方案**：解决问题并重新计划迁移
4. **重新测试**：在测试环境中确认问题已解决
5. **再次迁移**：执行修正后的迁移计划

## 11. 总结

本方案提供了将博客系统从本地SQLite迁移到Turso分布式数据库的完整步骤。成功实施后将带来以下优势：

1. **全球化访问**：数据库在全球范围内实现低延迟访问
2. **可靠性提升**：借助Turso的数据复制和备份能力
3. **性能优化**：通过内嵌副本实现近乎本地的查询性能
4. **扩展性**：随着博客增长可以轻松扩展数据库容量
5. **简化部署**：解决Vercel部署中的数据库连接问题

通过仔细规划和测试，可以确保整个迁移过程安全无忧，保障所有现有数据完整迁移到新平台。 