# dada_blog - 个人博客内容仓库

这个仓库存储了我的个人博客文章和相关内容，采用 Markdown 格式。该仓库与我的博客平台集成，当内容更新时，博客网站会自动获取并展示最新内容。

## 仓库结构

```
/
├── content/           # 博客内容目录
│   ├── posts/        # 已发布的博客文章
│   ├── drafts/       # 草稿文章
│   ├── reports/      # 报告和文档
│   └── assets/       # 图片和其他媒体资源
└── blog-app/         # 博客平台前端代码
```

## 文档规范

### 1. 文件命名规范

- **格式**：`YYYY-MM-DD-标题.md`
- **中文标题**：优先使用中文命名，如：`2024-10-29-房地产系列.md`
- **英文标题**：也支持英文命名，如：`2024-03-18-vscode-drawio-guide.md`
- **注意事项**：
  - 文件名中不要使用空格，用连字符(-)替代
  - 避免使用特殊字符（如：`? * : " < > |` 等）
  - 目录可以使用中文命名，但建议保持简洁明了

### 2. Front Matter 规范

#### 必填字段

| 字段 | 说明 | 示例 |
|------|------|------|
| `title` | 文章标题（优先中文，用双引号包裹） | `title: "使用Next.js构建博客"` |
| `date` | 发布日期（YYYY-MM-DD格式） | `date: "2023-06-15"` |
| `categories` | 至少一个分类（见下方推荐分类） | `categories: ["技术"]` 或见示例 |

**推荐分类**：
- 技术（Tech）
- 金融（Finance）
- 生活（Life）
- 读书（Reading）
- 观点（Opinion）

#### 可选字段

| 字段 | 说明 | 示例 |
|------|------|------|
| `updateDate` | 最近修改日期 | `updateDate: "2023-06-20"` |
| `tags` | 文章标签（细化分类） | `tags: ["Next.js", "React"]` |
| `description` | 文章描述（50-150字） | `description: "介绍如何使用..."` |
| `image` | 封面图片路径 | `image: "/assets/images/cover.jpg"` |
| `published` | 发布状态 | `published: true` |
| `original_title` | 原始标题（导入文章用） | `original_title: "原标题"` |
| `author` | 作者名称 | `author: "作者名"` |
| `series` | 系列文章名称 | `series: "React教程系列"` |

#### Front Matter 格式规范

- 必须使用三个破折号`---`开始和结束
- 冒号后必须有空格：`title: "标题"` 而非 `title:"标题"`
- 包含特殊字符的值应使用双引号包裹
- 列表项必须使用正确缩进（通常是2个空格）

#### 标准格式示例

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
image: "/assets/images/posts/tech/2023-06-15-nextjs-blog/cover.jpg"
published: true
---
```

### 3. Markdown 书写规范

#### 3.1 标题规范

- 文章正文从二级标题(`##`)开始，一级标题已被Front Matter中的title使用
- 标题层级不要跳级使用，如二级标题(`##`)后应使用三级标题(`###`)
- 标题层级最多到四级标题(`####`)
- 标题与内容之间空一行
- 标题可使用序号标注层级关系：
  - 二级标题：`## 1. 标题名称`
  - 三级标题：`### 1.1 标题名称`
  - 四级标题：`#### 1.1.1 标题名称`

#### 3.2 正文格式

- 段落之间空一行
- 强调文本使用`**粗体**`或`*斜体*`
- 列表项使用`-`或`1.`开头，保持一致的缩进
- 引用使用`>`符号：
  ```
  > 这是一段引用文字
  ```

#### 3.3 链接与图片

##### 链接格式
```
[链接文字](链接URL)
```

##### 图片格式
```
![图片描述](/assets/images/posts/分类/YYYY-MM-DD-标题/图片名.jpg)
```

##### 图片存放规则
- 路径：`/assets/images/posts/分类/YYYY-MM-DD-标题/`
- 示例：`/assets/images/posts/tech/2023-06-15-nextjs-blog/cover.jpg`

#### 3.4 代码规范

##### 行内代码
使用反引号包裹：`` `代码` ``

##### 代码块
使用三个反引号并指定语言：

````
```javascript
const greeting = "你好，世界！";
console.log(greeting);
```
````

#### 3.5 图片处理建议

- 单张图片不超过500KB
- 宽度控制在800px-1200px之间
- 优先使用WebP格式，其次是JPG、PNG
- 文件名应有意义，格式可为：`image-name.webp`

### 4. 文章模板

```markdown
---
title: "文章标题"
date: "YYYY-MM-DD"
categories: 
  - "主分类"
tags:
  - "标签1"
  - "标签2"
description: "文章简短描述，会显示在列表页和SEO中"
image: "/assets/images/posts/分类/YYYY-MM-DD-标题/cover.jpg"
---

## 1. 引言

简短介绍文章内容和目的。

## 2. 主要内容

### 2.1 小节标题

正文内容...

![图片描述](/assets/images/posts/分类/YYYY-MM-DD-标题/image1.jpg)

### 2.2 另一个小节

更多内容...

## 3. 总结

总结文章要点和结论。

## 参考资料

- [资料名称](链接)
- [资料名称](链接)
```

## 工作流程

1. 在本地编写 Markdown 文章
2. 提交并推送到 GitHub 仓库
3. 博客平台自动获取更新内容
4. 几分钟后，新内容将在博客网站上展示

## 本地预览

如果您想在本地预览博客效果，可以：

1. 克隆博客平台仓库
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev`
4. 浏览器访问：`http://localhost:3000`

## 常见问题

### 1. Front Matter格式错误

- 确保使用三个破折号`---`开始和结束
- 检查冒号后是否有空格
- 特殊字符需要用引号包裹
- 列表缩进保持一致（通常2个空格）

### 2. 图片不显示

- 检查图片路径是否正确
- 确认图片文件是否存在
- 使用相对路径引用图片

### 3. 标题层级混乱

- 文章正文应从二级标题(`##`)开始
- 保持标题层级的连贯性
- 避免跳级使用标题

## 相关链接

- 博客网站：[https://yourblog.com](https://yourblog.com)
- 问题反馈：可在本仓库提交 Issue 