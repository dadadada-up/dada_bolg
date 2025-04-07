#!/bin/bash

echo "开始创建缺失的posts子目录..."

# 主目录
posts_dir="/Users/dada/Documents/dada_blog/content/assets/images/posts"

# 确保主目录存在
mkdir -p "$posts_dir"

# 查找所有markdown文件中的图片引用
image_refs=$(grep -o "!\[.*\](/content/assets/images/posts/posts/[^)]*" $(find content/posts -name "*.md") | sed 's/!\[.*\](\/content\/assets\/images\/posts\/posts\/\([^)]*\)/\1/g')

# 创建目录和占位图文件
for ref in $image_refs; do
  # 获取目录部分
  dir_part=$(dirname "$ref")
  
  # 创建目录
  if [ ! -d "$posts_dir/posts/$dir_part" ]; then
    mkdir -p "$posts_dir/posts/$dir_part"
    echo "创建目录: $posts_dir/posts/$dir_part"
  fi
  
  # 创建占位图文件
  if [[ "$ref" == *".png" || "$ref" == *"placeholder.png" ]]; then
    if [ ! -f "$posts_dir/posts/$ref" ]; then
      touch "$posts_dir/posts/$ref"
      echo "创建文件: $posts_dir/posts/$ref"
    fi
  elif [[ "$ref" == *".svg" ]]; then
    if [ ! -f "$posts_dir/posts/$ref" ]; then
      touch "$posts_dir/posts/$ref"
      echo "创建文件: $posts_dir/posts/$ref"
    fi
  elif [[ "$ref" == *"placeholder"* ]]; then
    if [ ! -f "$posts_dir/posts/$dir_part/placeholder.png" ]; then
      touch "$posts_dir/posts/$dir_part/placeholder.png"
      echo "创建文件: $posts_dir/posts/$dir_part/placeholder.png"
    fi
  else
    if [ ! -f "$posts_dir/posts/$ref" ]; then
      touch "$posts_dir/posts/$ref"
      echo "创建文件: $posts_dir/posts/$ref"
    fi
  fi
done

echo "所有缺失的目录和文件已创建完成！" 