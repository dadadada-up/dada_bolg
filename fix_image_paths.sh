#!/bin/bash

# 脚本用于将非规范的图片路径调整为符合规范的路径
# 规范路径格式: /assets/images/posts/分类/YYYY-MM-DD-标题/图片名.jpg

# 确保目录存在
mkdir -p assets/images/posts/tech-tools assets/images/posts/finance assets/images/posts/insurance assets/images/posts/product-management assets/images/posts/family-life assets/images/posts/open-source assets/images/posts/personal-blog

# 获取所有markdown文件
files=$(find docs/posts -type f -name "*.md")

# 处理每个文件
for file in $files; do
  echo "处理文件: $file"
  
  # 获取文件名和目录信息
  filename=$(basename "$file")
  dirname=$(dirname "$file")
  category=$(echo "$dirname" | cut -d'/' -f3)
  
  # 创建图片目标目录
  target_dir="assets/images/posts/$category/$filename"
  target_dir="${target_dir%.md}"
  mkdir -p "$target_dir"
  
  # 从文件中提取图片路径
  image_paths=$(grep -o '!\[.*\](.*\.png\|.*\.jpg\|.*\.jpeg\|.*\.gif\|.*\.webp\|.*\.svg)' "$file" | sed 's/!\[.*\](\(.*\))/\1/')
  
  # 处理每个图片路径
  for img_path in $image_paths; do
    # 排除已经符合规范的路径
    if [[ ! "$img_path" =~ ^/assets/images/posts/ ]]; then
      # 提取图片文件名
      img_filename=$(basename "$img_path")
      
      # 构建新路径
      new_path="/assets/images/posts/$category/${filename%.md}/$img_filename"
      
      # 替换文件中的图片路径
      sed -i '' "s|$img_path|$new_path|g" "$file"
      
      echo "  图片路径更新: $img_path -> $new_path"
    fi
  done
  
  # 更新Front Matter中的image字段
  if grep -q "^image:" "$file"; then
    image_line=$(grep "^image:" "$file")
    if [[ ! "$image_line" =~ ^image:\ \"/assets/images/posts/ ]]; then
      img_path=$(echo "$image_line" | sed 's/image: *"\(.*\)"/\1/')
      img_path=$(echo "$img_path" | sed 's/image: *\(.*\)/\1/')
      
      # 如果路径不为空
      if [[ ! -z "$img_path" ]]; then
        # 提取图片文件名
        img_filename=$(basename "$img_path")
        
        # 构建新路径
        new_path="/assets/images/posts/$category/${filename%.md}/$img_filename"
        
        # 更新Front Matter中的image字段
        sed -i '' "s|^image:.*$|image: \"$new_path\"|" "$file"
        
        echo "  Front Matter image更新: $img_path -> $new_path"
      fi
    fi
  fi
done

echo "图片路径更新完成！" 