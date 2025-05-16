# SQLite到Turso数据迁移指南

## 简介

本指南将帮助你将现有的SQLite数据库迁移到Turso云数据库，确保数据完整性和平滑过渡。

## 迁移前准备

### 1. 备份现有数据库

在开始迁移前，务必备份您的SQLite数据库：

```bash
# 复制数据库文件
cp your-database.db your-database.db.backup

# 或使用SQLite命令导出
sqlite3 your-database.db .dump > database_dump.sql
```

### 2. 安装必要工具

确保你已安装所需工具：

```bash
# 安装Turso CLI
brew install tursodatabase/tap/turso  # macOS
# 或
npm install -g turso                  # 使用npm

# 安装项目依赖
npm install --save @libsql/client
npm install --save-dev dotenv commander
```

### 3. 配置环境变量

创建或编辑`.env.local`文件，设置必要环境变量：

```
# Turso数据库连接信息
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# SQLite数据库路径
SQLITE_DB_PATH=./data/blog.db

# 备份目录（可选）
BACKUP_DIR=./data/backups
```

## 迁移脚本

我们的项目提供了自动化迁移脚本，简化迁移过程。主要使用`scripts/migrate-to-turso.ts`脚本执行迁移。

### 迁移脚本功能

该脚本提供以下功能：

1. 从SQLite读取表结构和数据
2. 在Turso数据库中创建相同的表结构
3. 将数据从SQLite传输到Turso
4. 可选的模拟运行模式，显示将要执行的操作但不实际执行
5. 可选的仅结构模式，只迁移表结构不迁移数据

### 迁移步骤

#### 1. 模拟运行（推荐）

首先使用模拟运行模式，了解迁移将执行的操作：

```bash
npm run migrate-to-turso:dry
```

这将显示将要创建的表和迁移的数据，但不会实际执行。

#### 2. 仅迁移表结构

如果你只想迁移表结构，不迁移数据：

```bash
npm run migrate-to-turso:schema
```

这将在Turso创建与你的SQLite相同的表，但不包含数据。

#### 3. 完整迁移

准备就绪后，执行完整迁移：

```bash
npm run migrate-to-turso
```

这将迁移表结构和所有数据到Turso数据库。

## 验证迁移

迁移完成后，使用验证脚本确保数据迁移正确：

```bash
npm run validate-migration
```

验证脚本会检查：
- 表结构是否完全匹配
- 数据行数是否一致
- 抽样数据内容是否匹配

如果验证失败，请查看脚本输出，了解不匹配的细节。

## 手动迁移（备选方案）

如果自动脚本不适合你的需求，也可以手动执行迁移：

### 1. 导出SQLite结构和数据

```bash
# 导出表结构
sqlite3 your-database.db .schema > schema.sql

# 导出数据（以CSV格式）
sqlite3 -header -csv your-database.db "SELECT * FROM your_table;" > your_table.csv
```

### 2. 导入到Turso

```bash
# 导入表结构
cat schema.sql | turso db shell your-db-name

# 导入数据（示例，根据实际表结构调整）
cat your_table.csv | awk -F, 'NR>1 {print "INSERT INTO your_table VALUES (" $1 "," $2 "," $3 ");" }' | turso db shell your-db-name
```

## 迁移后操作

### 1. 切换应用连接

迁移验证成功后，更新应用配置以使用Turso：

- 确保所有环境都设置了正确的Turso环境变量
- 确保`NEXT_PUBLIC_DATABASE_MODE=turso`已设置（如适用）

### 2. 监控性能

- 在迁移后的前几天密切监控应用性能
- 查看Turso仪表板了解数据库性能指标
- 如发现性能问题，考虑添加更多地区副本

### 3. 定期备份

设置定期备份以确保数据安全：

```bash
# 使用提供的备份脚本
npm run backup-turso

# 设置cron作业定期备份
0 2 * * * cd /path/to/project && npm run backup-turso
```

## 故障排除

### 迁移错误

1. **表结构错误**：
   - 检查SQLite中的外键约束或特定SQLite语法
   - 查看是否有不兼容的数据类型

2. **数据不一致**：
   - 检查NULL值处理
   - 检查TEXT vs. VARCHAR等类型差异
   - 验证日期格式是否一致

3. **连接问题**：
   - 验证Turso环境变量正确设置
   - 检查网络连接是否稳定
   - 验证令牌权限是否正确

## 回滚计划

如果迁移出现严重问题，可以按照以下步骤回滚：

1. 修改环境变量，指回本地SQLite数据库
2. 如果已修改代码，恢复到迁移前版本
3. 如有必要，从之前的备份恢复SQLite数据库

## 常见问题

**Q: 迁移大型数据库需要多长时间？**  
A: 根据数据大小和网络速度而定，通常几分钟到几小时不等。对于大型数据库，建议使用分批迁移。

**Q: 迁移过程中是否会有停机？**  
A: 如果应用仍连接到SQLite，迁移过程中应用可以继续运行。但切换到Turso时会有短暂停机。

**Q: 如何处理迁移中断？**  
A: 脚本支持从中断点继续，重新运行迁移命令即可。

## 高级主题

### 增量迁移

对于大型数据库，可考虑增量迁移：

1. 首先迁移表结构和静态数据
2. 然后迁移频繁变化的数据
3. 设置同步过程保持两个数据库同步
4. 完全迁移后切换连接

### 迁移后优化

迁移完成后的性能优化措施：

1. 添加适当的索引
2. 配置全球副本以减少延迟
3. 监控查询性能并优化慢查询

## 后续步骤

- 参考[Turso-Vercel完整集成指南](./turso-vercel-完整集成指南.md)了解完整部署流程
- 查看[Turso官方文档](https://docs.turso.tech)了解高级功能
- 探索[性能优化策略](./turso-vercel-完整集成指南.md#7-性能优化)提升应用体验 