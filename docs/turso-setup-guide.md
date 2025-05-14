# Turso数据库设置指南

本指南将帮助你设置Turso数据库环境，安装必要的依赖，并使用迁移工具将数据从本地SQLite迁移到Turso云数据库。

## 1. 安装依赖

### 1.1 安装Turso CLI

首先，你需要安装Turso命令行工具：

```bash
# 使用Homebrew安装（macOS）
brew install tursodatabase/tap/turso

# 或使用npm安装
npm install -g turso
```

### 1.2 安装项目依赖

项目需要以下依赖来运行迁移脚本：

```bash
# 安装Turso客户端
npm install --save @libsql/client

# 安装开发依赖
npm install --save-dev dotenv commander
```

注意：如果安装过程中遇到与native模块相关的编译错误（尤其是`better-sqlite3`或`sqlite3`），可能需要先安装编译工具：

```bash
# 在macOS上
xcode-select --install
npm install --save-dev sqlite3 --build-from-source

# 在Linux上
sudo apt-get install python3 make g++
npm install --save-dev sqlite3 --build-from-source
```

## 2. 设置Turso账户和数据库

### 2.1 登录Turso

```bash
turso auth login
```

### 2.2 创建数据库

```bash
# 创建新数据库
turso db create dada-blog-db

# 查看创建的数据库
turso db list
```

### 2.3 获取连接信息

```bash
# 获取数据库URL
turso db show dada-blog-db --url

# 创建访问令牌
turso db tokens create dada-blog-db
```

## 3. 配置环境变量

创建一个`.env.local`文件（复制自`.env.local.example`），填入你的Turso连接信息：

```
# Turso数据库连接信息
TURSO_DATABASE_URL=libsql://dada-blog-xxxx.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here

# 本地SQLite数据库路径
DATABASE_URL=file:./data/blog.db
```

## 4. 数据迁移

### 4.1 测试迁移（不实际写入）

```bash
npm run migrate-to-turso:dry
```

### 4.2 迁移数据库结构

```bash
npm run migrate-to-turso:schema
```

### 4.3 完整迁移

```bash
npm run migrate-to-turso
```

### 4.4 验证迁移结果

```bash
npm run validate-migration
```

## 5. 数据库备份与恢复

### 5.1 创建备份

```bash
npm run backup-turso
```

### 5.2 查看可用备份

```bash
npm run list-backups
# 或者
./scripts/restore-turso.sh -l
```

### 5.3 从备份恢复

```bash
# 从最新备份恢复
npm run restore-turso

# 从特定备份恢复
npm run restore-turso -- -f 备份文件名

# 恢复到新数据库
npm run restore-turso -- -n 新数据库名
```

## 6. 故障排除

如果遇到问题，可以检查：

1. Turso CLI是否正确安装并登录
2. 环境变量是否正确配置
3. 依赖是否成功安装
4. Node.js和npm版本是否兼容

详细的迁移计划和更多信息请参考：
- `docs/turso-migration-plan.md`
- `docs/turso-migration-guide.md`
- `docs/turso-env-example.md` 