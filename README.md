# Dada博客文档项目

这个仓库包含了个人博客的所有文档和资源，按照不同主题和用途组织，采用统一的规范便于管理和展示。

## 项目结构

```
dada_blog/
├── docs/                           # 主文档目录
│   ├── posts/                      # 博客文章
│   │   ├── product-management/     # 产品管理相关
│   │   ├── tech-tools/             # 技术工具相关
│   │   ├── finance/                # 财务金融相关
│   │   ├── insurance/              # 保险相关
│   │   │   └── agriculture-insurance/ # 农业保险相关
│   │   ├── personal-blog/          # 个人博客建设相关
│   │   ├── open-source/            # 开源项目相关
│   │   └── family-life/            # 家庭生活相关
│   │       └── travel/             # 旅行计划相关
├── assets/                         # 静态资源
│   ├── images/                     # 图片资源
│   │   └── posts/                  # 按文章分类存放图片
│   └── files/                      # 其他文件
├── scripts/                        # 脚本文件目录
│   ├── check_filename_format.sh    # 检查文件名格式
│   ├── fix_all.sh                  # 一键修复所有问题
│   ├── cleanup.sh                  # 清理临时文件
│   └── ...                         # 其他脚本文件
├── logs/                           # 日志文件目录
│   ├── filename_check_results.txt  # 文件名检查结果
│   └── ...                         # 其他日志文件
├── reports/                        # 报告文件目录
│   ├── standardization_report.md   # 标准化工作报告
│   └── project_summary.md          # 项目总结
├── backups/                        # 备份文件目录
│   └── *.tar.gz                    # 备份文件
├── blog_manager.sh                 # 博客管理主脚本
└── README.md                       # 项目说明文档
```

## 文档规范

### 文件命名规范

- **格式**：`YYYY-MM-DD-标题.md`
- **中文标题**：优先使用中文命名，如：`2024-10-29-房地产系列.md`
- **英文标题**：也支持英文命名，如：`2024-03-18-vscode-drawio-guide.md`
- **注意事项**：
  - 文件名中不要使用空格，用连字符(-)替代
  - 避免使用特殊字符（如：? * : " < > | 等）
  - 目录可以使用中文命名，但建议保持简洁明了

### Front Matter 规范

**必填字段**：
- `title`: 文章标题（优先使用中文，建议用双引号包裹）
- `date`: 发布日期（格式：YYYY-MM-DD）
- `categories`: 至少一个分类（建议从以下主分类选择）
  - 技术（Tech）
  - 金融（Finance）
  - 生活（Life）
  - 读书（Reading）
  - 观点（Opinion）

**可选字段**：
- `updateDate`: 最近修改日期
- `tags`: 文章标签（可以更细化的分类）
- `description`: 文章描述（建议50-150字）
- `image`: 封面图片路径
- `published`: 发布状态（默认为true）
- `original_title`: 原始标题（用于从其他平台导入的文章）
- `author`: 作者名称（多作者博客时使用）
- `series`: 系列文章名称（如"React教程系列"）

**YAML格式注意事项**：
1. 必须使用三个破折号`---`开始和结束
2. 冒号后必须有空格：例如`title: "标题"` 而非 `title:"标题"`
3. 包含特殊字符的字符串应使用双引号包裹
4. 列表项必须使用正确缩进（通常是2个空格）
5. 避免特殊标记：不要在values中使用YAML特殊字符如`: { } [ ] & * # ? | - < > = ! % @ \`

**标准格式示例**：
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

### Markdown 书写规范

1. **标题层级**
   - 文章正文从 h2 (##) 开始
   - 最多使用到 h4 (####)

2. **图片引用**
   - 使用相对路径
   - 格式：`![描述](/assets/images/posts/分类/YYYY-MM-DD-标题/图片名.jpg)`
   - 图片放在相应的目录下：`/assets/images/posts/分类/YYYY-MM-DD-标题/`

3. **代码块**
   - 指定语言类型
   - 使用 ``` 标记
   - 示例：
     ```javascript
     const greeting = "你好，世界！";
     console.log(greeting);
     ```

4. **表格**
   - 使用标准Markdown表格语法
   - 示例：
     ```
     | 列1 | 列2 | 列3 |
     |-----|-----|-----|
     | 内容1 | 内容2 | 内容3 |
     ```

