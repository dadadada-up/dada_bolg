# 博客系统目录结构规划

## 当前目录结构问题
当前项目存在以下目录结构问题：

1. **重复的前端文件**：
   - `docs/` 目录下有 HTML 文件（index.html, article.html 等）
   - `blog/` 目录下也有相同的 HTML 文件
   - 两个目录都有自己的 assets 文件夹

2. **重复的管理系统文件**：
   - `docs/document-manager.html` 
   - `admin/document-manager.html` 和 `admin/index.html`

3. **文档路径不一致**：
   - 配置文件中的 `docsPath` 有的是 `'docs/posts'`，有的是 `'content/posts'`
   - 实际文档存储在 `content/posts` 和 `docs/posts` 两个位置

4. **logs 目录**：
   - 存在大量日志文件，可能是内容迁移时的记录

## 调整后的目录结构

```
/ (根目录)
├── admin/                # 内容管理系统
│   ├── index.html        # 管理系统入口
│   ├── document-manager.html  # 管理系统入口（兼容旧版）
│   └── assets/           # 管理系统资源
│       ├── css/          # 样式文件
│       └── js/           # 脚本文件
│
├── blog/                 # 博客前端展示系统
│   ├── index.html        # 博客首页
│   ├── article.html      # 文章详情页
│   ├── articles.html     # 文章列表页
│   ├── categories.html   # 分类页面
│   ├── tags.html         # 标签页面
│   ├── about.html        # 关于页面
│   ├── README.md         # 说明文档
│   └── assets/           # 前端资源
│       ├── css/          # 样式文件
│       ├── js/           # 脚本文件
│       └── images/       # 图片资源
│
├── content/              # 内容存储目录
│   ├── posts/            # 文章存储目录（主要）
│   │   ├── category1/    # 分类目录
│   │   ├── category2/    # 分类目录
│   │   └── ...
│   └── assets/           # 内容相关资源（如文章图片等）
│
├── temp/                 # 临时文件目录
│   ├── oldDocs/          # 旧文档备份
│   ├── oldLogs/          # 旧日志备份
│   └── ...
│
├── README.md             # 项目说明文档
└── directory-structure.md  # 本文件：目录结构说明
```

## 调整计划

1. 确保所有配置文件中的 `docsPath` 都设置为 `'content/posts'`
2. 保留 `blog/` 作为博客前端系统，移除 `docs/` 中的重复文件
3. 保留 `admin/` 作为内容管理系统，移除 `docs/document-manager.html`
4. 确保所有程序都使用 `content/posts` 作为唯一的文章存储位置
5. 将 `logs/` 目录中的文件备份到 `temp/oldLogs/`
6. 将不再需要的文档备份到 `temp/oldDocs/` 