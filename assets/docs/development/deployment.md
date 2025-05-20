# 部署文档

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Vercel CLI (可选)

## 本地开发环境

1. 安装依赖：
```bash
pnpm install
```

2. 配置环境变量：
```bash
cp .env.example .env.local
```

3. 初始化本地数据库：
```bash
pnpm db:init
```

4. 启动开发服务器：
```bash
pnpm dev
```

## 生产环境部署 (Vercel)

### 准备工作

1. 创建 Turso 数据库：
```bash
turso db create blog
```

2. 获取数据库 URL 和认证令牌：
```bash
turso db tokens create blog
```

### Vercel 部署步骤

1. 在 Vercel 控制台创建新项目

2. 配置环境变量：
```
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

3. 部署设置：
- Framework Preset: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `pnpm install`

4. 部署后验证：
- 检查数据库连接
- 验证 API 端点
- 测试基本功能

## 数据库迁移

### 本地到 Turso

1. 导出本地数据：
```bash
sqlite3 data/blog.db .dump > dump.sql
```

2. 导入到 Turso：
```bash
turso db shell blog < dump.sql
```

### Turso 到本地

1. 导出 Turso 数据：
```bash
turso db dump blog > dump.sql
```

2. 导入到本地：
```bash
sqlite3 data/blog.db < dump.sql
```

## 监控和维护

### 性能监控

1. Vercel Analytics
2. Turso 性能指标
3. 应用日志

### 定期维护

1. 数据库备份
2. 依赖更新
3. 安全补丁
4. 性能优化

## 故障排除

### 常见问题

1. 数据库连接失败
   - 检查环境变量
   - 验证网络连接
   - 确认认证令牌

2. 构建失败
   - 检查依赖版本
   - 验证环境变量
   - 查看构建日志

3. API 错误
   - 检查请求参数
   - 验证数据库状态
   - 查看错误日志

### 日志查看

1. Vercel 日志：
```bash
vercel logs
```

2. Turso 日志：
```bash
turso db logs blog
```

## 安全建议

1. 定期更新依赖
2. 使用环境变量存储敏感信息
3. 启用 HTTPS
4. 实施速率限制
5. 定期备份数据 