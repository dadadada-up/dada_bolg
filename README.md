# dada的博客系统

这是一个基于GitHub Pages和GitHub API构建的静态博客系统，专注于前端展示，通过GitHub直接管理内容。

## 系统架构

本博客系统由两个主要部分组成：

1. **博客前端展示系统**：位于`blog`目录，负责展示文章和提供用户界面
2. **内容存储**：所有文章存储在仓库的`content/posts`目录下，通过GitHub直接管理

系统通过GitHub API与GitHub仓库交互，自动识别文章的Front Matter信息。

## 优化后的目录结构

```
/ (根目录)
├── blog/                 # 博客前端展示系统
│   ├── index.html        # 博客首页
│   ├── article.html      # 文章详情页
│   ├── articles.html     # 文章列表页
│   ├── categories.html   # 分类页面
│   ├── tags.html         # 标签页面
│   ├── about.html        # 关于页面
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
├── scripts/              # 脚本工具目录
│   ├── manage_blog.sh    # 博客管理主脚本
│   └── image_tools/      # 图片处理工具
│
├── docs/                 # 文档目录
│   └── directory-structure.md # 目录结构说明
│
├── temp/                 # 临时文件目录
│   └── backups/          # 备份文件
│
├── manage.sh             # 便捷管理脚本
├── server.py             # 本地预览服务器
└── README.md             # 本文件：项目说明文档
```

## 文章内容管理

所有博客文章通过GitHub网站或Git客户端直接管理，存储在`content/posts`目录下，按类别分类。

### Front Matter 规范

每篇文章的元数据使用YAML格式的Front Matter定义，位于Markdown文件顶部。

**必填字段**：
- `title`: 文章标题
- `date`: 发布日期，格式为 YYYY-MM-DD
- `categories`: 文章分类（可以是字符串或数组）

**可选字段**：
- `updateDate`: 最近修改日期
- `tags`: 文章标签（可以更细化的分类）
- `description`: 文章描述（建议50-150字）
- `image`: 封面图片路径
- `published`: 发布状态（默认为true）

**示例**：
```yaml
---
title: "使用Next.js和TypeScript构建现代博客"
date: "2023-06-15"
updateDate: "2023-06-20"
categories: 
  - "前端开发"
tags:
  - "Next.js"
  - "TypeScript"
  - "React"
description: "本文介绍如何使用Next.js和TypeScript构建一个现代化、高性能的博客系统。"
image: "/assets/images/posts/tech/2023-06-15-nextjs-blog/cover.jpg"
published: true
---
```

## 本地预览和管理

使用统一的管理脚本进行博客系统的操作：

```bash
# 启动博客预览服务器
./manage.sh preview

# 检查图片引用
./manage.sh check-images

# 修复图片引用问题
./manage.sh fix-images

# 创建博客内容备份
./manage.sh backup

# 清理临时文件
./manage.sh clean

# 显示帮助信息
./manage.sh help
```

访问博客预览：http://localhost:8000

## 开发计划

### 短期任务

1. **前端功能调整**
   - 完善博客界面的响应式设计
   - 改进文章阅读体验
   - 添加文章目录自动生成功能

2. **管理系统增强**
   - 升级图片上传和管理功能
   - 添加草稿和正式文章分类管理
   - 改进批量操作功能

### 中期计划

1. **系统集成**
   - 优化GitHub API使用，减少请求次数
   - 改进缓存策略，提高加载速度
   - 完善错误处理机制

2. **功能扩展**
   - 添加评论功能（基于GitHub Issues）
   - 实现文章分享功能
   - 添加访问统计

### 长期规划

1. **性能优化**
   - 资源压缩和合并
   - 懒加载技术应用
   - 构建自动化部署流程

2. **可维护性提升**
   - 编写详细的用户和开发文档
   - 添加自动化测试
   - 设计监控和告警机制

## 如何使用

1. 访问博客首页：`/blog/index.html`
2. 访问内容管理系统：`/admin/index.html`（需要GitHub Token授权）

## 配置说明

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

## 快速链接

