#!/bin/bash

# 脚本用于修复所有Markdown文件的Front Matter和图片路径
# 使文件符合CONTRIBUTING.md的要求

# 处理posts目录下的所有Markdown文件
find /Users/dada/Documents/dada_bolg/docs/posts -name "*.md" | while read file; do
  echo "处理文件: $file"
  
  # 获取文件名（不含路径和扩展名）
  filename=$(basename "$file" .md)
  
  # 1. 修复图片路径: 将 images/ 替换为 /assets/images/
  sed -i '' 's|](images/|](/assets/images/|g' "$file"
  
  # 2. 确保Front Matter包含必要的字段
  # 检查文件是否有Front Matter
  if ! grep -q "^---" "$file"; then
    # 如果没有Front Matter，添加一个基本的
    today=$(date +%Y-%m-%d)
    temp_file=$(mktemp)
    echo "---" > "$temp_file"
    echo "title: $(echo $filename | cut -d'-' -f4-)" >> "$temp_file"
    echo "date: $today" >> "$temp_file"
    echo "categories: [未分类]" >> "$temp_file"
    echo "tags: []" >> "$temp_file"
    echo "published: true" >> "$temp_file"
    echo "---" >> "$temp_file"
    echo "" >> "$temp_file"
    cat "$file" >> "$temp_file"
    mv "$temp_file" "$file"
  else
    # 如果有Front Matter，确保它包含必要的字段
    # 使用awk来处理Front Matter
    awk '
    BEGIN { in_front_matter = 0; has_title = 0; has_date = 0; has_categories = 0; }
    /^---/ {
      if (in_front_matter == 0) {
        in_front_matter = 1;
        print "---";
        next;
      } else {
        in_front_matter = 0;
        if (!has_title) print "title: '"$(echo $filename | cut -d'-' -f4-)"'";
        if (!has_date) print "date: '"$(date +%Y-%m-%d)"'";
        if (!has_categories) print "categories: [未分类]";
        print "---";
        next;
      }
    }
    in_front_matter == 1 && /^title:/ { has_title = 1; }
    in_front_matter == 1 && /^date:/ { has_date = 1; }
    in_front_matter == 1 && /^categories:/ { has_categories = 1; }
    { print; }
    ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
  fi
done

echo "所有Markdown文件处理完成!" 