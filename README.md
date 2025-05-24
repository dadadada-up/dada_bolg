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
npm install
# 或者使用pnpm
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
npm run dev
# 或者使用pnpm
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
npm run db:sync
```

## 文件结构

```
dada_blog/
├── config/               # 配置文件
├── data/                 # 数据文件和示例
├── public/               # 静态资源
├── scripts/              # 脚本工具
├── src/
│   ├── app/              # Next.js应用路由
│   ├── components/       # React组件
│   ├── lib/              # 工具库
│   │   ├── db/           # 数据库相关
│   │   ├── services/     # 服务层
│   │   └── utils/        # 工具函数
│   └── types/            # TypeScript类型定义
├── .env.local            # 本地环境变量
├── next.config.mjs       # Next.js配置
└── vercel.json           # Vercel配置
```

## 许可证

MIT 