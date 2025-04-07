#!/bin/bash

echo "开始将图片引用修改为指向占位图..."

# 基础目录
base_dir="/content/assets/images/posts"

# 遍历所有Markdown文件
for file in $(find content/posts -name "*.md"); do
  echo "处理文件: $file"
  category=$(echo "$file" | cut -d'/' -f2)
  
  # 提取文件名（不含路径和扩展名）
  filename=$(basename "$file" .md)
  
  # 根据文件名和目录匹配可能的图片目录名
  article_dir=""
  
  # 1. 尝试从文件名中提取文章标题（去掉日期前缀）
  article_name=$(echo "$filename" | sed -E 's/^[0-9]{4}-[0-9]{2}-[0-9]{2}-//')
  
  # 2. 处理图片路径
  # 将所有不存在的内部图片路径替换为指向占位图
  tmp_file="/tmp/$(basename "$file")"
  cp "$file" "$tmp_file"
  
  # 捕获并处理/content/assets/images/posts/类型的路径
  if grep -q "!\[.*\](/content/assets/images/posts/" "$file"; then
    # 替换引用
    sed -i '' -E "s|!\[(.*)\]\(/content/assets/images/posts/$category/[^/]+/[^)]+\)|![\\1](/content/assets/images/posts/$category/$article_name/placeholder.png)|g" "$tmp_file"
    echo "  - 替换 /content/assets/images/posts/ 路径的图片引用"
  fi
  
  # 捕获并处理https://链接的图片
  if grep -q "!\[.*\](https://" "$file"; then
    sed -i '' -E "s|!\[(.*)\]\(https://[^)]+\)|![\\1](/content/assets/images/posts/$category/$article_name/placeholder.png)|g" "$tmp_file"
    echo "  - 替换 https:// 开头的图片引用"
  fi
  
  # 捕获并处理不常见的前缀路径的图片
  if grep -q "!\[.*\](/assets/" "$file"; then
    sed -i '' -E "s|!\[(.*)\]\(/assets/[^)]+\)|![\\1](/content/assets/images/posts/$category/$article_name/placeholder.png)|g" "$tmp_file"
    echo "  - 替换 /assets/ 路径的图片引用"
  fi
  
  # 捕获并处理特定的VSCode的svg图片
  if [[ "$article_name" == *"VSCode"* || "$article_name" == *"vscode"* || "$article_name" == *"VS-Code"* ]] && grep -q "drawio" "$file"; then
    if [[ "$category" == "tech-tools" ]]; then
      sed -i '' -E "s|!\[(.*)\]\(.*drawio.*svg[^)]*\)|![\\1](/content/assets/images/posts/tech-tools/2025-04-03-vscode-drawio-usage/your-diagram.drawio.svg)|g" "$tmp_file"
      echo "  - 替换 VSCode drawio 相关的图片引用"
    fi
  fi
  
  # 移动临时文件回原位
  mv "$tmp_file" "$file"
done

echo "图片引用修复完成！"
echo "请运行 check_image_references.sh 检查结果。" 