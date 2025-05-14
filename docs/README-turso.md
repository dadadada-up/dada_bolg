# Turso数据库集成

本项目支持使用Turso分布式SQLite云数据库作为博客的数据存储方案。Turso提供了全球分布式、高性能的SQLite兼容数据库服务，适合部署在Vercel等无服务器环境中。

## 功能特点

- 兼容SQLite接口，无需改变应用代码
- 自动根据环境选择使用Turso或本地SQLite
- 完整的数据迁移与验证工具
- 自动备份和恢复功能

## 快速入门

1. 安装Turso CLI: `brew install tursodatabase/tap/turso`
2. 登录Turso: `turso auth login`
3. 创建数据库: `turso db create dada-blog-db`
4. 设置环境变量:
   ```
   TURSO_DATABASE_URL=libsql://your-db-url.turso.io
   TURSO_AUTH_TOKEN=your-token
   ```
5. 迁移数据: `npm run migrate-to-turso`

## 详细文档

- [设置指南](./turso-setup-guide.md) - 安装和配置Turso
- [迁移计划](./turso-migration-plan.md) - 完整的迁移方案
- [迁移指南](./turso-migration-guide.md) - 简明迁移步骤
- [环境变量示例](./turso-env-example.md) - 配置参考

## 常用命令

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
```

## 架构

本实现使用适配器模式将Turso客户端接口转换为与SQLite兼容的接口，确保应用代码无需修改即可使用Turso。主要组件包括：

- `src/lib/db/turso-client.ts` - Turso客户端
- `src/lib/db/turso-adapter.ts` - 适配器实现
- `src/lib/db/database.ts` - 统一数据库访问层

系统会根据环境变量自动选择使用Turso或本地SQLite数据库，确保开发和生产环境的一致性。 