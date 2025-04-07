# 大大的博客系统

这是一个基于GitHub Pages和GitHub API构建的静态博客系统，包含内容管理系统和前端展示两部分。

## 系统架构

本博客系统由两个主要部分组成：

1. **博客前端展示系统**：位于`blog`目录，负责展示文章和提供用户界面
2. **内容管理系统**：位于`admin`目录，负责内容的创建、编辑和管理

系统通过GitHub API与GitHub仓库交互，所有文章存储在仓库的`content/posts`目录下。

## 博客前端展示系统

博客前端是一个纯静态网站，主要特点包括：

- 完全基于原生JavaScript，无需任何框架
- 通过GitHub API获取文章内容和元数据
- 支持文章分类和标签
- 响应式设计，适配各种设备
- 本地缓存功能，提高加载速度

### 页面结构

- **首页 (index.html)**：展示推荐文章和最新文章
- **文章详情页 (article.html)**：展示单篇文章内容，包含目录和相关文章
- **文章列表页 (articles.html)**：展示所有文章，支持筛选和排序
- **分类页面 (categories.html)**：按分类浏览文章
- **标签页面 (tags.html)**：按标签浏览文章
- **关于页面 (about.html)**：介绍博客和作者信息

### 技术实现

- 使用原生JavaScript处理页面交互和数据获取
- 使用fetch API与GitHub API通信
- 使用localStorage实现本地缓存
- 使用marked.js库解析Markdown内容

## 内容管理系统

内容管理系统提供了友好的界面来管理博客文章，主要功能包括：

- 文章创建、编辑和删除
- 文章预览
- 批量操作（批量删除、导出）
- 分类和标签管理
- 文章搜索和筛选

### 技术实现

- 使用GitHub API进行内容管理
- 支持Markdown格式写作
- YAML Front Matter管理文章元数据

## 如何使用

1. 访问博客首页：`/blog/index.html`
2. 访问内容管理系统：`/admin/index.html`（需要GitHub Token授权）

## 开发指南

### 目录结构

```
blog/
  ├── assets/
  │   ├── css/             # 样式文件
  │   ├── js/              # JavaScript文件
  │   └── images/          # 图片资源
  ├── index.html          # 首页
  ├── article.html        # 文章详情页
  ├── articles.html       # 文章列表页
  ├── categories.html     # 分类页面
  ├── tags.html           # 标签页面
  └── about.html          # 关于页面

admin/
  ├── assets/
  │   ├── css/             # 管理系统样式
  │   └── js/              # 管理系统脚本
  └── index.html           # 管理系统界面
```

### 配置说明

主要配置在`blog/assets/js/blog.js`和`admin/assets/js/document-manager.js`文件中：

```javascript
const config = {
    owner: 'dadadada-up',        // GitHub用户名
    repo: 'dada_blog',           // GitHub仓库名
    branch: 'main',              // 仓库分支
    docsPath: 'content/posts',   // 文档存储路径
    ...
};
```

## 未来计划

- 添加评论系统
- 增强SEO优化
- 添加访问统计
- 支持多语言

## 作者

- 大大 (@dadadada-up) 