# 达达博客系统

一个现代化的博客系统，支持数据库存储和GitHub备份。

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
