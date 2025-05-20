# 开发者快速上手指南

本文档提供了快速开始开发 Dada 博客系统的步骤和指南。

## 环境要求

- Node.js v18.17.0 或更高版本
- npm v9.0.0 或更高版本
- Git
- 可选：Turso CLI (用于云数据库操作)

## 获取代码

```bash
git clone https://github.com/dadadada-up/dada_blog.git
cd dada_blog
```

## 安装依赖

```bash
npm install
```

## 环境配置

1. 创建本地环境变量文件：

```bash
cp config/env/.env.example .env.local
```

2. 编辑 `.env.local` 文件，设置必要的环境变量：

```
# 基础配置
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 数据库配置 (本地开发默认使用SQLite)
USE_TURSO=false # 设置为true则使用Turso云数据库

# 如果使用Turso，需要设置以下变量
# TURSO_DATABASE_URL=libsql://your-db.turso.io
# TURSO_AUTH_TOKEN=your-token-here

# GitHub备份功能配置(可选)
# GITHUB_TOKEN=your-github-token
```

## 开发服务器

启动本地开发服务器：

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看博客。

访问 [http://localhost:3000/admin](http://localhost:3000/admin) 进入管理界面。

## 数据库操作

### 初始化本地数据库

首次运行或需要重置数据库时：

```bash
# 初始化主数据库
npm run init-db

# 初始化缓存数据库
npm run init-cache-db
```

### 导入测试文章

```bash
# 导入测试文章
npm run insert-test-article
```

### 数据库迁移到Turso

如果需要将本地SQLite数据迁移到Turso云数据库：

```bash
# 安装Turso CLI
brew install tursodatabase/tap/turso

# 登录Turso
turso auth login

# 创建数据库
turso db create dada-blog

# 获取数据库URL和令牌
turso db tokens create dada-blog

# 配置环境变量
# 编辑.env.local，设置TURSO_DATABASE_URL和TURSO_AUTH_TOKEN

# 执行迁移
npm run migrate-to-turso
```

详细操作可参考 [数据库迁移指南](../setup/database-migration.md)。

## 项目结构

项目采用模块化结构，主要目录组织如下：

```
dada_blog/
├── src/                    # 主要源代码
│   ├── app/                # Next.js应用页面
│   │   ├── api/            # API路由
│   │   └── ...             # 其他页面
│   ├── components/         # React组件
│   ├── lib/                # 工具库
│   │   ├── api/            # API客户端
│   │   ├── cache/          # 缓存相关
│   │   ├── content/        # 内容管理
│   │   ├── db/             # 数据库相关
│   │   ├── github/         # GitHub集成
│   │   ├── markdown/       # Markdown处理
│   │   ├── sync/           # 同步功能
│   │   └── utils/          # 工具函数
│   └── types/              # TypeScript类型
├── scripts/                # 脚本工具
│   ├── db/                 # 数据库脚本
│   ├── deploy/             # 部署脚本
│   └── utils/              # 工具脚本
├── config/                 # 配置文件
├── docs/                   # 项目文档
├── public/                 # 静态资源
└── data/                   # 数据文件
```

## 常用开发命令

```bash
# 启动开发服务器
npm run dev

# 构建应用
npm run build

# 启动构建后的应用
npm run start

# 运行 ESLint 检查
npm run lint

# 备份数据到GitHub
npm run backup-to-github

# 重置并备份GitHub仓库
npm run reset-and-backup
```

## 部署到Vercel

项目可以直接部署到Vercel平台：

1. 在Vercel上导入GitHub仓库
2. 配置环境变量：
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `USE_TURSO=true`
3. 使用默认的构建命令：`npm run build`

## 自定义与扩展

### 添加新页面

在 `src/app` 目录下创建新文件夹和 `page.tsx` 文件。

### 添加新API端点

在 `src/app/api` 目录下创建新文件夹和 `route.ts` 文件。

### 修改样式

编辑 `src/app/globals.css` 文件或组件内的 Tailwind 类。

## 常见问题排解

### 数据库连接问题

- 检查 `.env.local` 文件中的数据库配置
- 确认 SQLite 数据库文件存在于 `data/storage` 目录
- 检查 Turso 令牌和 URL 是否正确

### API 调用失败

- 确认 API 路由是否存在并正确配置
- 检查浏览器开发者工具中的网络请求
- 查看服务器控制台日志

### 页面加载缓慢

- 检查数据库查询性能
- 考虑使用 SWR 缓存和预取策略
- 优化图片和静态资源

## 更多文档

详细文档请参考：

- [架构设计文档](../architecture/project_structure.md)
- [数据库迁移指南](../setup/database-migration.md)
- [API文档](../api/README.md)
- [部署指南](../setup/deployment.md) 