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

echo -e "${GREEN}开始修复图片引用路径中的转义字符...${NC}"

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
  
  # 确保图片目录存在
  if [ ! -d "$IMAGE_DIR/$category/$post_dir_name" ]; then
    mkdir -p "$IMAGE_DIR/$category/$post_dir_name"
    cp "$BASE_DIR/content/placeholder.png" "$IMAGE_DIR/$category/$post_dir_name/"
    echo -e "${GREEN}创建目录及占位图: $IMAGE_DIR/$category/$post_dir_name${NC}"
  fi
  
  # 创建临时文件
  temp_file=$(mktemp)
  
  # 读取原文件并修复图片引用
  while IFS= read -r line; do
    # 检查图片引用格式
    if [[ $line =~ \!\[.*\]\(.*\) ]]; then
      ((total_count++))
      
      # 移除转义斜杠
      if [[ $line =~ \\\/ ]]; then
        fixed_line="${line//\\\//\/}"
        echo "$fixed_line" >> "$temp_file"
        ((fixed_count++))
        echo -e "${YELLOW}修复文件 $md_file 中的转义字符${NC}"
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

echo -e "${GREEN}修复完成！共修复了 $fixed_count 个转义字符问题（总共检查了 $total_count 个引用）${NC}"
echo -e "${GREEN}请运行 ./check_image_references.sh 检查修复结果${NC}" 