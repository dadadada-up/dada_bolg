#!/bin/bash

# 项目优化主脚本
echo "==============================================="
echo "开始全面优化项目结构..."
echo "==============================================="

# 1. 确保脚本有执行权限
chmod +x scripts/organize_project.sh
chmod +x scripts/organize_lib.sh
chmod +x scripts/clean_api_routes.sh
chmod +x scripts/update_imports.js

# 2. 创建全局备份
echo "创建项目备份..."
mkdir -p .backup-code/pre-optimization
cp -r src .backup-code/pre-optimization/
cp -r scripts .backup-code/pre-optimization/
cp package.json .backup-code/pre-optimization/

# 3. 运行各个优化脚本
echo "运行脚本目录优化..."
./scripts/organize_project.sh

echo "运行库目录优化..."
./scripts/organize_lib.sh

echo "运行API路由清理..."
./scripts/clean_api_routes.sh

echo "更新导入路径..."
node scripts/update_imports.js

# 4. 清理重复的配置文件
echo "清理重复的配置文件..."
if [ -f next.config.js ] && [ -f next.config.mjs ]; then
  if [ "$(stat -f%z next.config.js)" -ge "$(stat -f%z next.config.mjs)" ]; then
    mv next.config.mjs .backup-code/next.config.mjs.bak
    echo "已保留 next.config.js (更大的文件)"
  else
    mv next.config.js .backup-code/next.config.js.bak
    echo "已保留 next.config.mjs (更大的文件)"
  fi
fi

# 5. 整理文档文件
echo "整理文档文件..."
if [ -f PROJECT_STRUCTURE.md ] && [ -f project_structure_guide.md ]; then
  mv PROJECT_STRUCTURE.md docs/architecture/
  mv project_structure_guide.md docs/architecture/
fi

if [ -f DOCUMENTATION.md ]; then
  mv DOCUMENTATION.md docs/
fi

if [ -f README-turso.md ]; then
  mv README-turso.md docs/setup/turso-setup.md
fi

# 6. 创建一个统一入口点索引文件
echo "创建统一的入口点索引文件..."
cat > src/lib/index.ts << EOL
/**
 * 统一导出所有lib模块
 * 这个文件作为lib的入口点，提供一个统一的导入位置
 */

// 数据库
export * from './db';
export * from './db/posts';

// API
export * from './api/client';
export * from './api/client-api';

// 内容
export * from './content/manager';
export * from './content/category-service';
export * from './content/slug-manager';
export * from './content/search-utils';

// 缓存
export * from './cache';
export * from './cache/fs-cache';

// 同步
export * from './sync/service';
export * from './sync/unified';

// GitHub
export * from './github';

// Markdown
export * from './markdown';

// 工具
export * from './utils';
export * from './utils/logger';
export * from './utils/env';
EOL

# 7. 更新主README
echo "更新项目README..."
cat > README.md << EOL
# DADA 博客

这是一个基于Next.js构建的博客系统，使用SQLite本地开发和Turso云数据库部署到Vercel。

## 项目结构

- \`src/\`: 源代码目录
  - \`app/\`: Next.js应用页面和API路由
  - \`components/\`: React组件
  - \`lib/\`: 通用库和工具函数
  - \`styles/\`: 样式文件
  - \`types/\`: TypeScript类型定义
- \`config/\`: 配置文件
  - \`db/\`: 数据库配置
  - \`env/\`: 环境变量配置
  - \`site/\`: 站点配置
- \`scripts/\`: 辅助脚本
  - \`db/\`: 数据库相关脚本
  - \`deploy/\`: 部署相关脚本
  - \`utils/\`: 工具脚本
- \`docs/\`: 项目文档
  - \`development/\`: 开发相关文档
  - \`architecture/\`: 架构设计文档
  - \`setup/\`: 安装和配置指南
  - \`api/\`: API文档

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
   \`\`\`bash
   npm install
   \`\`\`

2. 启动开发服务器:
   \`\`\`bash
   npm run dev
   \`\`\`

3. 访问 [http://localhost:3000](http://localhost:3000)

## 数据库迁移

从本地SQLite迁移到Turso:

\`\`\`bash
npm run migrate-to-turso
\`\`\`

## 部署到Vercel

项目配置了自动部署到Vercel，包括Turso数据库连接的设置。详情请参考 \`docs/setup/\` 目录中的文档。

## 文档

详细文档请参考 \`docs/\` 目录下的文件。

## 许可证

本项目仅供学习参考，未经许可不得用于商业用途。
EOL

echo "==============================================="
echo "项目优化完成!"
echo "==============================================="
echo "备份文件位于: .backup-code/"
echo "如需还原，请从备份中复制文件。"
echo "===============================================" 