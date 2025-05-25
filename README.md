# Dada Blog

基于Next.js 14开发的个人博客系统，支持本地SQLite数据库和Turso云数据库。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI组件**: Tailwind CSS + Shadcn UI
- **数据库**: SQLite (本地开发) / Turso (生产环境)
- **部署**: Vercel

## 特性

- 响应式设计，支持移动端和桌面端
- 支持Markdown和MDX格式的文章
- 文章分类和标签系统
- 支持全文搜索
- 管理员后台
- 自动适应Vercel部署环境

## 开发环境设置

1. 克隆仓库

```bash
git clone https://github.com/yourusername/dada_blog.git
cd dada_blog
```

2. 安装依赖

```bash
# 推荐使用pnpm
pnpm install
```

3. 创建环境变量文件

创建`.env.local`文件并添加以下内容:

```
# 数据库配置
DB_PATH=./data/blog.db

# Turso配置 (生产环境)
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# 站点URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. 运行开发服务器

```bash
pnpm dev
```

现在可以在浏览器中访问 [http://localhost:3000](http://localhost:3000) 查看博客。

## 生产环境部署

本项目已配置为在Vercel上部署。只需将项目推送到GitHub，然后在Vercel上导入即可。

确保在Vercel项目设置中添加以下环境变量:

- `TURSO_DATABASE_URL`: Turso数据库URL
- `TURSO_AUTH_TOKEN`: Turso认证令牌
- `NEXT_PUBLIC_SITE_URL`: 生产环境的站点URL

## 数据库迁移

从本地开发环境迁移到生产环境:

```bash
pnpm run db:sync
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