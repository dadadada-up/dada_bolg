#!/bin/bash

# 设置基础路径
BASE_DIR="/Users/dada/Documents/dada_blog"
POST_DIR="$BASE_DIR/content/posts"
IMAGE_DIR="$BASE_DIR/content/assets/images/posts"

# 使用彩色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}开始修复图片引用路径...${NC}"

# 创建主要类别目录（如果不存在）
CATEGORIES=("finance" "insurance" "product-management" "reading" "tech-tools" "open-source" "family-life")

for CATEGORY in "${CATEGORIES[@]}"; do
  if [ ! -d "$IMAGE_DIR/$CATEGORY" ]; then
    mkdir -p "$IMAGE_DIR/$CATEGORY"
    echo -e "${GREEN}创建目录: $IMAGE_DIR/$CATEGORY${NC}"
  fi
done

# 计数器
fixed_count=0
total_count=0

# 遍历所有 Markdown 文件
find "$POST_DIR" -type f -name "*.md" | while read -r md_file; do
  # 获取类别
  relative_path=${md_file#"$POST_DIR/"}
  category=$(echo "$relative_path" | cut -d '/' -f1)
  
  # 获取文件名（不带.md后缀）
  filename=$(basename "$md_file" .md)
  post_dir_name=$(basename "$filename")
  
  # 确保文章对应的图片目录存在
  if [ ! -d "$IMAGE_DIR/$category/$post_dir_name" ]; then
    mkdir -p "$IMAGE_DIR/$category/$post_dir_name"
    cp "$BASE_DIR/content/placeholder.png" "$IMAGE_DIR/$category/$post_dir_name/"
    echo -e "${GREEN}创建目录及占位图: $IMAGE_DIR/$category/$post_dir_name${NC}"
  fi
  
  # 创建临时文件
  temp_file=$(mktemp)
  
  # 读取原文件并修复图片引用
  while IFS= read -r line; do
    # 计数图片引用
    if [[ $line =~ \!\[.*\]\(.*\) ]]; then
      ((total_count++))
      
      # 修复路径中多余的 "posts" 层级
      if [[ $line =~ /content/assets/images/posts/posts/ ]]; then
        fixed_line="${line//\/content\/assets\/images\/posts\/posts\//\/content\/assets\/images\/posts\/}"
        echo "$fixed_line" >> "$temp_file"
        ((fixed_count++))
        echo -e "${YELLOW}修复文件 $md_file 中的图片引用${NC}"
      else
        echo "$line" >> "$temp_file"
      fi
    else
      echo "$line" >> "$temp_file"
    fi
  done < "$md_file"
  
  # 替换原文件
  mv "$temp_file" "$md_file"
done

echo -e "${GREEN}修复完成！共修复了 $fixed_count 个图片引用路径（总共检查了 $total_count 个引用）${NC}"

# 创建占位图（如果不存在）
if [ ! -f "$BASE_DIR/content/placeholder.png" ]; then
  # 使用base64编码的简单占位图
  echo "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAABFUlEQVR4nO3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBPAABPO1TCQAAAABJRU5ErkJggg==" | base64 -d > "$BASE_DIR/content/placeholder.png"
  echo -e "${GREEN}创建了占位图: $BASE_DIR/content/placeholder.png${NC}"
fi

echo -e "${GREEN}请运行 ./check_image_references.sh 检查修复结果${NC}" 