# 产品经理的AI探索之路

这是一个基于 Hugo 构建的个人博客系统，用于记录从保险产品经理到 AI 实践者的学习和转型之路。

## 项目架构

项目采用双站点结构：

- 主站（Hugo + GitHub Pages）
  - 用于托管深度技术文章和经验分享
  - 支持 Markdown 写作
  - 支持文章分类和标签管理
  - 集成访问统计功能

- 子站（NotionNext + Vercel）
  - 用于展示 AI 项目的交互式 demo
  - 与 Notion 笔记系统无缝集成
  - 支持动态内容更新

## 内容架构

1. 文章分类
   - 产品经理经验
   - AI 技术学习
   - 项目实践
   - 个人成长

2. 知识管理
   - 支持标准化的 front matter
   - 集成知识图谱
   - 支持内容检索

3. 项目展示
   - Notion API 任务提醒系统
   - 跨平台资产管理工具
   - 更多进行中的项目...

## 技术栈

- 主站
  - Hugo（静态站点生成器）
  - PaperMod（主题）
  - GitHub Actions（自动部署）
  - Google Analytics（访问统计）

- 子站
  - NotionNext
  - Vercel（部署）
  - Notion API（内容管理）

## 部署流程

1. 内容创作
   ```
   hugo new posts/新文章.md
   ```

2. 本地预览
   ```
   hugo server -D
   ```

3. 构建部署
   ```
   hugo
   git push
   ```

## 自动化工作流

使用 GitHub Actions 实现：
- Markdown 文档自动同步
- 站点自动构建和部署
- 内容格式检查

## 待开发功能

- [ ] 评论系统集成
- [ ] 全文搜索功能
- [ ] 访问统计面板
- [ ] RSS 订阅功能
- [ ] 知识图谱可视化
- [ ] AI 助手集成

## 贡献指南

欢迎通过以下方式参与项目：
1. 提交 Issue
2. 提交 Pull Request
3. 分享使用经验

## 许可证

MIT License

