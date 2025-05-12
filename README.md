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
