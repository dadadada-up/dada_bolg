# Turso集成设置指南

本指南将帮助你设置和配置Turso数据库与本项目的集成。

## 前置条件

1. 安装Node.js (v14+)和npm
2. 安装Turso CLI:
   ```bash
   # macOS
   brew install tursodatabase/tap/turso
   
   # 其他系统
   npm install -g turso
   ```

## 步骤一：安装项目依赖

```bash
# 安装项目依赖
npm install

# 安装Turso客户端
npm install @libsql/client
```

## 步骤二：设置Turso账户和数据库

```bash
# 登录Turso CLI
turso auth login

# 创建新数据库
turso db create dada-blog-db

# 获取数据库URL
turso db show dada-blog-db --url

# 创建访问令牌
turso db tokens create dada-blog-db
```

## 步骤三：配置环境变量

创建`.env.local`文件并填入以下信息：

```bash
# Turso数据库连接信息
TURSO_DATABASE_URL=libsql://your-db-url.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here

# 可选：自定义数据库备份目录（默认为 ./data/backups）
BACKUP_DIR=./data/backups

# 可选：自定义数据库名称（用于备份和恢复脚本）
TURSO_DB_NAME=dada-blog-db

# 可选：备份保留天数（默认30天）
MAX_DAYS=30
```

## 步骤四：数据迁移

从本地SQLite数据库迁移到Turso数据库：

```bash
# 模拟迁移（不实际写入）
npm run migrate-to-turso:dry

# 仅迁移数据库结构
npm run migrate-to-turso:schema

# 完整迁移（结构+数据）
npm run migrate-to-turso

# 验证迁移结果
npm run validate-migration
```

## 步骤五：备份与恢复

```bash
# 创建备份
npm run backup-turso

# 列出可用备份
npm run list-backups

# 从最新备份恢复
npm run restore-turso

# 从指定备份恢复
npm run restore-turso -- -f 备份文件名

# 恢复到新数据库
npm run restore-turso -- -n 新数据库名
```

## 故障排除

1. **连接问题**：确保`.env.local`文件中的URL和令牌正确
2. **Turso CLI问题**：检查是否已经登录(`turso auth status`)
3. **依赖问题**：确保`@libsql/client`已正确安装

详细信息请参考`docs/README-turso.md`文档。 