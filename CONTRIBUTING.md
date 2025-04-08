# 博客内容贡献指南

## 目录结构

```
docs/
├── posts/          # 博客文章（支持中文目录名）
├── assets/         # 静态资源
│   ├── images/     # 图片资源
│   └── files/      # 其他文件
└── drafts/         # 草稿文章
```

## Markdown 文件命名规范

- 支持中文命名文件
- 格式：`YYYY-MM-DD-标题.md` 或 `YYYY-MM-DD-title.md`
- 示例：`2023-06-15-你好世界.md` 或 `2023-06-15-hello-world.md`

## Front Matter 规范

必填字段：
- `title`: 文章标题
- `date`: 发布日期（不指定时默认为当前日期）
- `categories`: 至少一个分类

可选字段：
- `updateDate`: 最近修改日期（不指定时默认与发布日期相同）
- `tags`: 文章标签
- `description`: 文章描述
- `image`: 封面图片路径
- `published`: 发布状态（默认为true）
- `original_title`: 原始标题（用于从其他平台导入的文章）

### YAML格式注意事项

1. **正确的Front Matter格式**：必须使用三个破折号`---`开始和结束
2. **冒号后必须有空格**：例如`title: "标题"` 而非 `title:"标题"`
3. **字符串引号**：包含特殊字符的字符串（如中文标题）应使用双引号包裹
4. **缩进**：列表项必须使用正确缩进，通常是2个空格
5. **避免特殊标记**：不要在values中使用YAML特殊字符如`: { } [ ] & * # ? | - < > = ! % @ \`
6. **数组格式**：categories和tags等数组必须正确格式化

### 常见错误示例与修正

❌ **错误**:
```yaml
---
categories:
  - "技术工具"
- 【开源推荐】dingtalk": true
date: '2025-02-20'
---
```

✅ **正确**:
```yaml
---
categories:
  - "技术工具"
  - "开源推荐"
title: "【开源推荐】dingtalk-monitor"
date: '2025-02-20'
---
```

❌ **错误**:
```yaml
---
tags:
  - "AI
  - Cursor
  - DeepSeek
  - 技术"
---
```

✅ **正确**:
```yaml
---
tags:
  - "AI"
  - "Cursor"
  - "DeepSeek"
  - "技术"
---
```

### 完整示例

```yaml
---
title: "使用Next.js和TypeScript构建现代博客"
date: "2023-06-15"
updateDate: "2023-06-20"
categories: 
  - "前端开发"
  - "网站建设"
tags:
  - "Next.js"
  - "TypeScript"
  - "React"
description: "本文介绍如何使用Next.js和TypeScript构建一个现代化、高性能的博客系统。"
image: "/assets/images/nextjs-blog.jpg"
published: true
---
```

## Markdown 书写规范

1. 标题层级
   - 文章正文从 h2 (##) 开始
   - 最多使用到 h4 (####)

2. 图片引用
   - 使用相对路径
   - 格式：`![描述](/assets/images/filename.jpg)`
   - 支持中文图片名称和路径
   - 推荐图片放在`/assets/images/文章标题/`目录下

3. 代码块
   - 指定语言类型
   - 使用 ``` 标记
   - 示例：
     ```javascript
     const greeting = "你好，世界！";
     console.log(greeting);
     ```

4. 表格
   - 使用标准Markdown表格语法
   - 示例：
     ```
     | 列1 | 列2 | 列3 |
     |-----|-----|-----|
     | 内容1 | 内容2 | 内容3 |
     ```

5. 引用与注释
   - 使用 > 标记引用
   - 示例：
     ```
     > 这是一段引用文字。
     ```

6. 列表
   - 有序列表使用数字和点
   - 无序列表使用 - 或 *
   - 示例：
     ```
     1. 第一项
     2. 第二项
     
     - 项目一
     - 项目二
     ```

## 图片处理最佳实践

1. **正确的图片路径**：
   - 从语雀导入的图片会自动进行代理处理
   - 本地图片推荐使用项目相对路径
   - 例如：`/assets/images/2023-06-15-hello-world/example.jpg`

2. **图片尺寸限制**：
   - 建议单张图片不超过500KB
   - 宽度最好控制在800px-1200px之间

3. **图片格式**：
   - 推荐使用WebP格式
   - 也支持JPG、PNG、GIF格式

## 常见问题

1. **YAML解析错误**：
   - 确保Front Matter前后都有三个破折号`---`
   - 确保冒号后有空格
   - 多行字段需要正确缩进
   - 中文标题等特殊字符应使用引号包裹
   - 每个列表项必须保持一致的格式和缩进

2. **图片路径错误**：
   - 确保图片路径正确，推荐使用相对于博客根目录的绝对路径（如`/assets/images/filename.jpg`）
   - 语雀图片可以保留原始链接，系统会自动进行代理处理

3. **中文文件名和路径**：
   - 支持中文文件名和路径，但URL会自动转换为拼音或编码形式
   - 如果出现乱码或404错误，可以考虑使用英文命名

感谢您为博客做出贡献！如有任何问题，请联系管理员。
