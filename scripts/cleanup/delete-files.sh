#!/bin/bash

# 此脚本根据 delete-list.txt 中列出的文件执行删除操作
# 在删除之前会创建一个备份

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 删除列表文件
DELETE_LIST="scripts/cleanup/delete-list.txt"

# 检查删除列表是否存在
if [ ! -f "$DELETE_LIST" ]; then
  echo -e "${RED}错误: 删除列表文件 $DELETE_LIST 不存在${NC}"
  exit 1
fi

# 创建备份目录
BACKUP_DIR=".backup-code/deleted-files-$(date +%Y%m%d-%H%M%S)"
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}开始执行文件删除${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "\n${YELLOW}创建备份目录: ${BACKUP_DIR}${NC}"
mkdir -p "$BACKUP_DIR"

# 统计
TOTAL_FILES=0
DELETED_FILES=0
SKIPPED_FILES=0

# 读取删除列表并执行删除
while IFS= read -r file || [ -n "$file" ]; do
  # 跳过注释和空行
  if [[ "$file" =~ ^#.*$ || -z "${file// }" ]]; then
    continue
  fi
  
  ((TOTAL_FILES++))
  
  if [ -e "$file" ]; then
    echo -e "处理: ${YELLOW}$file${NC}"
    
    # 创建备份目录结构
    backup_path="$BACKUP_DIR/$file"
    backup_dir=$(dirname "$backup_path")
    mkdir -p "$backup_dir"
    
    # 备份文件或目录
    if [ -d "$file" ]; then
      cp -r "$file" "$backup_dir/"
      echo "  备份目录到: $backup_path"
    else
      cp "$file" "$backup_path"
      echo "  备份文件到: $backup_path"
    fi
    
    # 删除文件或目录
    if [ -d "$file" ]; then
      rm -rf "$file"
    else
      rm -f "$file"
    fi
    
    echo -e "  ${GREEN}已删除${NC}"
    ((DELETED_FILES++))
  else
    echo -e "跳过: ${YELLOW}$file${NC} (不存在)"
    ((SKIPPED_FILES++))
  fi
done < "$DELETE_LIST"

# 输出统计信息
echo -e "\n${BLUE}=============================================${NC}"
echo -e "${GREEN}删除操作完成!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "总文件数: ${YELLOW}$TOTAL_FILES${NC}"
echo -e "已删除: ${GREEN}$DELETED_FILES${NC}"
echo -e "已跳过: ${YELLOW}$SKIPPED_FILES${NC}"
echo -e "备份目录: ${YELLOW}$BACKUP_DIR${NC}"
echo -e "\n${YELLOW}注意:${NC} 所有删除的文件都已备份到上述目录。"
echo -e "如需恢复，可以从备份目录中复制回原位置。" 