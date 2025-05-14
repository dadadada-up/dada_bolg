# Turso数据库迁移快速指南

本指南提供了将博客系统从本地SQLite数据库迁移到Turso分布式SQLite云服务的简要步骤。更详细的内容请参考`docs/turso-migration-plan.md`。

## 迁移步骤概览

1. **安装依赖**
2. **配置环境变量**
3. **执行数据迁移**
4. **验证迁移结果**
5. **切换应用数据源**
6. **备份管理**

## 1. 安装依赖

```bash
# 安装Turso客户端
npm install @libsql/client

# 安装Turso CLI
brew install tursodatabase/tap/turso  # macOS
npm install -g turso                  # 其他系统
```

## 2. 配置环境变量

创建或编辑`.env.local`文件，添加以下内容：

```bash
# Turso数据库连接信息
TURSO_DATABASE_URL=libsql://dada-blog-xxxx.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
```

获取连接信息：

```bash
# 登录Turso
turso auth login

# 创建数据库
turso db create dada-blog-db

# 获取URL
turso db show dada-blog-db --url

# 创建令牌
turso db tokens create dada-blog-db
```

## 3. 执行数据迁移

```bash
# 测试模式（不实际写入）
npm run migrate-to-turso:dry

# 仅迁移数据库结构
npm run migrate-to-turso:schema

# 完整迁移（结构+数据）
npm run migrate-to-turso
```

## 4. 验证迁移结果

```bash
# 验证数据完整性
npm run validate-migration
```

验证脚本会检查:
- 表结构是否完整迁移
- 数据行数是否一致
- 抽样数据内容是否匹配

## 5. 切换应用数据源

一旦验证通过，应用将自动使用Turso数据库。系统设计为无缝切换：

- 检测到`TURSO_DATABASE_URL`和`TURSO_AUTH_TOKEN`环境变量时自动使用Turso
- 否则使用本地SQLite数据库文件

## 6. 数据库备份管理

```bash
# 手动备份Turso数据库
npm run backup-turso

# 列出可用备份
npm run list-backups

# 从备份恢复
npm run restore-turso

# 从特定备份恢复
npm run restore-turso -- -f 备份文件名

# 恢复到新数据库
npm run restore-turso -- -n 新数据库名
```

## 故障排除

如果迁移失败，可以:

1. 检查迁移日志，查找具体错误
2. 修改`scripts/migrate-to-turso.ts`脚本处理特定问题
3. 使用`--force`选项重新运行迁移（清除目标表）
4. 从备份恢复本地数据库

## 回滚计划

如需回滚到本地SQLite数据库:

1. 移除或注释掉`.env.local`中的Turso配置
2. 重启应用

## 帮助资源

- 完整迁移计划: `docs/turso-migration-plan.md`
- 环境变量设置: `docs/turso-env-example.md`
- Turso官方文档: https://docs.turso.tech/ 