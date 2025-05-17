# 项目清理分析报告

*生成时间: 2025-05-17T15:34:10.870Z*

## 摘要

- **未使用的文件**: 175 个
- **重复的API路由**: 8 对
- **重复的配置文件**: 8 种
- **可整理的根目录文件**: 15 个
- **临时文件**: 0 个

## 清理建议

### 高优先级任务

#### 合并重复的配置文件

项目中存在多个同类型的配置文件，应该合并或选择一个保留。

- **保留 .env.development，删除 .env.example, .env.example.local, .env.local, .env.production, config/env/.env.example, configs/env/.env.development, configs/env/.env.example, configs/env/.env.local, configs/env/.env.production**
  - 保留: .env.development
  - 删除: .env.example, .env.example.local, .env.local, .env.production, config/env/.env.example, configs/env/.env.development, configs/env/.env.example, configs/env/.env.local, configs/env/.env.production

- **保留 README.md，删除 assets/meta/README.md, config/README.md, data/storage/temp-backup-test/README.md, public/README.md, scripts/README.md, scripts/cleanup/README.md, src/tests/README.md**
  - 保留: README.md
  - 删除: assets/meta/README.md, config/README.md, data/storage/temp-backup-test/README.md, public/README.md, scripts/README.md, scripts/cleanup/README.md, src/tests/README.md

- **保留 next.config.mjs，删除 configs/next.config.js**
  - 保留: next.config.mjs
  - 删除: configs/next.config.js

- **保留 postcss.config.js，合并 configs/postcss.config.js**
  - 保留: postcss.config.js
  - 合并: configs/postcss.config.js

- **保留 tailwind.config.js，合并 configs/tailwind.config.js**
  - 保留: tailwind.config.js
  - 合并: configs/tailwind.config.js

- **保留 tsconfig.json，合并 configs/tsconfig.json**
  - 保留: tsconfig.json
  - 合并: configs/tsconfig.json

- **保留 vercel.json，删除 configs/vercel/vercel.json**
  - 保留: vercel.json
  - 删除: configs/vercel/vercel.json

- **保留 src/lib/db/adapters/turso-adapter.ts，合并 src/lib/db/turso-adapter.ts，删除 scripts/db/migrate-to-turso.ts, scripts/db/validate-turso-migration.ts, scripts/deploy/vercel/vercel-turso-setup.js, scripts/deploy/vercel/verify-vercel-turso.js, src/lib/db/clients/turso-client.ts, src/lib/db/turso-client-new.ts, src/lib/db/turso-client.js, src/lib/db/turso-client.ts**
  - 保留: src/lib/db/adapters/turso-adapter.ts
  - 合并: src/lib/db/turso-adapter.ts
  - 删除: scripts/db/migrate-to-turso.ts, scripts/db/validate-turso-migration.ts, scripts/deploy/vercel/vercel-turso-setup.js, scripts/deploy/vercel/verify-vercel-turso.js, src/lib/db/clients/turso-client.ts, src/lib/db/turso-client-new.ts, src/lib/db/turso-client.js, src/lib/db/turso-client.ts

#### 合并重复的API路由

项目中存在功能相似的API路由，应该合并为标准化的路由。

- **将 admin/db-status, admin/db-status-new, categories/update-counts, categories/update-schema, slugs, system/cache/clear, system/sync/reset, system/cache/status, system/init, system/status 合并到 tags**
  - 标准路由: tags
  - 合并路由: admin/db-status, admin/db-status-new, categories/update-counts, categories/update-schema, slugs, system/cache/clear, system/sync/reset, system/cache/status, system/init, system/status

- **将 categories/translate, categories/translate-batch, categories/update-schema 合并到 categories**
  - 标准路由: categories
  - 合并路由: categories/translate, categories/translate-batch, categories/update-schema

### 中优先级任务

#### 移除未使用的代码文件

项目中存在 175 个可能未使用的文件，可以考虑移除。

- **备份并移除 86 个.tsx文件**
  - 86 个 .tsx 文件
  - 前10个文件: src/app/about/page.tsx, src/app/archives/page.tsx, src/app/categories/[slug]/page.tsx, src/app/categories/page.tsx, src/app/loading.tsx, src/app/login/page.tsx, src/app/not-found.tsx, src/app/posts/[slug]/loading.tsx, src/app/posts/[slug]/page.tsx, src/app/posts/loading.tsx...

- **备份并移除 79 个.ts文件**
  - 79 个 .ts 文件
  - 前10个文件: src/app/feed.xml/route.ts, src/app/robots.txt/route.ts, src/app/sitemap.xml/route.ts, src/components/bytemd/custom-plugins.ts, src/components/bytemd/image-upload-plugin.ts, src/components/json-ld-server.ts, src/hooks/use-debounce.ts, src/lib/api/cache-optimizer.ts, src/lib/api/client-api.ts, src/lib/api/client.ts...

- **备份并移除 4 个.css文件**
  - 4 个 .css 文件
  - 文件列表: src/app/globals.css, src/components/bytemd/styles.css, src/components/bytemd/viewer-styles.css, src/styles/admin.css

- **备份并移除 6 个.js文件**
  - 6 个 .js 文件
  - 文件列表: src/lib/db/database-config.js, src/lib/db/db-adapter.js, src/lib/db/turso-client.js, src/lib/utils/image-loader.js, src/scripts/fix-post-update.js, src/scripts/test-db.js

#### 整理项目根目录文件

项目根目录有 15 个文件可以移动到更合适的目录。

- **将 5 个文件移动到 config/env 目录**
  - 目标目录: config/env
  - 文件数量: 5
  - 文件列表: .env.development, .env.example, .env.example.local, .env.local, .env.production

- **将 2 个文件移动到 .github 目录**
  - 目标目录: .github
  - 文件数量: 2
  - 文件列表: .github, .gitignore

- **将 3 个文件移动到 scripts 目录**
  - 目标目录: scripts
  - 文件数量: 3
  - 文件列表: next-env.d.ts, reorganize_project.sh, test.js

- **将 5 个文件移动到 config 目录**
  - 目标目录: config
  - 文件数量: 5
  - 文件列表: next.config.mjs, postcss.config.js, tailwind.config.js, tsconfig.json, vercel.json

## 执行清理

已自动生成清理脚本，可按以下步骤执行：

1. 检查 `scripts/cleanup/execute-cleanup.sh` 脚本内容，确保操作安全
2. 执行脚本 `bash scripts/cleanup/execute-cleanup.sh`

**注意：** 脚本会自动备份所有修改的文件到 `.backup-code` 目录。部分高风险操作（如删除未使用文件）默认被注释，需要手动确认安全后取消注释再执行。

