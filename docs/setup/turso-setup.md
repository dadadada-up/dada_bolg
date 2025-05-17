# Turso数据库迁移指南

本文档介绍如何将博客系统的本地SQLite数据库迁移到Turso云数据库，特别适合在Vercel等无服务器环境中部署时使用。

## 什么是Turso数据库？

[Turso](https://turso.tech)是基于libSQL（SQLite的开源分支）构建的分布式云数据库服务，为Next.js应用提供了理想的数据库解决方案，特别适合部署在Vercel等无服务器环境。

### Turso的主要优势

- **全球分布式访问**：数据自动复制到多个区域，实现低延迟访问
- **兼容SQLite**：API与SQLite基本兼容，便于从本地SQLite迁移
- **Serverless友好**：完美解决Vercel等平台的SQLite文件系统限制问题
- **内嵌复制**：支持将数据副本内嵌到应用中，极大降低查询延迟
- **免费方案**：提供足够的免费额度（1GB存储，每月50万次查询）

## 迁移步骤

### 1. 注册Turso账号并创建数据库

1. 访问[Turso官网](https://turso.tech)并注册账号
2. 安装Turso CLI（可选，但推荐安装）：
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
3. 使用CLI登录（也可以在网页控制台操作）：
   ```bash
   turso auth login
   ```
4. 创建新数据库：
   ```bash
   turso db create dada-blog-db
   ```
5. 获取数据库URL和认证令牌：
   ```bash
   # 获取数据库URL
   turso db show dada-blog-db --url
   
   # 创建认证令牌
   turso db tokens create dada-blog-db
   ```

### 2. 配置本地环境变量

1. 在项目根目录创建`.env.local`文件（如果不存在）
2. 添加以下环境变量：
   ```
   TURSO_DATABASE_URL=libsql://your-database-url-here
   TURSO_AUTH_TOKEN=your-auth-token-here
   ```
3. 替换`your-database-url-here`和`your-auth-token-here`为你实际的值

### 3. 运行迁移脚本

本项目提供了数据迁移脚本，可以方便地将本地SQLite数据库迁移到Turso：

```bash
# 执行完整迁移（表结构+数据）
npm run migrate-to-turso

# 或者，先模拟运行查看将执行的操作
npm run migrate-to-turso:dry

# 或者，仅迁移表结构不迁移数据
npm run migrate-to-turso:schema
```

迁移脚本将：
1. 读取本地SQLite数据库结构
2. 在Turso数据库中创建相同的表结构
3. 迁移所有数据到Turso数据库

### 4. 验证迁移结果

迁移完成后，可以验证数据是否成功迁移：

1. 使用Turso CLI查询数据：
   ```bash
   turso db shell dada-blog-db
   .tables   # 查看所有表
   SELECT COUNT(*) FROM posts;  # 检查记录数
   ```

2. 或者启动应用并访问状态API：
   ```
   http://localhost:3000/api/status
   ```

3. 确认应用正常工作：
   ```bash
   # 启动应用（现在将使用Turso数据库）
   npm run dev
   ```

### 5. 在Vercel项目中配置环境变量

1. 登录Vercel控制台
2. 打开你的项目
3. 进入"Settings > Environment Variables"
4. 添加以下环境变量：
   - `TURSO_DATABASE_URL`: 你的Turso数据库URL
   - `TURSO_AUTH_TOKEN`: 你的Turso认证令牌
5. 保存并重新部署项目

## 故障排除

### 常见问题

1. **迁移脚本报错"缺少环境变量"**
   - 确保`.env.local`文件存在并包含正确的Turso环境变量

2. **无法连接到Turso数据库**
   - 验证URL和令牌是否正确
   - 检查网络连接
   - 确认Turso服务状态（可以查看[Turso状态页面](https://status.turso.tech/)）

3. **迁移后数据不完整**
   - 检查源数据库和目标数据库的记录数
   - 查看迁移日志中是否有错误消息
   - 尝试使用`--dry-run`标志模拟迁移，查看详细信息

4. **Vercel部署后API返回"数据库连接错误"**
   - 确认Vercel环境变量设置正确
   - 检查部署日志查看错误详情
   - 验证Turso令牌权限是否正确

### 高级配置

对于需要更高性能的部署，可以考虑以下配置：

1. **添加全球区域复制**：
   ```bash
   # 添加不同区域的复制，减少不同地区的访问延迟
   turso db locations add dada-blog-db syd
   turso db locations add dada-blog-db hkg
   ```

2. **启用内嵌复制**：在控制台启用内嵌复制功能，将数据副本内嵌到应用中，进一步降低查询延迟

3. **配置同步URL**：在生产环境中启用文件系统同步，提高读取性能

## 额外资源

- [Turso官方文档](https://docs.turso.tech/)
- [Next.js + Turso集成指南](https://turso.tech/blog/nextjs)
- [使用Turso的SQLite兼容接口](https://docs.turso.tech/sdk/js/reference) 