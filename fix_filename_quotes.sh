#!/bin/bash

# 设置日志文件
log_file="fix_filename_quotes_log.txt"
echo "# 文件名引号修复日志" > "$log_file"
echo "生成时间: $(date '+%Y年 %m月 %d日 %A %H时%M分%S秒 %Z')" >> "$log_file"
echo "" >> "$log_file"

# 记录日志的函数
log() {
  echo "$1" >> "$log_file"
  echo "$1"
}

log "## 开始修复文件名中的引号问题"

# 修复文件名中的引号
fix_filename_quotes() {
  # 查找包含引号的文件名
  find docs/posts -type f -name "*\"*" | while read -r file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    
    # 替换引号和双重引号
    new_base=$(echo "$base" | sed 's/"//g' | sed 's/original_//g')
    new_path="$dir/$new_base"
    
    # 重命名文件
    mv "$file" "$new_path"
    log "已修复: $file -> $new_path"
  done
}

# 移除.md文件后缀
fix_md_suffix() {
  find docs/posts -type f -name "*.md.md" | while read -r file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    
    # 替换.md.md为.md
    new_base=$(echo "$base" | sed 's/\.md\.md$/.md/')
    new_path="$dir/$new_base"
    
    # 重命名文件
    mv "$file" "$new_path"
    log "已修复后缀: $file -> $new_path"
  done
}

# 修复文件名中的冒号和特殊字符
fix_special_chars() {
  find docs/posts -type f -name "*[:：]*" | while read -r file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    
    # 替换冒号和其他特殊字符
    new_base=$(echo "$base" | sed 's/[：:]/--/g')
    new_path="$dir/$new_base"
    
    # 重命名文件
    mv "$file" "$new_path"
    log "已修复特殊字符: $file -> $new_path"
  done
}

# 主程序
fix_filename_quotes
fix_md_suffix
fix_special_chars

# 运行最终检查
log "## 执行最终检查"
./check_filename_format.sh

log "## 文件名引号修复完成"
log "所有操作都已记录到 $log_file" 