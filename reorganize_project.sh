#!/bin/bash
echo "创建整理目录结构的脚本..."

# 创建主要目录结构
mkdir -p configs/env configs/vercel configs/types configs/ignore
mkdir -p assets/meta assets/docs
mkdir -p data/db data/tables data/contents data/storage

# 复制配置文件
cp .babelrc.js next.config.js postcss.config.js tailwind.config.js vitest.config.ts configs/

# 移动环境变量文件
cp .env* configs/env/ 2>/dev/null

# 移动Vercel配置
cp .vercel* vercel.json test-vercel-build.js configs/vercel/ 2>/dev/null

# 移动类型定义
cp next-env.d.ts next.fetch.ts configs/types/ 2>/dev/null

# 移动忽略文件
cp .gitignore .cursorignore configs/ignore/ 2>/dev/null

# 移动数据库文件
cp turso_schema_fixed.sql blog_dump.sql data/db/ 2>/dev/null

# 移动文档和元数据
cp README.md DOCUMENTATION.md LICENSE assets/meta/ 2>/dev/null
cp -r docs/* assets/docs/ 2>/dev/null

# 创建符号链接
ln -sf configs/tsconfig.json tsconfig.json
ln -sf assets/meta/README.md README.md
ln -sf assets/meta/DOCUMENTATION.md DOCUMENTATION.md
ln -sf configs/types/next-env.d.ts next-env.d.ts
ln -sf configs/types/next.fetch.ts next.fetch.ts
ln -sf configs/ignore/.gitignore .gitignore
ln -sf configs/ignore/.cursorignore .cursorignore

echo "目录结构整理完成！" 