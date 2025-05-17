#!/bin/bash

# src/lib 目录结构优化
echo "开始整理 src/lib 目录..."

# 创建更多细分目录
mkdir -p src/lib/db/utils
mkdir -p src/lib/api
mkdir -p src/lib/content
mkdir -p src/lib/cache
mkdir -p src/lib/sync
mkdir -p src/lib/github
mkdir -p src/lib/markdown
mkdir -p src/lib/utils

# 移动数据库相关文件
mv src/lib/db.ts src/lib/db/index.ts
mv src/lib/db-posts.ts src/lib/db/posts.ts
mv src/lib/db-posts.patch.ts src/lib/db/posts-patch.ts

# 移动API相关文件
mv src/lib/api-client.ts src/lib/api/client.ts
mv src/lib/api-cache-optimizer.ts src/lib/api/cache-optimizer.ts
mv src/lib/client-api.ts src/lib/api/client-api.ts
mv src/lib/deprecation-middleware.ts src/lib/api/deprecation-middleware.ts

# 移动内容相关文件
mv src/lib/content-manager.ts src/lib/content/manager.ts
mv src/lib/category-service.ts src/lib/content/category-service.ts
mv src/lib/slug-manager.ts src/lib/content/slug-manager.ts
mv src/lib/search-utils.ts src/lib/content/search-utils.ts

# 移动缓存相关文件
mv src/lib/cache.ts src/lib/cache/index.ts
mv src/lib/fs-cache.ts src/lib/cache/fs-cache.ts
mv src/lib/fs-cache-client.ts src/lib/cache/fs-cache-client.ts

# 移动同步相关文件
mv src/lib/sync-service.ts src/lib/sync/service.ts
mv src/lib/sync-service-client.ts src/lib/sync/service-client.ts
mv src/lib/sync-unified.ts src/lib/sync/unified.ts
mv src/lib/unified-sync-client.ts src/lib/sync/unified-client.ts
mv src/lib/sync-enhancer.ts src/lib/sync/enhancer.ts

# 移动GitHub相关文件
mv src/lib/github.ts src/lib/github/index.ts
mv src/lib/github-client.ts src/lib/github/client.ts
mv src/lib/git-service.ts src/lib/github/git-service.ts

# 移动Markdown相关文件
mv src/lib/markdown.ts src/lib/markdown/index.ts
mv src/lib/remark-admonitions.ts src/lib/markdown/remark-admonitions.ts

# 移动工具函数
mv src/lib/utils.ts src/lib/utils/index.ts
mv src/lib/logger.ts src/lib/utils/logger.ts
mv src/lib/env.ts src/lib/utils/env.ts
mv src/lib/platforms.ts src/lib/utils/platforms.ts
mv src/lib/performance-optimizer.ts src/lib/utils/performance-optimizer.ts
mv src/lib/static-generation.ts src/lib/utils/static-generation.ts
mv src/lib/metadata.ts src/lib/utils/metadata.ts
mv src/lib/image-loader.js src/lib/utils/image-loader.js

# 清理旧的备份文件
rm -f src/lib/api-client.ts.bak

echo "src/lib 目录结构优化完成!" 