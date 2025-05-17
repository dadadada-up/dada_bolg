#!/bin/bash

# 脚本目录结构优化
echo "开始整理脚本目录..."

# 创建更多细分目录
mkdir -p scripts/db/migrations
mkdir -p scripts/db/backup
mkdir -p scripts/db/import
mkdir -p scripts/deploy/vercel
mkdir -p scripts/deploy/static
mkdir -p scripts/utils/backup
mkdir -p scripts/utils/github
mkdir -p scripts/utils/test

# 移动数据库相关脚本
mv scripts/migrate-to-turso.ts scripts/db/
mv scripts/validate-turso-migration.ts scripts/db/
mv scripts/fix_categories.sql scripts/db/migrations/
mv scripts/init-db.ts scripts/db/
mv scripts/init-cache-db.ts scripts/db/
mv scripts/backup-turso.sh scripts/db/backup/
mv scripts/restore-turso.sh scripts/db/backup/
mv scripts/import-posts.js scripts/db/import/
mv scripts/import-posts.ts scripts/db/import/
mv scripts/import_posts.py scripts/db/import/
mv scripts/insert-test-article.js scripts/db/import/
mv scripts/insert-test-article.cjs scripts/db/import/
mv scripts/test-db-import.js scripts/db/import/
mv scripts/debug-import.ts scripts/db/import/

# 移动部署相关脚本
mv scripts/vercel-prebuild.mjs scripts/deploy/vercel/
mv scripts/vercel-prebuild.cjs scripts/deploy/vercel/
mv scripts/next-adapter.mjs scripts/deploy/vercel/
mv scripts/next-adapter.cjs scripts/deploy/vercel/
mv scripts/vercel-turso-setup.js scripts/deploy/vercel/
mv scripts/verify-vercel-build.js scripts/deploy/vercel/
mv scripts/verify-vercel-turso.js scripts/deploy/vercel/
mv scripts/vercel-setup.js scripts/deploy/vercel/
mv scripts/static-build.js scripts/deploy/static/
mv scripts/static-server.js scripts/deploy/static/
mv scripts/prepare-static-files.js scripts/deploy/static/
mv scripts/generate-static-pages.js scripts/deploy/static/

# 移动备份和工具脚本
mv scripts/backup-to-github.ts scripts/utils/github/
mv scripts/test-repo-backup.ts scripts/utils/github/
mv scripts/reset-github-repo.ts scripts/utils/github/
mv scripts/run-backup.js scripts/utils/backup/
mv scripts/scheduled-backup.js scripts/utils/backup/
mv scripts/manual-backup.js scripts/utils/backup/
mv scripts/reset-and-backup.js scripts/utils/backup/
mv scripts/restore-posts.sh scripts/utils/backup/
mv scripts/test-backup.ts scripts/utils/backup/
mv scripts/check-ports.sh scripts/utils/
mv scripts/create-env-local.sh scripts/utils/
mv scripts/create-default-images.js scripts/utils/
mv scripts/update-api-routes.js scripts/utils/
mv scripts/sync-posts.ts scripts/utils/

# 更新package.json中的脚本路径
echo "更新package.json中的脚本路径..."
sed -i '' 's|scripts/vercel-prebuild.mjs|scripts/deploy/vercel/vercel-prebuild.mjs|g' package.json
sed -i '' 's|scripts/next-adapter.mjs|scripts/deploy/vercel/next-adapter.mjs|g' package.json
sed -i '' 's|scripts/migrate-to-turso.ts|scripts/db/migrate-to-turso.ts|g' package.json

echo "脚本目录结构优化完成!" 