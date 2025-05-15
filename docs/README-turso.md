# Turso数据库集成文档

## 目录

- [Turso数据库集成文档](#turso数据库集成文档)
  - [目录](#目录)
  - [1. 概述](#1-概述)
  - [2. 功能特点](#2-功能特点)
  - [3. 快速入门](#3-快速入门)
  - [4. 详细安装指南](#4-详细安装指南)
    - [4.1 安装依赖](#41-安装依赖)
      - [安装Turso CLI](#安装turso-cli)
      - [安装项目依赖](#安装项目依赖)
    - [4.2 设置Turso账户和数据库](#42-设置turso账户和数据库)
    - [4.3 配置环境变量](#43-配置环境变量)
  - [5. 数据迁移](#5-数据迁移)
    - [5.1 迁移步骤概览](#51-迁移步骤概览)
    - [5.2 数据迁移执行](#52-数据迁移执行)
    - [5.3 验证迁移结果](#53-验证迁移结果)
  - [6. 系统架构](#6-系统架构)
    - [6.1 数据库适配器实现](#61-数据库适配器实现)
    - [6.2 数据访问层](#62-数据访问层)
  - [7. 数据库管理](#7-数据库管理)
    - [7.1 备份与恢复](#71-备份与恢复)
    - [7.2 监控与维护](#72-监控与维护)
  - [8. 故障排除](#8-故障排除)
  - [9. 回滚计划](#9-回滚计划)
  - [10. 常用命令汇总](#10-常用命令汇总)
  - [11. 最佳实践](#11-最佳实践)
    - [并发与连接管理](#并发与连接管理)
    - [查询优化](#查询优化)
    - [性能监控](#性能监控)

## 1. 概述

本文档描述了如何将博客系统从本地SQLite数据库迁移到Turso分布式SQLite云服务，以及如何进行配置和管理。Turso提供了全球分布式、高性能的SQLite兼容数据库服务，特别适合部署在Vercel等无服务器环境中。

迁移到Turso可以带来以下优势：

- **全球化访问**：数据库在全球范围内实现低延迟访问
- **可靠性提升**：借助Turso的数据复制和备份能力
- **性能优化**：通过内嵌副本实现近乎本地的查询性能
- **扩展性**：随着博客增长可以轻松扩展数据库容量
- **简化部署**：解决Vercel部署中的数据库连接问题

## 2. 功能特点

- 兼容SQLite接口，无需改变应用代码
- 自动根据环境选择使用Turso或本地SQLite
- 完整的数据迁移与验证工具
- 自动备份和恢复功能
- 全球分布式部署支持

## 3. 快速入门

以下是使用Turso的基本步骤：

1. **安装Turso CLI**
   ```bash
   brew install tursodatabase/tap/turso
   ```

2. **登录Turso**
   ```bash
   turso auth login
   ```

3. **创建数据库**
   ```bash
   turso db create dada-blog-db
   ```

4. **设置环境变量**
   ```
   TURSO_DATABASE_URL=libsql://your-db-url.turso.io
   TURSO_AUTH_TOKEN=your-token
   ```

5. **迁移数据**
   ```bash
   npm run migrate-to-turso
   ```

## 4. 详细安装指南

### 4.1 安装依赖

#### 安装Turso CLI

```bash
# 使用Homebrew安装（macOS）
brew install tursodatabase/tap/turso

# 或使用npm安装
npm install -g turso
```

#### 安装项目依赖

```bash
# 安装Turso客户端
npm install --save @libsql/client

# 安装开发依赖
npm install --save-dev dotenv commander
```

如果安装过程中遇到与native模块相关的编译错误，可能需要先安装编译工具：

```bash
# 在macOS上
xcode-select --install
npm install --save-dev sqlite3 --build-from-source

# 在Linux上
sudo apt-get install python3 make g++
npm install --save-dev sqlite3 --build-from-source
```

### 4.2 设置Turso账户和数据库

登录Turso并创建数据库：

```bash
# 登录Turso
turso auth login

# 创建新数据库
turso db create dada-blog-db

# 查看创建的数据库
turso db list
```

获取连接信息：

```bash
# 获取数据库URL
turso db show dada-blog-db --url

# 创建访问令牌
turso db tokens create dada-blog-db
```

可选：配置全球数据分布

```bash
# 查看可用区域
turso db locations

# 在其他区域创建副本，提高全球访问速度
turso db locations add dada-blog-db sin  # 新加坡
turso db locations add dada-blog-db syd  # 悉尼
```

### 4.3 配置环境变量

创建`.env.local`文件并添加以下内容：

```bash
# Turso数据库连接信息
# 使用Turso CLI获取：turso db show dada-blog-db --url
TURSO_DATABASE_URL=libsql://dada-blog-xxxx.turso.io

# Turso访问令牌
# 使用Turso CLI创建：turso db tokens create dada-blog-db
TURSO_AUTH_TOKEN=your-auth-token-here

# 可选：自定义数据库备份目录（默认为 ./data/backups）
# BACKUP_DIR=./data/backups

# 可选：自定义数据库名称（用于备份和恢复脚本）
# TURSO_DB_NAME=dada-blog-db

# 可选：备份保留天数（默认30天）
# MAX_DAYS=30
```

## 5. 数据迁移

### 5.1 迁移步骤概览

1. **安装依赖**
2. **配置环境变量**
3. **执行数据迁移**
4. **验证迁移结果**
5. **切换应用数据源**
6. **备份管理**

### 5.2 数据迁移执行

测试迁移（不实际写入）：

```bash
npm run migrate-to-turso:dry
```

仅迁移数据库结构：

```bash
npm run migrate-to-turso:schema
```

完整迁移（结构+数据）：

```bash
npm run migrate-to-turso
```

### 5.3 验证迁移结果

执行验证脚本以确保迁移正确：

```bash
npm run validate-migration
```

验证脚本会检查:
- 表结构是否完整迁移
- 数据行数是否一致
- 抽样数据内容是否匹配

## 6. 系统架构

### 6.1 数据库适配器实现

本系统使用适配器模式将Turso客户端接口转换为与SQLite兼容的接口，确保应用代码无需修改即可使用Turso。

主要组件包括：

- `src/lib/db/turso-client.ts` - Turso客户端
- `src/lib/db/turso-adapter.ts` - 适配器实现
- `src/lib/db/database.ts` - 统一数据库访问层

### 6.2 数据访问层

系统会根据环境变量自动选择使用Turso或本地SQLite数据库：

- 检测到`TURSO_DATABASE_URL`和`TURSO_AUTH_TOKEN`环境变量时自动使用Turso
- 否则使用本地SQLite数据库文件

这种设计确保了开发和生产环境的一致性，并简化了部署过程。

## 7. 数据库管理

### 7.1 备份与恢复

创建备份：

```bash
npm run backup-turso
```

查看可用备份：

```bash
npm run list-backups
```

从备份恢复：

```bash
# 从最新备份恢复
npm run restore-turso

# 从特定备份恢复
npm run restore-turso -- -f 备份文件名

# 恢复到新数据库
npm run restore-turso -- -n 新数据库名
```

### 7.2 监控与维护

- **Turso云控制台**：通过 https://app.turso.io 监控数据库性能和使用情况
- **定期备份**：配置cron作业自动备份数据库
- **性能监控**：跟踪慢查询并优化系统性能

## 8. 故障排除

如果遇到迁移或连接问题，请检查：

1. 确保`.env.local`文件中的URL和令牌正确无误
2. 确保Turso CLI已登录（`turso auth status`）
3. 检查网络连接是否正常
4. 确认数据库名称是否正确（`turso db list`）
5. 检查迁移日志，查找具体错误
6. 修改迁移脚本处理特定问题
7. 使用`--force`选项重新运行迁移（清除目标表）

## 9. 回滚计划

如需回滚到本地SQLite数据库:

1. 移除或注释掉`.env.local`中的Turso配置
2. 重启应用

如果在迁移过程中或迁移后发现重大问题，可以按照以下步骤回滚：

1. **立即回滚**：更改环境变量，重新指向本地SQLite数据库
2. **分析问题**：确定问题原因并记录
3. **制定新方案**：解决问题并重新计划迁移
4. **重新测试**：在测试环境中确认问题已解决
5. **再次迁移**：执行修正后的迁移计划

## 10. 常用命令汇总

```bash
# 数据迁移
npm run migrate-to-turso        # 完整迁移
npm run migrate-to-turso:dry    # 模拟迁移
npm run migrate-to-turso:schema # 仅迁移结构
npm run validate-migration      # 验证迁移结果

# 备份与恢复
npm run backup-turso            # 创建备份
npm run list-backups            # 列出备份
npm run restore-turso           # 从最新备份恢复
npm run restore-turso -- -f <file>  # 从指定备份恢复

# Turso CLI命令
turso auth login                # 登录Turso
turso db create <db-name>       # 创建数据库
turso db list                   # 列出数据库
turso db show <db-name> --url   # 获取数据库URL
turso db tokens create <db-name> # 创建访问令牌
turso db locations              # 查看可用区域
turso db locations add <db-name> <location> # 添加区域分布
turso db dump <db-name>         # 导出数据库
```

## 11. 最佳实践

### 并发与连接管理

1. **连接复用**：使用连接池或单例模式管理数据库连接
2. **超时设置**：配置适当的查询超时时间
3. **重试机制**：实现网络错误自动重试

### 查询优化

1. **使用正确的索引**：确保常用查询都有索引支持
2. **限制结果集大小**：避免返回过多数据
3. **批量操作**：合并小操作为批量事务

### 性能监控

1. **查询性能**：监控慢查询并优化
2. **吞吐量**：监控系统整体性能
3. **错误率**：跟踪并分析错误模式 