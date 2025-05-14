# Turso数据库环境变量设置指南

要使用Turso数据库，你需要在项目根目录下创建或修改`.env.local`文件，添加以下环境变量：

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

## 获取Turso连接信息的步骤

1. **安装Turso CLI**：

   ```bash
   # macOS
   brew install tursodatabase/tap/turso
   
   # 其他系统
   npm install -g turso
   ```

2. **登录Turso**：

   ```bash
   turso auth login
   ```

3. **创建数据库**：

   ```bash
   turso db create dada-blog-db
   ```

4. **获取数据库URL**：

   ```bash
   turso db show dada-blog-db --url
   ```

5. **创建访问令牌**：

   ```bash
   turso db tokens create dada-blog-db
   ```

6. **将上述信息添加到`.env.local`文件**

## 验证配置

设置完成后，可以运行以下命令验证配置是否正确：

```bash
# 检查Turso CLI连接
turso db list

# 使用npm脚本验证数据库连接
npm run validate-migration
```

## 故障排除

如果遇到连接问题，请检查：

1. 确保`.env.local`文件中的URL和令牌正确无误
2. 确保Turso CLI已登录（`turso auth status`）
3. 检查网络连接是否正常
4. 确认数据库名称是否正确（`turso db list`）

如有其他问题，请参考[Turso官方文档](https://docs.turso.tech/)。 