- [文档统计](/docs/stats.md) - 查看博客文档的分类统计信息
- [文档管理](/docs/document-manager.html) - 可视化管理博客文档
- [维护工具](#维护工具) - 博客文档管理工具指南
- [文档规范](#文档规范) - 查看博客文档的格式规范

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
│   │
│   └── assets/                         # 静态资源
│       ├── images/                     # 图片资源
│       │   └── posts/                  # 按文章分类存放图片
│       └── files/                      # 其他文件
│
├── scripts/                        # 脚本文件目录
│   ├── check_filename_format.sh    # 检查文件名格式
│   ├── fix_all.sh                  # 一键修复所有问题
│   ├── cleanup.sh                  # 清理临时文件
│   └── ...                         # 其他脚本文件
│
├── logs/                           # 日志文件目录
│   ├── filename_check_results.txt  # 文件名检查结果
│   └── ...                         # 其他日志文件
│
├── reports/                        # 报告文件目录
│   ├── standardization_report.md   # 标准化工作报告
│   └── project_summary.md          # 项目总结
│
├── backups/                        # 备份文件目录
│   └── *.tar.gz                    # 备份文件
│
├── .github/                        # GitHub配置文件
│   └── workflows/                  # GitHub Actions工作流
│       └── update-doc-stats.yml    # 自动更新文档统计
│
├── blog_manager.sh                 # 博客管理主脚本
└── README.md                       # 项目说明文档
```

## 文档规范

### 文章格式规范

#### 1. Front Matter 规范

每篇文章必须包含YAML格式的Front Matter，位于文件顶部。

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
- `updateDate`: 最近修改日期（格式：YYYY-MM-DD）
- `tags`: 文章标签（可以更细化的分类）
- `description`: 文章描述（建议50-150字）
- `image`: 封面图片路径
- `published`: 发布状态（默认为true）

**示例**：
```yaml
---
title: "使用Next.js和TypeScript构建现代博客"
date: "2023-06-15"
updateDate: "2023-06-20"
categories: 
  - "前端开发"
tags:
  - "Next.js"
  - "TypeScript"
  - "React"
description: "本文介绍如何使用Next.js和TypeScript构建一个现代化、高性能的博客系统。"
image: "/assets/images/posts/tech/2023-06-15-nextjs-blog/cover.jpg"
published: true
---
```

#### 2. Markdown 书写规范

**标题层级**：
- 一级标题：`#`（用于文章标题，Front Matter中的title字段）
- 二级标题：`##`（用于主要章节）
- 三级标题：`###`（用于子章节）
- 四级标题：`####`（用于更细分的部分）

**正文格式**：
1. **段落**：
   - 段落之间空一行
   - 段落首行不缩进
   - 每行建议不超过80个字符

2. **列表**：
   - 有序列表使用数字加点（1. 2. 3.）
   - 无序列表使用短横线（-）
   - 列表项之间空一行
   - 多级列表缩进两个空格

3. **代码块**：
   - 使用三个反引号（```）包裹
   - 指定语言类型
   - 代码块前后空一行

4. **引用**：
   - 使用 `>` 符号
   - 引用块前后空一行
   - 多行引用每行都加 `>`

5. **图片**：
   - 使用 `![描述](路径)` 格式
   - 图片路径使用相对路径
   - 建议添加图片描述

6. **链接**：
   - 使用 `[文本](URL)` 格式
   - 外部链接建议在新窗口打开
   - 内部链接使用相对路径

7. **强调**：
   - 斜体：`*文本*` 或 `_文本_`
   - 粗体：`**文本**` 或 `__文本__`
   - 代码：`` `文本` ``

8. **表格**：
   - 使用 `|` 和 `-` 创建
   - 表头行使用 `---` 分隔
   - 对齐方式使用 `:` 指定

9. **序号规范**：
   - 一级序号：1. 2. 3.
   - 二级序号：1.1 1.2 1.3
   - 三级序号：1.1.1 1.1.2 1.1.3
   - 序号后使用空格，不使用括号
   - 建议使用自动生成的序号

### 文件命名规范

- **格式**：`YYYY-MM-DD-标题.md`
- **中文标题**：优先使用中文命名，如：`2024-10-29-房地产系列.md`
- **英文标题**：也支持英文命名，如：`2024-03-18-vscode-drawio-guide.md`
- **注意事项**：
  - 文件名中不要使用空格，用连字符(-)替代
  - 避免使用特殊字符（如：? * : " < > | 等）
  - 目录可以使用中文命名，但建议保持简洁明了

### 目录结构规范

```
/ (根目录)
├── blog/                 # 博客前端展示系统
│   ├── index.html        # 博客首页
│   ├── article.html      # 文章详情页
│   ├── articles.html     # 文章列表页
│   ├── categories.html   # 分类页面
│   ├── tags.html         # 标签页面
│   ├── about.html        # 关于页面
│   └── assets/           # 前端资源
│       ├── css/          # 样式文件
│       ├── js/           # 脚本文件
│       └── images/       # 图片资源
│
├── content/              # 内容存储目录
│   ├── posts/            # 文章存储目录
│   │   ├── tech/         # 技术类文章
│   │   ├── finance/      # 金融类文章
│   │   ├── life/         # 生活类文章
│   │   ├── reading/      # 读书类文章
│   │   └── opinion/      # 观点类文章
│   └── assets/           # 内容相关资源
│       └── images/       # 文章图片资源
│
├── scripts/              # 脚本工具目录
│   ├── manage_blog.sh    # 博客管理主脚本
│   └── image_tools/      # 图片处理工具
│
├── docs/                 # 文档目录
│   └── directory-structure.md # 目录结构说明
│
├── temp/                 # 临时文件目录
│   └── backups/          # 备份文件
│
├── manage.sh             # 便捷管理脚本
├── server.py             # 本地预览服务器
└── README.md             # 项目说明文档
```

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