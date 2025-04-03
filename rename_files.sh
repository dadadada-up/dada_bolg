#!/bin/bash

# 脚本用于重命名文件，使其与Front Matter中的title字段匹配
# 规范格式: YYYY-MM-DD-标题.md

# 获取所有markdown文件
files=$(find docs/posts -type f -name "*.md")

# 输出日志文件
log_file="rename_files_log.txt"
echo "# 文件重命名日志" > "$log_file"
echo "执行时间: $(date)" >> "$log_file"
echo "" >> "$log_file"

# 处理每个文件
for file in $files; do
  filename=$(basename "$file")
  dirname=$(dirname "$file")
  
  # 检查是否符合日期格式
  if [[ $filename =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})-(.*).md$ ]]; then
    date_part="${BASH_REMATCH[1]}"
    title_part="${BASH_REMATCH[2]}"
    
    # 提取文件中的title字段
    title=$(grep -m 1 "^title:" "$file" | sed 's/title: *"\(.*\)"/\1/' | sed 's/title: *\(.*\)/\1/')
    
    # 如果title有引号，去掉引号
    title=$(echo "$title" | tr -d '"')
    
    # 如果title不为空且与文件名不同
    if [[ ! -z "$title" && "$title" != "$title_part" ]]; then
      # 处理title中的特殊字符，替换为连字符
      new_title=$(echo "$title" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -d '[:punct:]' | tr -cd '[:alnum:]-')
      
      # 确保new_title不为空
      if [[ -z "$new_title" ]]; then
        echo "警告: 处理后的标题为空，跳过重命名: $file" >> "$log_file"
        continue
      fi
      
      # 处理中文标题
      if [[ "$title" =~ [一-龥] ]]; then
        # 保留中文标题
        new_title=$title
        # 去除特殊字符
        new_title=$(echo "$new_title" | tr -d '[:punct:]')
      fi
      
      # 构建新文件名
      new_filename="${date_part}-${new_title}.md"
      new_filepath="${dirname}/${new_filename}"
      
      # 避免文件名过长
      if [ ${#new_filename} -gt 100 ]; then
        new_title=$(echo "$new_title" | cut -c 1-80)
        new_filename="${date_part}-${new_title}.md"
        new_filepath="${dirname}/${new_filename}"
      fi
      
      # 检查新文件是否已存在
      if [[ -f "$new_filepath" && "$file" != "$new_filepath" ]]; then
        echo "警告: 目标文件已存在，跳过重命名: $file -> $new_filepath" >> "$log_file"
        continue
      fi
      
      # 重命名文件
      mv "$file" "$new_filepath"
      
      echo "已重命名: $file -> $new_filepath" >> "$log_file"
      echo "已重命名: $filename -> $new_filename"
    fi
  fi
done

echo "文件重命名完成！详细日志请查看 $log_file" 