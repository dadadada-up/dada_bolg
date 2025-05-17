#!/bin/bash

# 项目清理主脚本
# 用于执行所有清理任务

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}开始执行项目清理和优化${NC}"
echo -e "${BLUE}=============================================${NC}"

# 确保脚本有执行权限
chmod +x scripts/cleanup/*.js scripts/cleanup/*.sh

# 1. 创建备份目录
BACKUP_DIR=".backup-code/pre-cleanup-$(date +%Y%m%d-%H%M%S)"
echo -e "\n${YELLOW}1. 创建备份目录: ${BACKUP_DIR}${NC}"
mkdir -p "$BACKUP_DIR"

# 备份主要文件
echo "备份关键文件..."
cp -r src "$BACKUP_DIR/"
cp -r scripts "$BACKUP_DIR/"
cp package.json next.config.mjs tsconfig.json "$BACKUP_DIR/"
[ -f next.config.js ] && cp next.config.js "$BACKUP_DIR/"
[ -f postcss.config.js ] && cp postcss.config.js "$BACKUP_DIR/"
[ -f tailwind.config.js ] && cp tailwind.config.js "$BACKUP_DIR/"
[ -f vercel.json ] && cp vercel.json "$BACKUP_DIR/"

# 2. 运行API路由检测脚本
echo -e "\n${YELLOW}2. 检测重复的API路由${NC}"
node scripts/cleanup/detect-duplicate-routes.js | tee "$BACKUP_DIR/duplicate-routes.log"

# 3. 删除已知的无用文件
echo -e "\n${YELLOW}3. 删除已知的无用文件${NC}"

# 列出要删除的测试和临时API路由
test_routes=(
  "src/app/api/test"
  "src/app/api/test-turso"
  "src/app/api/turso-test"
  "src/app/api/db-test"
  "src/app/api/env-test"
  "src/app/api/github-test"
  "src/app/api/performance"
)

# 列出要删除的重复或过时的API路由
duplicate_routes=(
  "src/app/api/posts-new"
  "src/app/api/categories-new"
  "src/app/api/tags-new"
  "src/app/api/dashboard-new"
  "src/app/api/init"
  "src/app/api/init-db"
  "src/app/api/db-init"
)

# 列出要删除的临时文件
temp_files=(
  "src/scripts/test-db.js"
  "src/tests"
  "temp.js"
  "temp.ts"
  "temp.json"
  "tmp.js"
  "tmp.ts"
  "tmp.json"
  "demo.js"
  "demo.ts"
  "example.js"
  "example.ts"
  "debug.log"
  "TODO.md"
  "NOTES.md"
  "CHANGELOG.md"
  "test.js"
)

# 列出要删除的重复配置文件（注意：先确保已有新版本）
dup_config_files=(
  # 如有重复配置文件，添加在这里
)

# 删除测试API路由
for route in "${test_routes[@]}"; do
  if [ -d "$route" ]; then
    echo "删除测试API路由: $route"
    # 先备份
    cp -r "$route" "$BACKUP_DIR/"
    # 然后删除
    rm -rf "$route"
  fi
done

# 删除重复API路由
for route in "${duplicate_routes[@]}"; do
  if [ -d "$route" ]; then
    echo "删除重复API路由: $route"
    # 先备份
    cp -r "$route" "$BACKUP_DIR/"
    # 然后删除
    rm -rf "$route"
  fi
done

# 删除临时文件
for file in "${temp_files[@]}"; do
  if [ -e "$file" ]; then
    echo "删除临时文件: $file"
    # 先备份（如果是文件）
    if [ -f "$file" ]; then
      cp "$file" "$BACKUP_DIR/"
    else
      # 如果是目录
      cp -r "$file" "$BACKUP_DIR/"
    fi
    # 然后删除
    rm -rf "$file"
  fi
done

# 删除重复配置文件
for file in "${dup_config_files[@]}"; do
  if [ -e "$file" ]; then
    echo "删除重复配置文件: $file"
    # 先备份
    cp "$file" "$BACKUP_DIR/"
    # 然后删除
    rm -f "$file"
  fi
done

# 4. 检测未使用的文件
echo -e "\n${YELLOW}4. 检测未使用的文件${NC}"
node scripts/cleanup/find-unused-files.js | tee "$BACKUP_DIR/unused-files.log"

# 5. 整理根目录
echo -e "\n${YELLOW}5. 整理项目根目录${NC}"
node scripts/cleanup/organize-root-dir.js | tee "$BACKUP_DIR/organize-root-dir.log"

# 6. 更新 .gitignore 文件
echo -e "\n${YELLOW}6. 更新 .gitignore 文件${NC}"
if [ -f ".gitignore" ]; then
  # 备份原文件
  cp .gitignore "$BACKUP_DIR/"
  
  # 添加清理相关的忽略项
  echo "" >> .gitignore
  echo "# 清理脚本创建的备份目录" >> .gitignore
  echo ".backup-code/" >> .gitignore
  echo "*.log" >> .gitignore
  echo "tmp/" >> .gitignore
  echo "temp/" >> .gitignore
  
  echo "已更新 .gitignore 文件"
else
  echo "警告: 未找到 .gitignore 文件"
fi

# 7. 输出结果摘要
echo -e "\n${BLUE}=============================================${NC}"
echo -e "${GREEN}项目清理完成!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "备份目录: ${YELLOW}$BACKUP_DIR${NC}"
echo -e "- 重复API路由检测报告: ${YELLOW}$BACKUP_DIR/duplicate-routes.log${NC}"
echo -e "- 未使用文件检测报告: ${YELLOW}$BACKUP_DIR/unused-files.log${NC}"
echo -e "- 根目录整理报告: ${YELLOW}$BACKUP_DIR/organize-root-dir.log${NC}"
echo -e "\n${YELLOW}注意:${NC} 清理过程中所有原始文件都已备份到上述目录。"
echo -e "如需恢复，可以从备份目录中复制回原位置。" 