#!/bin/bash

# 此脚本将可能未使用的文件移动到备份目录而不是直接删除
# 这样可以安全地清理代码，同时保留所有原始文件

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 创建未使用文件的备份目录
BACKUP_DIR=".backup-code/possibly-unused-$(date +%Y%m%d-%H%M%S)"
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}开始将可能未使用的文件移动到备份目录${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "\n${YELLOW}创建备份目录: ${BACKUP_DIR}${NC}"
mkdir -p "$BACKUP_DIR"

# 列出要备份和移动的文件
# 注意：这里列出的是根据静态分析确定的可能未使用的文件
# 一定要仔细检查每个文件是否真的可以安全移除
files_to_backup=(
  # Next.js特殊路由 (这些实际上是被Next.js直接使用的，不应该删除)
  # "src/app/feed.xml/route.ts"
  # "src/app/robots.txt/route.ts"
  # "src/app/sitemap.xml/route.ts"
  
  # 可能未使用但是是工具脚本
  "scripts/cleanup/detect-duplicate-routes.js"
  "scripts/cleanup/find-unused-files.js"
  "scripts/cleanup/organize-root-dir.js"
  
  # 临时/测试文件
  "src/app/admin/categories/fix.js"
  "src/app/admin/categories/fix_categories.js"
  "src/app/admin/categories/fix_page.js"
  "scripts/test.js"
  "scripts/next-env.d.ts"
  
  # 可能重复的备份脚本
  "scripts/backup/backup-to-github.ts"
  "scripts/backup/reset-github-repo.ts"
  "scripts/utils/backup/manual-backup.js"
  "scripts/utils/backup/reset-and-backup.js"
  "scripts/utils/backup/run-backup.js"
  "scripts/utils/backup/scheduled-backup.js"
  "scripts/utils/backup/test-backup.ts"
  "scripts/utils/github/backup-to-github.ts"
  "scripts/utils/github/reset-github-repo.ts"
  "scripts/utils/github/test-repo-backup.ts"
  
  # 导入脚本（可能只在初始设置时使用）
  "scripts/db/import/debug-import.ts"
  "scripts/db/import/import-posts.js"
  "scripts/db/import/import-posts.ts"
  "scripts/db/import/insert-test-article.cjs"
  "scripts/db/import/insert-test-article.js"
  "scripts/db/import/test-db-import.js"
  
  # 静态部署脚本（如果不再使用静态导出功能）
  "scripts/deploy/static/generate-static-pages.js"
  "scripts/deploy/static/prepare-static-files.js"
  "scripts/deploy/static/static-build.js"
  "scripts/deploy/static/static-server.js"
  
  # 重复的Vercel部署脚本
  "scripts/deploy/vercel/next-adapter.cjs"
  "scripts/deploy/vercel/next-adapter.mjs"
  "scripts/deploy/vercel/vercel-prebuild.cjs"
  "scripts/deploy/vercel/vercel-prebuild.mjs"
  "scripts/deploy/vercel-setup.js"
  "scripts/deploy/verify-vercel-build.js"
)

# 统计
TOTAL_FILES=0
MOVED_FILES=0
SKIPPED_FILES=0

# 移动文件到备份目录
for file in "${files_to_backup[@]}"; do
  ((TOTAL_FILES++))
  
  if [ -e "$file" ]; then
    echo -e "处理: ${YELLOW}$file${NC}"
    
    # 创建备份目录结构
    backup_path="$BACKUP_DIR/$file"
    backup_dir=$(dirname "$backup_path")
    mkdir -p "$backup_dir"
    
    # 移动文件或目录
    if [ -d "$file" ]; then
      mv "$file" "$backup_dir/"
      echo "  移动目录到: $backup_path"
    else
      mv "$file" "$backup_path"
      echo "  移动文件到: $backup_path"
    fi
    
    echo -e "  ${GREEN}已移动${NC}"
    ((MOVED_FILES++))
  else
    echo -e "跳过: ${YELLOW}$file${NC} (不存在)"
    ((SKIPPED_FILES++))
  fi
done

# 创建占位符文件
mkdir -p "$BACKUP_DIR/placeholder"
cat > "$BACKUP_DIR/placeholder/README.md" << EOF
# 可能未使用的文件

此目录包含项目中可能未使用的文件，这些文件已从源代码中移除并备份到此处。

如果发现项目缺少某些功能，这些文件可以作为参考或恢复回原位置。

备份日期: $(date +%Y-%m-%d)
EOF

# 输出统计信息
echo -e "\n${BLUE}=============================================${NC}"
echo -e "${GREEN}文件移动完成!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "总文件数: ${YELLOW}$TOTAL_FILES${NC}"
echo -e "已移动: ${GREEN}$MOVED_FILES${NC}"
echo -e "已跳过: ${YELLOW}$SKIPPED_FILES${NC}"
echo -e "备份目录: ${YELLOW}$BACKUP_DIR${NC}"
echo -e "\n${YELLOW}注意:${NC} 所有移动的文件都已放置在上述备份目录中。"
echo -e "如需恢复，可以从备份目录中复制回原位置。" 