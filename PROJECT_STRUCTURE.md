# 项目结构说明

本项目已经进行了目录结构优化，主要采用了三层目录结构，大幅减少根目录文件数量。

## 主要一级目录

- `src/` - 源代码目录
- `public/` - 静态资源文件
- `scripts/` - 项目脚本
- `configs/` - 所有配置文件
- `assets/` - 项目资源和文档
- `data/` - 数据相关目录

## 详细目录结构

### 源代码和开发资源
- `src/` - 主要源代码
- `public/` - 静态资源文件
- `scripts/` - 项目脚本

### 配置目录 (`configs/`)
- `configs/` - 配置文件根目录
  - `next.config.js` - Next.js 配置
  - `tailwind.config.js` - Tailwind CSS 配置
  - `postcss.config.js` - PostCSS 配置
  - `vitest.config.ts` - Vitest 测试配置
  - `tsconfig.json` - TypeScript 配置
  - `.babelrc.js` - Babel 配置
  - `env/` - 环境变量目录
    - `.env.development` - 开发环境变量
    - `.env.production` - 生产环境变量
    - `.env.local` - 本地环境变量
    - `.env.example` - 环境变量示例
  - `vercel/` - Vercel 部署配置目录
    - `vercel.json` - Vercel 配置
    - `test-vercel-build.js` - 测试Vercel构建脚本
  - `ignore/` - 忽略规则目录
    - `.gitignore` - Git忽略规则
    - `.cursorignore` - Cursor编辑器忽略规则
  - `types/` - TypeScript 类型定义目录
    - `next-env.d.ts` - Next.js 环境类型定义
    - `next.fetch.ts` - 自定义fetch类型

### 项目资源 (`assets/`)
- `assets/` - 项目资源根目录
  - `meta/` - 项目元数据
    - `README.md` - 项目说明
    - `DOCUMENTATION.md` - 项目文档
    - `LICENSE` - 许可证
  - `docs/` - 详细文档

### 数据目录 (`data/`)
- `data/` - 数据根目录
  - `db/` - 数据库文件
    - `turso_schema_fixed.sql` - 数据库表结构定义
    - `blog_dump.sql` - 数据库备份
  - `storage/` - 数据存储目录
  - `tables/` - 数据表结构
  - `contents/` - 内容文件

## 符号链接说明

为了保持项目的兼容性，以下文件通过符号链接指向实际位置：

- `README.md` → `assets/meta/README.md`
- `DOCUMENTATION.md` → `assets/meta/DOCUMENTATION.md`
- `tsconfig.json` → `configs/tsconfig.json`
- `next-env.d.ts` → `configs/types/next-env.d.ts`
- `next.fetch.ts` → `configs/types/next.fetch.ts`
- `.gitignore` → `configs/ignore/.gitignore`
- `.cursorignore` → `configs/ignore/.cursorignore`

## 整理优势

1. **最小化根目录** - 将大量文件整合到少数几个核心目录中
2. **三层结构设计** - 使用三层目录结构提高组织性
   - 第一层：核心功能分类（configs、assets、data等）
   - 第二层：具体功能模块（env、meta、db等）
   - 第三层：具体文件
3. **保持兼容性** - 通过符号链接确保项目的兼容性
4. **易于导航** - 明确的目录名称和层次结构使项目更易于导航 