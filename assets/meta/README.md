# DADA 博客

这是一个基于Next.js构建的博客系统，使用SQLite本地开发和Turso云数据库部署到Vercel。

## 项目结构

- `src/`: 源代码目录
  - `app/`: Next.js应用页面和API路由
  - `components/`: React组件
  - `lib/`: 通用库和工具函数
  - `styles/`: 样式文件
  - `types/`: TypeScript类型定义
- `config/`: 配置文件
  - `db/`: 数据库配置
  - `env/`: 环境变量配置
  - `site/`: 站点配置
- `scripts/`: 辅助脚本
  - `db/`: 数据库相关脚本
  - `deploy/`: 部署相关脚本
  - `utils/`: 工具脚本
- `docs/`: 项目文档
  - `development/`: 开发相关文档
  - `architecture/`: 架构设计文档
  - `setup/`: 安装和配置指南
  - `api/`: API文档

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **样式**: Tailwind CSS
- **内容渲染**: React Markdown, Katex, Mermaid
- **数据库**: 
  - 开发环境: SQLite
  - 生产环境: Turso (LibSQL)
- **部署**: Vercel

## 本地开发

1. 安装依赖:
   ```bash
   npm install
   ```

2. 启动开发服务器:
   ```bash
   npm run dev
   ```

3. 访问 [http://localhost:3000](http://localhost:3000)

## 数据库迁移

从本地SQLite迁移到Turso:

```bash
npm run migrate-to-turso
```

## 部署到Vercel

项目配置了自动部署到Vercel，包括Turso数据库连接的设置。详情请参考 `docs/setup/` 目录中的文档。

## 文档

详细文档请参考 `docs/` 目录下的文件。

## 许可证

本项目仅供学习参考，未经许可不得用于商业用途。
