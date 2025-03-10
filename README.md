# 产品经理的AI探索之路

这是一个基于 MkDocs Material 构建的个人知识库，用于记录从保险产品经理到 AI 实践者的学习和转型之路。

## 目录结构

```
dada_bolg/
├── docs/                     # 文档目录
│   ├── ai/                  # AI 相关内容
│   │   ├── projects/       # AI 项目实践
│   │   ├── learning/       # AI 学习笔记
│   │   └── tools/         # AI 工具分享
│   ├── product/            # 产品相关内容
│   │   ├── insurance/     # 保险产品管理
│   │   └── methodology/   # 产品方法论
│   ├── tech/              # 技术相关内容
│   │   ├── python/       # Python 开发笔记
│   │   └── tools/        # 效率工具分享
│   ├── blog/              # 博客文章
│   │   └── posts/        # 文章存放目录
│   └── assets/            # 静态资源
│       └── images/        # 图片资源
├── tools/                  # 工具脚本
└── mkdocs.yml             # MkDocs 配置文件
```

## 特性

- 🎨 基于 Material for MkDocs 主题
- 📱 响应式设计，移动端友好
- 🔍 全站搜索功能
- 🌓 深色/浅色主题切换
- 📝 博客系统支持
- ✨ 代码高亮和复制
- 📰 RSS 订阅支持

## 本地开发

1. 克隆仓库
```bash
git clone https://github.com/dadadada-up/dada_bolg.git
cd dada_bolg
```

2. 安装依赖
```bash
python -m venv venv
source venv/bin/activate  # Windows 使用 venv\Scripts\activate
pip install -r requirements.txt
```

3. 本地预览
```bash
python -m mkdocs serve
```

4. 构建静态文件
```bash
python -m mkdocs build
```

## 写作指南

### 创建新文章

1. 在 `docs/blog/posts` 目录下创建 Markdown 文件
2. 添加 front matter：
```yaml
---
title: 文章标题
date: YYYY-MM-DD
categories:
  - 分类名称 # AI/Python/工具/产品
tags:
  - 标签1
  - 标签2
---

文章摘要

<!-- more -->

正文内容
```

### 添加图片

1. 将图片放在 `docs/assets/images` 目录下
2. 在文章中使用相对路径引用：
```markdown
![图片描述](/assets/images/example.png)
```

## 部署

本站使用 GitHub Pages 部署，通过 GitHub Actions 自动构建和发布。

## 许可证

MIT License

## 联系方式

- GitHub: [@dadadada-up](https://github.com/dadadada-up)

