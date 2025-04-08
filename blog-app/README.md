# Dada 博客平台

一个使用 Next.js 构建的现代博客平台，从 GitHub 仓库获取内容，提供强大的搜索、分类和标签功能。

## 主要特性

- 基于 GitHub 仓库的内容管理
- 响应式设计，适配各种设备
- 深色模式支持
- 强大的搜索功能
- 文章分类和标签系统
- 文章归档
- 文章目录导航
- SEO 友好
- 代码高亮

## 功能特性

- 响应式设计：适配各种尺寸的设备
- Markdown 支持：使用 Markdown 编写博客内容
- 分类和标签系统：组织和筛选文章
- 文章搜索：快速查找内容
- 归档页面：按时间浏览文章
- 社交媒体分享：轻松分享文章到各大平台
- 评论系统：与读者互动
- SEO 优化：支持搜索引擎优化和社交媒体预览
  - 自定义页面标题和描述
  - Open Graph 和 Twitter 卡片支持
  - 结构化数据标记
  - 网站地图和 robots.txt

## 技术栈

- **前端框架**: Next.js 14
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **内容管理**: GitHub API (Octokit)
- **Markdown 渲染**: Remark、Rehype
- **部署**: Vercel

## 开始使用

### 必要条件

- Node.js 16+
- GitHub 个人访问令牌

### 安装步骤

1. 克隆仓库
   ```bash
   git clone https://github.com/yourusername/dada-blog.git
   cd dada-blog
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 创建 `.env.local` 文件并配置环境变量
   ```
   GITHUB_TOKEN=your_github_token_here
   GITHUB_REPO_OWNER=your_github_username
   GITHUB_REPO_NAME=your_content_repository
   ```

4. 启动开发服务器
   ```bash
   npm run dev
   ```

5. 浏览器访问 `http://localhost:3000`

## 内容管理

博客内容存储在你的 GitHub 仓库中。文章应使用 Markdown 格式，包含 Front Matter 元数据。

### 文章结构示例

```markdown
---
title: 文章标题
date: 2023-06-15
categories: [分类1, 分类2]
tags: [标签1, 标签2, 标签3]
description: 这是一篇关于某主题的文章
image: /path/to/cover-image.jpg
published: true
featured: false
---

# 正文标题

这里是文章正文内容...
```

### Front Matter 字段

| 字段 | 说明 | 必填 |
|------|------|------|
| title | 文章标题 | 是 |
| date | 发布日期 (YYYY-MM-DD) | 是 |
| categories | 文章分类，可多个 | 否 |
| tags | 文章标签，可多个 | 否 |
| description | 文章摘要 | 否 |
| image | 封面图片路径 | 否 |
| published | 是否发布 (true/false) | 否，默认 true |
| featured | 是否推荐 (true/false) | 否，默认 false |

## 部署

此项目可以部署到 Vercel:

1. 在 Vercel 创建新项目
2. 链接到你的 GitHub 仓库
3. 添加环境变量
4. 部署

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可

此项目采用 MIT 许可 - 详情请查看 LICENSE 文件

## 联系

项目维护者 - [@dadadada-up](https://github.com/dadadada-up)

项目链接: [https://github.com/yourusername/dada-blog](https://github.com/yourusername/dada-blog)

## SEO 优化

博客平台已经集成了完善的SEO元数据支持：

- 使用Next.js的Metadata API提供每个页面的元数据
- 动态生成页面标题、描述和关键词
- 支持Open Graph和Twitter Card元数据，增强社交媒体分享效果
- 为每个页面类型（首页、文章详情、分类、标签等）提供特定的元数据
- 支持文章发布时间、作者和相关标签的结构化数据

### 实现细节

- `src/lib/metadata.ts`: 提供可复用的元数据生成函数
- 每个页面通过`generateMetadata`函数动态生成元数据
- 文章页面自动从文章内容中提取关键信息作为元数据
- 分类和标签页面使用相应的分类名和标签名增强元数据

## 待开发功能

- [ ] 结构化数据（JSON-LD）支持
- [ ] 自动生成sitemap.xml
- [ ] robots.txt文件配置
- [ ] RSS feed支持
- [ ] 图片优化和LazyLoading
- [ ] 页面性能优化

# 环境变量设置

## 1. 复制示例文件
```bash
cp .env.example .env.local
```

## 2. 设置 GitHub Token
1. 访问 [GitHub Token 设置页面](https://github.com/settings/tokens)
2. 点击 "Generate new token" > "Generate new token (classic)"
3. 填写描述，如 "Dada Blog"
4. 选择权限范围:
   - `repo` (完全控制私有仓库)
   - `workflow` (可选，如果需要 GitHub Actions)
5. 点击 "Generate token"
6. 复制生成的 token
7. 编辑 `.env.local` 文件，将 `your_token_here` 替换为复制的 token

## 安全提示
- 永远不要提交 `.env.local` 文件
- 定期轮换 token
- 使用最小必要权限
- 考虑使用 Fine-grained tokens 替代 Personal access tokens 