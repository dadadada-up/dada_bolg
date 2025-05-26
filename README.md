# Dada Blog

基于Next.js 14开发的个人博客系统，使用Turso数据库。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI组件**: Tailwind CSS + Shadcn UI
- **数据库**: Turso
- **部署**: Vercel

## 特性

- 响应式设计，支持移动端和桌面端
- 支持Markdown和MDX格式的文章
- 文章分类和标签系统
- 支持全文搜索
- 管理员后台
- 自动适应Vercel部署环境

## 本地开发环境设置

### 前提条件

- Node.js 18+
- Docker
- pnpm (推荐) 或 npm

### 步骤1: 安装依赖

```bash
pnpm install
```

### 步骤2: 环境配置

创建`.env.local`文件，添加以下内容：

```
# Turso数据库配置
DATABASE_URL=http://localhost:8080
DATABASE_AUTH_TOKEN=

# 生产环境数据库配置 (用于数据同步)
PROD_DATABASE_URL=https://your-prod-database-url
PROD_DATABASE_TOKEN=your-prod-database-token

# 站点URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 步骤3: 一键设置开发环境

```bash
# 检查环境变量配置是否正确
pnpm check-env

# 一键设置开发环境（初始化数据库并从生产环境同步数据）
pnpm setup-dev

# 如果不需要从生产环境同步数据，可以使用：
pnpm setup-dev:no-sync
```

或者，你也可以分步骤设置：

```bash
# 初始化本地Turso开发环境 (Docker)
pnpm db:init

# 从生产环境Turso数据库同步数据到本地 (可选)
pnpm db:sync-from-prod

# 创建SQLite文件用于Navicat查看 (可选)
pnpm db:navicat
```

### 步骤4: 启动开发服务器

```bash
# 一键启动开发环境（包括Turso数据库和Next.js开发服务器）
./start-dev.sh

# 或者只启动Next.js开发服务器（如果Turso已运行）
pnpm dev
```

## 数据库管理

本项目使用Turso数据库作为唯一的数据存储方案。

### 通过Navicat查看数据库

为方便查看和编辑数据库内容，项目提供了将Turso数据库同步到SQLite文件的功能，该文件可直接在Navicat中打开。

```bash
# 创建SQLite文件
pnpm db:navicat
```

这将在`navicat_import/blog_database.db`创建一个SQLite文件，你可以在Navicat中打开它。

### 手动管理Docker容器

```bash
# 查看容器状态
pnpm turso:status

# 停止并删除容器
pnpm turso:stop

# 启动新容器
pnpm turso:start
```

### 数据库结构

主要表结构:
- `posts`: 博客文章
- `categories`: 文章分类
- `tags`: 文章标签
- `post_categories`: 文章与分类的关联
- `post_tags`: 文章与标签的关联
- `slug_mapping`: URL别名映射

更多数据库相关信息请参考 [DATABASE.md](./DATABASE.md)。

## 生产环境部署

本项目已配置为在Vercel上部署。只需将项目推送到GitHub，然后在Vercel上导入即可。

确保在Vercel项目设置中添加以下环境变量:

- `DATABASE_URL`: Turso数据库URL（生产环境）
- `TURSO_AUTH_TOKEN`: Turso认证令牌
- `NEXT_PUBLIC_SITE_URL`: 生产环境的站点URL

## 数据同步

使用内置的同步工具在本地和生产环境之间同步内容:

```bash
# 同步所有内容到生产环境
pnpm run sync-content

