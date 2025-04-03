#!/bin/bash

# 脚本用于修复Front Matter格式问题
# 规范要求:
# 1. 冒号后必须有空格
# 2. 字符串应使用双引号包裹
# 3. 正确的缩进和列表格式

# 获取所有markdown文件
files=$(find docs/posts -type f -name "*.md")

for file in $files; do
  echo "处理文件: $file"
  
  # 临时文件
  temp_file="${file}.tmp"
  
  # 检查是否有Front Matter
  if grep -q "^---" "$file"; then
    # 提取Front Matter部分
    sed -n '/^---$/,/^---$/p' "$file" > "$temp_file"
    
    # 1. 修复冒号后没有空格的问题
    sed -i '' 's/:\([^ ]\)/: \1/g' "$temp_file"
    
    # 2. 确保title、description等值用双引号包裹
    sed -i '' 's/^title: \(.*[^"]\)$/title: "\1"/' "$temp_file"
    sed -i '' 's/^description: \(.*[^"]\)$/description: "\1"/' "$temp_file"
    
    # 3. 修复日期格式
    sed -i '' 's/date: "'\''/{date}/' "$temp_file"
    sed -i '' 's/{date}/date: "/' "$temp_file"
    
    # 4. 修复categories和tags格式
    # 先检查是否已经是正确的格式
    if grep -q "^categories: \[" "$temp_file"; then
      # 数组格式 [项目1, 项目2] -> 转换为标准格式
      sed -i '' 's/categories: \[\(.*\)\]/categories: \
  - "\1"/' "$temp_file"
      # 处理逗号分隔的项目
      sed -i '' 's/, /"\
  - "/g' "$temp_file"
    elif ! grep -q "^categories:" "$temp_file" || ! grep -q "^  -" "$temp_file"; then
      # 如果没有categories或者不是标准格式，则添加一个默认分类
      sed -i '' '/^categories:/d' "$temp_file"
      sed -i '' '/^---/a\
categories: \
  - "未分类"' "$temp_file"
    fi
    
    # 对tags进行同样的处理
    if grep -q "^tags: \[" "$temp_file"; then
      # 数组格式 [项目1, 项目2] -> 转换为标准格式
      sed -i '' 's/tags: \[\(.*\)\]/tags: \
  - "\1"/' "$temp_file"
      # 处理逗号分隔的项目
      sed -i '' 's/, /"\
  - "/g' "$temp_file"
    fi
    
    # 5. 确保列表项都有双引号
    sed -i '' 's/^  - \([^"]\)/  - "\1/' "$temp_file"
    sed -i '' 's/\([^"]\)$/\1"/' "$temp_file"
    
    # 6. 替换原文件中的Front Matter
    front_matter_start=$(grep -n "^---$" "$file" | head -1 | cut -d':' -f1)
    front_matter_end=$(grep -n "^---$" "$file" | head -2 | tail -1 | cut -d':' -f1)
    
    # 计算Front Matter有多少行
    front_matter_lines=$((front_matter_end - front_matter_start + 1))
    
    # 删除原文件中的Front Matter
    sed -i '' "${front_matter_start},${front_matter_end}d" "$file"
    
    # 将修复后的Front Matter插入到原文件
    sed -i '' "${front_matter_start}r $temp_file" "$file"
    
    # 删除临时文件
    rm "$temp_file"
    
    echo "  Front Matter已修复"
  else
    echo "  无Front Matter，跳过"
  fi
done

echo "所有文件的Front Matter格式已修复！" 