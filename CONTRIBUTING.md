# 博客内容贡献指南

## 目录结构

```
docs/
├── posts/          # 博客文章
├── assets/         # 静态资源
│   ├── images/     # 图片资源
│   └── files/      # 其他文件
└── drafts/         # 草稿文章
```

## Markdown 文件命名规范

- 使用英文命名文件
- 格式：`YYYY-MM-DD-title.md`
- 示例：`2023-06-15-hello-world.md`

## Front Matter 规范

必填字段：
- title: 文章标题
- date: 发布日期
- categories: 至少一个分类

可选字段：
- tags: 文章标签
- description: 文章描述
- image: 封面图片
- published: 发布状态

## Markdown 书写规范

1. 标题层级
   - 文章正文从 h2 (##) 开始
   - 最多使用到 h4 (####)

2. 图片引用
   - 使用相对路径
   - 格式：`![描述](/assets/images/filename.jpg)`

3. 代码块
   - 指定语言类型
   - 使用 ``` 标记
