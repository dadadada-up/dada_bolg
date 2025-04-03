#!/bin/bash

# 脚本用于修复文件名与Front Matter标题的不匹配问题
# 主要针对的是连字符和空格的差异

# 设置日志文件
log_file="fix_title_match_log.txt"
echo "# 标题匹配修复日志" > "$log_file"
echo "生成时间: $(date '+%Y年 %m月 %d日 %A %H时%M分%S秒 %Z')" >> "$log_file"
echo "" >> "$log_file"

# 记录日志的函数
log() {
  echo "$1" >> "$log_file"
  echo "$1"
}

log "## 开始修复文件名与标题匹配问题"

# 获取所有markdown文件
files=$(find docs/posts -type f -name "*.md")

for file in $files; do
  filename=$(basename "$file")
  dirname=$(dirname "$file")
  
  # 检查是否符合日期格式
  if [[ $filename =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})-(.*)\.md$ ]]; then
    date_part="${BASH_REMATCH[1]}"
    title_part="${BASH_REMATCH[2]}"
    
    # 将文件名中的连字符转换为空格
    title_from_filename=$(echo "$title_part" | tr '-' ' ')
    
    # 调整一些特殊情况
    if [[ "$title_from_filename" == *"VS Code"* ]]; then
      title_from_filename=$(echo "$title_from_filename" | sed 's/VS Code/VS Code/')
    fi
    
    if [[ "$title_from_filename" == *"GitHub Desktop"* ]]; then
      title_from_filename=$(echo "$title_from_filename" | sed 's/GitHub Desktop/GitHub Desktop/')
    fi
    
    if [[ "$title_from_filename" == *"Notion API"* ]]; then
      title_from_filename=$(echo "$title_from_filename" | sed 's/Notion API/Notion API/')
    fi
    
    if [[ "$title_from_filename" == *"Sublime Text"* ]]; then
      title_from_filename=$(echo "$title_from_filename" | sed 's/Sublime Text/Sublime Text/')
    fi
    
    if [[ "$title_from_filename" == *"Asset Tracker"* ]]; then
      title_from_filename=$(echo "$title_from_filename" | sed 's/Asset Tracker/Asset Tracker/')
    fi
    
    if [[ "$title_from_filename" == *"Cursor"* ]]; then
      title_from_filename=$(echo "$title_from_filename" | sed 's/Cursor/Cursor/')
    fi
    
    # 更新Front Matter中的标题
    sed -i '' "s/^title:.*$/title: \"$title_from_filename\"/" "$file"
    log "已更新 $file 的标题为: \"$title_from_filename\""
  fi
done

# 运行最终检查
log "## 执行最终检查"
./check_filename_format.sh

log "## 标题匹配修复完成"
log "所有操作都已记录到 $log_file" 