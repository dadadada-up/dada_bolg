#!/bin/bash

# 脚本用于将远程图片下载到本地并更新引用路径
# 需要安装curl: brew install curl

# 获取所有markdown文件
files=$(find docs/posts -type f -name "*.md")

# 输出日志文件
log_file="remote_images_log.txt"
echo "# 远程图片处理日志" > "$log_file"
echo "执行时间: $(date)" >> "$log_file"
echo "" >> "$log_file"

# 处理每个文件
for file in $files; do
  echo "处理文件: $file"
  echo "## 处理文件: $file" >> "$log_file"
  
  # 获取文件名和目录信息
  filename=$(basename "$file")
  dirname=$(dirname "$file")
  category=$(echo "$dirname" | cut -d'/' -f3)
  
  # 创建图片目标目录
  target_dir="assets/images/posts/$category/${filename%.md}"
  mkdir -p "$target_dir"
  
  # 查找远程图片链接 (https://开头的URL)
  remote_urls=$(grep -o '!\[.*\](https://[^)]*\.(png\|jpg\|jpeg\|gif\|webp))' "$file" | sed 's/!\[.*\](\(.*\))/\1/')
  
  # 处理每个远程URL
  for url in $remote_urls; do
    # 提取图片文件名
    img_filename=$(basename "$url" | sed 's/\?.*//')  # 移除URL参数
    
    # 避免文件名冲突，加上时间戳
    timestamp=$(date +%s)
    new_filename="${timestamp}_${img_filename}"
    
    # 下载图片
    echo "  下载图片: $url -> $target_dir/$new_filename"
    if curl -s "$url" --output "$target_dir/$new_filename"; then
      # 构建新路径
      new_path="/assets/images/posts/$category/${filename%.md}/$new_filename"
      
      # 替换文件中的图片路径
      sed -i '' "s|$url|$new_path|g" "$file"
      
      echo "  图片已下载并更新路径: $url -> $new_path" >> "$log_file"
    else
      echo "  下载失败: $url" >> "$log_file"
    fi
  done
  
  # 处理yuque图片链接 (cdn.nlark.com或yuque域名)
  yuque_urls=$(grep -o '!\[.*\](https://cdn\.nlark\.com[^)]*\|https://.*\.yuque\.com[^)]*)' "$file" | sed 's/!\[.*\](\(.*\))/\1/')
  
  # 处理每个语雀URL
  for url in $yuque_urls; do
    # 提取图片文件名或生成随机名称
    img_filename=$(basename "$url" | sed 's/\?.*//')  # 移除URL参数
    if [[ "$img_filename" != *".png" && "$img_filename" != *".jpg" && "$img_filename" != *".jpeg" && "$img_filename" != *".gif" && "$img_filename" != *".webp" ]]; then
      # 如果没有文件扩展名，添加.png扩展名
      img_filename="yuque_${timestamp}.png"
    fi
    
    # 避免文件名冲突，加上时间戳
    timestamp=$(date +%s)
    new_filename="${timestamp}_${img_filename}"
    
    # 下载图片
    echo "  下载语雀图片: $url -> $target_dir/$new_filename"
    if curl -s "$url" --output "$target_dir/$new_filename"; then
      # 构建新路径
      new_path="/assets/images/posts/$category/${filename%.md}/$new_filename"
      
      # 替换文件中的图片路径
      sed -i '' "s|$url|$new_path|g" "$file"
      
      echo "  语雀图片已下载并更新路径: $url -> $new_path" >> "$log_file"
    else
      echo "  语雀图片下载失败: $url" >> "$log_file"
    fi
  done
done

echo "远程图片处理完成！详细日志请查看 $log_file" 