5. **引用与注释**
   - 使用 > 标记引用
   - 示例：`> 这是一段引用文字。`

6. **图片处理建议**
   - 单张图片不超过500KB
   - 宽度控制在800px-1200px之间
   - 优先使用WebP格式，其次是JPG、PNG
   - 使用有意义的文件名，避免随机字符串

## 已完成的标准化工作

1. **文件重命名**：
   - 已完成所有文件的命名规范化
   - 注意：如需将文件改回中文命名，可以使用下方的维护工具进行批量处理

2. **Front Matter修复**：
   - 添加缺失的Front Matter
   - 修复Front Matter结构问题
   - 修复冒号后空格、引号等格式问题
   - 统一标题格式

3. **图片路径更新**：
   - 本地图片路径规范化为 `/assets/images/posts/分类/YYYY-MM-DD-标题/图片名.jpg`
   - 远程图片已下载至本地并更新引用路径

4. **未命名文档处理**：
   - 将所有未命名文档统一重命名为 `YYYY-MM-DD-unnamed-document.md`
   - 为空文档添加基本模板

5. **特殊字符处理**：
   - 移除文件名中的特殊字符如引号、冒号等
   - 修复多余的连字符

6. **标题匹配问题修复**：
   - 确保文件名与Front Matter中的标题一致
   - 优化了比较算法，允许空格与连字符的差异

## 维护工具

为了帮助维护文档规范，我们提供了以下辅助脚本：

1. **blog_manager.sh**：博客文档管理主脚本
   ```bash
   # 查看文件名格式
   ./blog_manager.sh check
   
   # 查看帮助信息
   ./blog_manager.sh help
   
   # 修复所有文档问题
   ./blog_manager.sh fix --all
   
   # 查看标准化报告
   ./blog_manager.sh report
   ```

2. **单独的脚本工具**：
   所有的脚本工具都已整理到`scripts`目录下，日志文件保存在`logs`目录中，报告文件保存在`reports`目录中。

   ```bash
   # 检查文件命名是否符合规范
   bash scripts/check_filename_format.sh
   
   # 一次性执行所有修复脚本
   bash scripts/fix_all.sh
   ```

## 后续维护建议

1. **新增文档**：
   - 使用标准格式 `YYYY-MM-DD-英文标题.md`
   - 确保完整的Front Matter
   - 参考下方的文章模板创建内容

2. **图片管理**：
   - 将图片存放在对应的 `/assets/images/posts/分类/YYYY-MM-DD-标题/` 目录下
   - 压缩图片以减小体积
   - 使用有意义的文件名

3. **定期检查**：
   - 运行 `./check_filename_format.sh` 检查是否有不符合规范的文件
   - 如有多个文件需要修复，运行 `./fix_all.sh` 进行一键修复

4. **SEO优化**：
   - 标题应包含关键词，长度控制在60个字符以内
   - 描述应准确概括文章内容，包含关键词
   - 图片添加alt属性
   - 适当添加站内其他相关文章的链接

## 文章模板

以下是一个标准博客文章的模板结构：

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

## 引言

简短介绍文章内容和目的。

## 主要内容

### 小节标题

正文内容...

![图片描述](/assets/images/posts/分类/YYYY-MM-DD-标题/image1.jpg)

### 另一个小节

更多内容...

## 总结

总结文章要点和结论。

## 参考资料

- [资料名称](链接)
- [资料名称](链接)
```

## 常见问题解答

1. **Front Matter格式错误**：
   - 确保使用三个破折号`---`开始和结束
   - 检查冒号后是否有空格
   - 特殊字符需要用引号包裹

2. **图片不显示**：
   - 检查图片路径是否正确
   - 确认图片文件是否存在
   - 使用相对路径引用图片

3. **标题层级混乱**：
   - 文章正文应从二级标题(##)开始
   - 保持标题层级的连贯性
   - 避免跳级使用标题

4. **YAML解析错误**：
   - 确保Front Matter前后都有三个破折号`---`
   - 确保冒号后有空格
   - 多行字段需要正确缩进
   - 每个列表项必须保持一致的格式和缩进

## 版权说明

除特别注明外，本仓库内容采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议。 