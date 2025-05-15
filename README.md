# Dada博客系统

基于Next.js和Turso数据库的博客系统，支持Vercel部署。

## 功能特点

- 基于Next.js 14构建
- 使用Turso分布式SQLite数据库
- 支持Markdown博文编写
- 响应式设计，适配桌面和移动设备
- 标签和分类管理
- 支持Vercel一键部署

## 部署指南

### 环境准备

1. 创建Turso账户并安装CLI:
   ```bash
   brew install tursodatabase/tap/turso
   turso auth login
   ```

2. 创建Turso数据库:
   ```bash
   turso db create dada-blog-db
   turso db tokens create dada-blog-db
   ```

3. 获取数据库连接信息:
   ```bash
   # 获取数据库URL
   turso db show dada-blog-db --url
   
   # 获取认证令牌
   turso db tokens list dada-blog-db
   ```

### Vercel部署配置

在Vercel项目设置中添加以下环境变量:

1. `TURSO_DATABASE_URL`: Turso数据库URL (格式: `libsql://xxx.turso.io`)
2. `TURSO_AUTH_TOKEN`: Turso访问令牌

你有两种方式设置这些环境变量:
- 直接在Vercel项目设置界面添加
- 使用Vercel CLI创建加密环境变量:
  ```bash
  vercel secrets add turso_database_url libsql://your-db-url.turso.io
  vercel secrets add turso_auth_token your-token
  ```

### 本地开发

1. 克隆仓库:
   ```bash
   git clone https://github.com/dadadada-up/dada_blog.git
   cd dada_blog
   ```

2. 安装依赖:
   ```bash
   npm install
   ```

3. 配置环境变量:
   创建`.env.local`文件并添加以下内容:
   ```
   TURSO_DATABASE_URL=libsql://your-db-url.turso.io
   TURSO_AUTH_TOKEN=your-token
   ```

4. 从本地SQLite迁移数据到Turso(可选):
   ```bash
   npm run migrate-to-turso
   npm run validate-migration # 验证迁移结果
   ```

5. 启动开发服务器:
   ```bash
   npm run dev
   ```

### CI/CD部署

本项目配置了GitHub Actions自动部署到Vercel:

1. 在GitHub仓库设置中添加以下Secrets:
   - `VERCEL_TOKEN`: Vercel API令牌
   - `VERCEL_ORG_ID`: Vercel组织ID
   - `VERCEL_PROJECT_ID`: Vercel项目ID
   - `TURSO_DATABASE_URL`: Turso数据库URL
   - `TURSO_AUTH_TOKEN`: Turso访问令牌

2. 推送代码到`main`分支将自动触发部署

## 数据备份与恢复

### 创建备份

```bash
npm run backup-turso
```

### 查看可用备份

```bash
npm run list-backups
```

### 从备份恢复

```bash
# 从最新备份恢复
npm run restore-turso

# 从特定备份恢复
npm run restore-turso -- -f 备份文件名
```

## 故障排除

如果在Vercel上部署时遇到问题:

1. 检查环境变量是否正确设置
2. 尝试使用静态构建备选方案: `npm run build:static`
3. 确保Turso数据库可以从Vercel所在地区访问

更多详细文档，请参考[Turso数据库集成文档](./docs/README-turso.md)。

# 达达博客系统

基于Next.js和Turso数据库的个人博客系统。

## 功能特点

- 基于Next.js 14构建
- 使用Turso分布式SQLite数据库
- 支持Markdown博文编写及实时预览
- 响应式设计，适配桌面和移动设备
- 标签和分类管理系统
- 支持Vercel一键部署
- 支持博文置顶和自定义排序
- 暗色/亮色主题切换

## 项目整合目录结构

```
dada_blog_app/
├── config/              # 配置文件目录
│   ├── tsconfig.json    # TypeScript配置
│   ├── tailwind.config.js # Tailwind CSS配置
│   ├── postcss.config.js # PostCSS配置
│   ├── vitest.config.ts # Vitest测试配置
│   └── next.config.js   # Next.js配置
├── src/                 # 源代码目录
│   ├── app/             # Next.js App Router
│   ├── components/      # React组件
│   ├── contexts/        # React上下文
│   ├── hooks/           # 自定义Hooks
│   ├── lib/             # 工具函数和服务
│   ├── scripts/         # 应用内部脚本
│   ├── styles/          # 全局样式
│   ├── tests/           # 测试文件
│   └── types/           # TypeScript类型定义
├── content/             # 博客内容目录
│   ├── posts/           # 博客文章
│   ├── assets/          # 静态资源
│   │   ├── images/      # 图片资源 
│   │   └── files/       # 其他文件
│   └── drafts/          # 草稿文章
├── docs/                # 项目文档
│   ├── legal/           # 法律文档
│   │   └── LICENSE      # 许可证文件
│   └── ...              # 其他文档
├── public/              # 静态资源
├── scripts/             # 工具脚本
├── data/                # 数据文件和配置
└── .next/               # Next.js构建输出（不提交到Git）
```

> 注意：为保持兼容性，根目录下保留了指向config目录中配置文件的符号链接

## 开发设置

1. 克隆仓库:
```bash
git clone https://github.com/dadiorchen/dada_blog_app.git
cd dada_blog_app
```

2. 安装依赖:
```bash
npm install
```

3. 启动开发服务器:
```bash
npm run dev

npm run dev:check
```

## 许可证

本项目采用 MIT 许可证。查看 [LICENSE](docs/legal/LICENSE) 文件了解详情。

# Dada Blog 静态站点

这是一个静态HTML网站，可以使用多种方式部署：

## 部署方式

### 1. Vercel

使用 `vercel.json` 配置文件进行部署，设置为静态站点模式：

```json
{
  "version": 2,
  "public": true,
  "framework": null,
  "buildCommand": false,
  "installCommand": false,
  "outputDirectory": "public"
}
```

这种方式会完全绕过Next.js构建过程，直接使用预构建的静态页面，避免在Vercel构建时出现数据库连接错误。

### 2. 本地静态服务器

可以使用内置的静态服务器启动：

```bash
npm start
# 或者
node scripts/static-server.js
```

### 3. 其他静态托管服务

可以将 `/public` 目录中的文件部署到任何静态托管服务中，如GitHub Pages、Netlify等。

## 静态构建流程

1. 执行 `npm run build` 会进行以下操作：
   - 生成静态页面（categories和tags页面）
   - 将所有静态文件从`public`目录复制到Vercel输出目录

2. 静态构建无需连接到数据库，所有页面都是预生成的HTML文件。

3. 如需添加新的静态页面，可以编辑`scripts/generate-static-pages.js`文件，添加更多的分类或标签。

## 目录结构

- `/public` - 静态文件目录
  - `/public/index.html` - 首页
  - `/public/categories/` - 分类页面目录
  - `/public/tags/` - 标签页面目录
  - `/public/api/` - 静态API响应目录

## 开发

```bash
# 安装依赖
npm install

# 生成静态页面
node scripts/generate-static-pages.js

# 启动静态服务器
npm start
```
