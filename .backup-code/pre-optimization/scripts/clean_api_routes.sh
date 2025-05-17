#!/bin/bash

# API 路由整理脚本
echo "开始整理 API 路由..."

# 创建备份目录
mkdir -p .backup-code/api-routes

# 备份可能被删除的冗余路由
echo "备份冗余API路由..."

# 备份测试路由
cp -r src/app/api/test .backup-code/api-routes/
cp -r src/app/api/test-turso .backup-code/api-routes/
cp -r src/app/api/turso-test .backup-code/api-routes/
cp -r src/app/api/db-test .backup-code/api-routes/
cp -r src/app/api/env-test .backup-code/api-routes/
cp -r src/app/api/github-test .backup-code/api-routes/
cp -r src/app/api/performance .backup-code/api-routes/

# 备份重复路由
cp -r src/app/api/posts-new .backup-code/api-routes/
cp -r src/app/api/categories-new .backup-code/api-routes/
cp -r src/app/api/tags-new .backup-code/api-routes/
cp -r src/app/api/dashboard-new .backup-code/api-routes/

# 备份初始化路由
cp -r src/app/api/init .backup-code/api-routes/
cp -r src/app/api/init-db .backup-code/api-routes/
cp -r src/app/api/db-init .backup-code/api-routes/
cp -r src/app/api/db-reset .backup-code/api-routes/
cp -r src/app/api/db-cleanup .backup-code/api-routes/
cp -r src/app/api/db-schema .backup-code/api-routes/

# 备份同步相关路由
cp -r src/app/api/sync .backup-code/api-routes/
cp -r src/app/api/sync-single .backup-code/api-routes/
cp -r src/app/api/unified-sync .backup-code/api-routes/
cp -r src/app/api/scheduled-sync .backup-code/api-routes/

# 备份缓存相关路由
cp -r src/app/api/cache .backup-code/api-routes/
cp -r src/app/api/clear-all-caches .backup-code/api-routes/
cp -r src/app/api/revalidate .backup-code/api-routes/
cp -r src/app/api/refresh .backup-code/api-routes/
cp -r src/app/api/force-refresh .backup-code/api-routes/

# 移除冗余路由
echo "移除冗余API路由..."

# 删除测试路由
rm -rf src/app/api/test
rm -rf src/app/api/test-turso
rm -rf src/app/api/turso-test
rm -rf src/app/api/db-test
rm -rf src/app/api/env-test
rm -rf src/app/api/github-test
rm -rf src/app/api/performance
rm -rf src/app/test-turso

# 整合重复路由 (使用新版替换旧版)
rm -rf src/app/api/posts-new
rm -rf src/app/api/categories-new
rm -rf src/app/api/tags-new
rm -rf src/app/api/dashboard-new

# 整合初始化路由
mkdir -p src/app/api/system/init
cp -r src/app/api/init/* src/app/api/system/init/ 2>/dev/null
cp -r src/app/api/init-db/* src/app/api/system/init/ 2>/dev/null
cp -r src/app/api/db-init/* src/app/api/system/init/ 2>/dev/null
cp -r src/app/api/db-reset/* src/app/api/system/init/ 2>/dev/null
cp -r src/app/api/db-cleanup/* src/app/api/system/init/ 2>/dev/null
cp -r src/app/api/db-schema/* src/app/api/system/init/ 2>/dev/null

# 整合同步相关路由
mkdir -p src/app/api/system/sync
cp -r src/app/api/sync/* src/app/api/system/sync/ 2>/dev/null
cp -r src/app/api/sync-single/* src/app/api/system/sync/ 2>/dev/null
cp -r src/app/api/unified-sync/* src/app/api/system/sync/ 2>/dev/null
cp -r src/app/api/scheduled-sync/* src/app/api/system/sync/ 2>/dev/null

# 整合缓存相关路由
mkdir -p src/app/api/system/cache
cp -r src/app/api/cache/* src/app/api/system/cache/ 2>/dev/null
cp -r src/app/api/clear-all-caches/* src/app/api/system/cache/ 2>/dev/null
cp -r src/app/api/revalidate/* src/app/api/system/cache/ 2>/dev/null
cp -r src/app/api/refresh/* src/app/api/system/cache/ 2>/dev/null
cp -r src/app/api/force-refresh/* src/app/api/system/cache/ 2>/dev/null

# 删除已整合的路由
rm -rf src/app/api/init
rm -rf src/app/api/init-db
rm -rf src/app/api/db-init
rm -rf src/app/api/db-reset
rm -rf src/app/api/db-cleanup
rm -rf src/app/api/db-schema
rm -rf src/app/api/sync
rm -rf src/app/api/sync-single
rm -rf src/app/api/unified-sync
rm -rf src/app/api/scheduled-sync
rm -rf src/app/api/cache
rm -rf src/app/api/clear-all-caches
rm -rf src/app/api/revalidate
rm -rf src/app/api/refresh
rm -rf src/app/api/force-refresh

# 清理测试页面
rm -rf src/app/test-editor

echo "API 路由整理完成!" 