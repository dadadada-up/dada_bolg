# 数据库迁移指南

本指南详细说明了如何从本地开发环境的SQLite数据库迁移到生产环境的Turso云数据库。

## 前提条件

1. 已安装Turso CLI工具
2. 已创建Turso账户
3. 本地SQLite数据库包含要迁移的数据

## 迁移步骤

### 1. 安装Turso CLI

如果尚未安装Turso CLI，请按照以下步骤安装：

```bash
# macOS
brew install tursodatabase/tap/turso

# 其他平台请参考官方文档
```

### 2. 登录Turso账户

```bash
turso auth login
```

按照提示在浏览器中完成认证流程。

### 3. 创建Turso数据库

```bash
# 创建数据库
turso db create dada-blog

# 获取数据库URL和认证令牌
turso db tokens create dada-blog
```

请记录输出的数据库URL和认证令牌，后续步骤需要用到。

### 4. 设置环境变量

创建或修改`.env.local`文件，添加以下环境变量：

```
TURSO_DATABASE_URL=YOUR_TURSO_DB_URL
TURSO_AUTH_TOKEN=YOUR_TURSO_AUTH_TOKEN
```

请将YOUR_TURSO_DB_URL和YOUR_TURSO_AUTH_TOKEN替换为上一步获取的值。

### 5. 运行迁移脚本

本项目提供了自动迁移脚本，可以将SQLite数据库中的数据迁移到Turso数据库。

```bash
# 执行迁移（默认会执行数据迁移）
npm run migrate-to-turso

# 仅迁移数据库结构，不迁移数据
npm run migrate-to-turso:schema

# 执行迁移但不实际写入数据（模拟模式）
npm run migrate-to-turso:dry
```

迁移脚本位于`scripts/db/migrate-to-turso.ts`，它会执行以下操作：

1. 连接本地SQLite数据库和Turso数据库
2. 从SQLite读取数据库架构
3. 在Turso中创建相同的表结构
4. 从SQLite中读取数据
5. 将数据写入Turso数据库

### 6. 验证迁移

迁移完成后，您可以使用以下命令验证数据是否已正确迁移：

```bash
# 进入Turso Shell
turso db shell dada-blog

# 查询表格和数据
.tables
SELECT COUNT(*) FROM posts;
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM tags;
```

### 7. 切换到Turso数据库

迁移验证成功后，您可以配置应用程序使用Turso数据库：

```bash
# 设置环境变量
export USE_TURSO=true
```

或者在`.env.local`文件中添加：

```
USE_TURSO=true
```

### 8. 在Vercel中配置环境变量

如果您将应用程序部署到Vercel，您需要在Vercel项目设置中添加以下环境变量：

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `USE_TURSO=true`

## 备份和恢复

### 备份Turso数据库

```bash
# 将Turso数据库备份到本地文件
turso db dump dada-blog > backup.sql
```

### 从备份恢复Turso数据库

```bash
# 从备份文件恢复
turso db shell dada-blog < backup.sql
```

## 故障排除

### 迁移脚本失败

如果迁移脚本失败，请检查以下几点：

1. 确认Turso认证令牌和数据库URL是否正确
2. 检查本地SQLite数据库是否可访问
3. 查看日志文件了解详细错误信息

### 数据类型不兼容

SQLite和Turso在某些数据类型上有差异，可能需要进行适当的转换。常见的问题包括：

- 日期/时间格式不同
- JSON数据处理不同
- 布尔值表示方式不同

### 连接问题

如果应用程序无法连接到Turso数据库，请检查：

1. 网络连接是否正常
2. 防火墙设置是否允许连接
3. 认证令牌是否有效

## 开发与生产环境共存

您可以配置应用程序根据环境使用不同的数据库：

```javascript
// 根据环境使用不同的数据库客户端
const dbClient = process.env.USE_TURSO === 'true' 
  ? createTursoClient() 
  : createSQLiteClient();
```

这样，您可以在开发环境中使用SQLite，在生产环境中使用Turso，而不需要修改应用程序代码。

## 进一步优化

为了获得更好的性能和可靠性，考虑以下优化：

1. 使用Turso的读取副本增加读取吞吐量
2. 实施定期备份策略
3. 监控数据库性能和使用情况
4. 优化查询以适应Turso的特性 