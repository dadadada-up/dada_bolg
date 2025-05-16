# 博客系统文档中心

## 快速导航

- [开发指南](#开发指南)
- [数据库文档](#数据库文档)
- [部署指南](#部署指南)
- [API文档](#api文档)
- [故障排除](#故障排除)

## 开发指南

### 项目概述
- [需求开发文档](./docs/需求开发文档.md) - 项目的详细需求说明和开发规范

### 入门指南
- [本地开发环境设置](./README.md) - 设置开发环境和开始开发的方法

### 代码结构
项目代码主要组织结构：
- `src/` - 源代码目录
  - `app/` - Next.js App Router
  - `pages/` - Next.js Pages Router
  - `components/` - React组件
  - `lib/db/` - 数据库相关代码
    - `database.ts` - 统一数据库接口
    - `turso-adapter.ts` - Turso适配器
    - `turso-client.ts` - Turso客户端

## 数据库文档

### SQLite
- [数据库模式](./turso_schema_fixed.sql) - 数据库表结构定义
- [备份与恢复](./scripts/backup-turso.sh) - 数据库备份脚本

### Turso集成
- [Turso-Vercel完整集成指南](./docs/turso-vercel-完整集成指南.md) - 全面的Turso集成文档
- [Turso快速入门](./docs/turso-快速入门.md) - Turso使用入门指南
- [数据迁移指南](./docs/turso-数据迁移指南.md) - 从SQLite迁移到Turso的详细步骤

## 部署指南

### Vercel部署
- [Turso-Vercel集成部署](./docs/turso-vercel-完整集成指南.md#vercel部署配置) - 使用Turso的Vercel部署方案

## API文档

### 内部API
- 数据库API - `src/lib/db/index.ts` 中的数据库访问接口
- 内容API - 内容管理相关API

### 外部API
- 第三方集成API

## 故障排除

### 常见问题
- [Turso连接问题](./docs/turso-vercel-完整集成指南.md#常见问题与解决方案) - Turso连接相关问题解决方案
- [部署问题](./docs/turso-vercel-完整集成指南.md#验证与测试) - 部署过程中的问题排查

### 调试工具
- [测试脚本](./scripts/) - 各种测试和调试脚本
  - `verify-vercel-turso.js` - 验证Turso连接
  - `verify-vercel-build.js` - 验证Vercel构建环境

## 开发工具

### 脚本
- [数据库迁移](./scripts/migrate-to-turso.ts) - 数据库迁移脚本
- [数据验证](./scripts/validate-turso-migration.ts) - 迁移验证脚本

### 工具配置
- [TypeScript配置](./tsconfig.json) - TypeScript配置
- [Tailwind配置](./tailwind.config.js) - Tailwind CSS配置
- [Next.js配置](./next.config.js) - Next.js配置 