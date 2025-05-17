# 项目脚本说明

本目录包含所有项目脚本，按功能分类整理。

## 目录结构

- **db/** - 数据库相关脚本，如迁移和验证
- **deploy/** - 部署相关脚本，主要用于Vercel
- **backup/** - 备份和恢复相关脚本
- **utils/** - 工具脚本，如端口检查和图像生成

## 主要脚本

### 数据库脚本

- `db/migrate-to-turso.ts` - 将本地SQLite数据迁移到Turso云数据库
- `db/validate-turso-migration.ts` - 验证Turso数据库迁移是否成功

### 部署脚本

- `deploy/vercel-setup.js` - Vercel环境配置脚本
- `deploy/verify-vercel-build.js` - 验证Vercel构建环境

### 备份脚本

- `backup/backup-to-github.ts` - 将博客内容备份到GitHub
- `backup/backup-turso.sh` - 备份Turso数据库
- `backup/restore-turso.sh` - 从备份恢复Turso数据库

### 工具脚本

- `utils/check-ports.sh` - 检查端口占用情况
- `utils/create-default-images.js` - 创建默认图像资源

## 使用说明

大多数脚本可以通过npm脚本运行，例如：

```bash
npm run migrate-to-turso
npm run backup
```

详细用法请参考各脚本顶部的注释。 