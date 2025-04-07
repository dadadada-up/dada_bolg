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

echo -e "${GREEN}开始最终修复图片引用...${NC}"

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
  need_fix=0
  while IFS= read -r line; do
    # 检查是否为图片引用
    if [[ $line =~ \!\[.*\]\(.*\) ]]; then
      ((total_count++))
      
      # 提取图片路径
      image_path=$(echo "$line" | sed -E 's/.*\]\(([^)]*)\).*/\1/')
      
      # 检查图片路径中是否包含 /content/assets/images/posts/
      if [[ $image_path =~ /content/assets/images/posts/ ]]; then
        # 替换为占位图
        new_line=$(echo "$line" | sed -E "s|\\!\\[.*\\]\\([^)]*\\)|![占位图](/content/assets/images/posts/$category/$post_dir_name/placeholder.png)|")
        echo "$new_line" >> "$temp_file"
        ((fixed_count++))
        need_fix=1
        echo -e "${YELLOW}修复文件 $md_file 中的图片引用: $image_path -> /content/assets/images/posts/$category/$post_dir_name/placeholder.png${NC}"
      else
        # 其他引用格式检查
        if [[ $image_path == http* || $image_path == //alidocs* || ! $image_path =~ ^/content/assets/images/ ]]; then
          # 外部链接或不符合规范的路径，替换为占位图
          new_line=$(echo "$line" | sed -E "s|\\!\\[.*\\]\\([^)]*\\)|![占位图](/content/assets/images/posts/$category/$post_dir_name/placeholder.png)|")
          echo "$new_line" >> "$temp_file"
          ((fixed_count++))
          need_fix=1
          echo -e "${YELLOW}修复文件 $md_file 中的外部图片引用: $image_path -> /content/assets/images/posts/$category/$post_dir_name/placeholder.png${NC}"
        else
          # 其他格式保持不变
          echo "$line" >> "$temp_file"
        fi
      fi
    else
      echo "$line" >> "$temp_file"
    fi
  done < "$md_file"
  
  # 替换原文件
  if [ $need_fix -eq 1 ]; then
    mv "$temp_file" "$md_file"
  else
    rm "$temp_file"
  fi
done

echo -e "${GREEN}最终修复完成！共修复了 $fixed_count 个图片引用（总共检查了 $total_count 个引用）${NC}"
echo -e "${GREEN}请运行 ./check_image_references.sh 检查修复结果${NC}" 