# 试运行模式（不实际同步到生产环境）
pnpm run sync-content:dry
```

## 项目结构

```
dada_blog/
├── configs/                # 所有配置文件
│   ├── dotfiles/           # 点文件配置（.gitignore, .npmrc等）
│   ├── vercel/             # Vercel部署配置
│   ├── workspace/          # 工作区配置
│   ├── ignore/             # 忽略文件配置
│   ├── next.config.mjs     # Next.js配置
│   ├── tailwind.config.js  # Tailwind CSS配置
│   ├── postcss.config.js   # PostCSS配置
│   └── tsconfig.json       # TypeScript配置
├── data/                   # 数据文件和示例
├── public/                 # 静态资源
├── scripts/                # 脚本工具
├── src/
│   ├── app/                # Next.js应用路由
│   ├── components/         # React组件
│   ├── contexts/           # React上下文
│   ├── hooks/              # React钩子
│   ├── lib/                # 工具库
│   │   ├── db/             # 数据库相关
│   │   ├── services/       # 服务层
│   │   └── utils/          # 工具函数
│   ├── styles/             # 样式文件
│   └── types/              # TypeScript类型定义
├── assets/                 # 资源文件
├── .env.local              # 本地环境变量（需自行创建）
├── package.json            # 项目依赖
└── pnpm-lock.yaml          # pnpm锁文件
```

## 项目结构优化

本项目采用了符号链接系统来保持根目录整洁，同时保持与标准项目结构的兼容性。主要优化包括：

1. **配置文件集中管理**：所有配置文件都存放在`configs`目录中，根目录中的配置文件都是符号链接
2. **类型定义整合**：所有类型定义都集中在`src/types`目录中
3. **点文件管理**：所有点文件（如`.gitignore`）都集中在`configs/dotfiles`目录中
4. **清晰的目录结构**：通过符号链接系统，保持了根目录的整洁，同时不影响工具和框架的默认配置查找路径

### 符号链接系统

根目录中的大多数配置文件实际上是符号链接，指向`configs`目录中的实际文件。这样做是为了保持根目录整洁，同时保持与标准项目结构的兼容性。

#### 配置文件符号链接

- `next.config.mjs` → `configs/next.config.mjs`
- `tailwind.config.js` → `configs/tailwind.config.js`
- `postcss.config.js` → `configs/postcss.config.js`
- `tsconfig.json` → `configs/tsconfig.json`
- `vercel.json` → `configs/vercel/vercel.json`
- `.vercelignore` → `configs/vercel/.vercelignore`

#### 类型定义符号链接

- `next-env.d.ts` → `src/types/next-env.d.ts`
- `next.fetch.ts` → `src/types/next.fetch.ts`

#### 点文件符号链接

- `.npmrc` → `configs/dotfiles/.npmrc`
- `.nvmrc` → `configs/dotfiles/.nvmrc`
- `.gitignore` → `configs/dotfiles/.gitignore`
- `.cursorignore` → `configs/dotfiles/.cursorignore`

#### 工作区配置符号链接

- `pnpm-workspace.yaml` → `configs/workspace/pnpm-workspace.yaml`

## GitHub部署注意事项

在推送到GitHub时，可能会遇到以下问题：

1. **大文件限制**：GitHub对单个文件大小有100MB的限制，项目中的一些缓存文件（如`.next/cache/webpack/`下的文件）可能超过此限制
2. **符号链接处理**：某些Git客户端可能对符号链接处理不当

### 解决方案

1. 使用`.gitignore`忽略大文件和缓存文件
2. 考虑使用Git LFS处理大文件
3. 如遇到推送问题，可以创建新分支并使用`--no-verify`选项

```bash
git checkout -b clean-branch
git add .
git commit -m "Clean structure"
git push --no-verify origin clean-branch
```

## 许可证

MIT 

## 架构说明

本项目使用：

- **Next.js**: React框架
- **Turso**: 分布式SQLite数据库
- **Tailwind CSS**: 样式
- **TypeScript**: 类型安全

## 数据库迁移说明

项目已从"同时支持SQLite和Turso"迁移到"仅使用Turso"。主要变更：

1. 删除了不需要的数据库浏览页面和相关API
2. 添加了将Turso数据库同步到SQLite文件的功能，以便在Navicat中查看
3. 创建了初始化本地开发数据库的脚本
4. 添加了数据库相关的文档

## 常见问题

### Docker容器无法启动

检查Docker服务是否运行，可能需要以管理员/sudo权限运行。

### 数据同步失败

检查`.env.local`中的生产环境数据库配置是否正确。

### 在Admin管理页面中查看数据库

访问`http://localhost:3000/admin/sync`可以查看和管理数据同步状态。 