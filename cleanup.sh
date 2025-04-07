#!/bin/bash

# 清理脚本，用于删除临时文件和重复文档

# 设置日志文件
log_file="cleanup_log.txt"
echo "# 清理操作日志" > "$log_file"
echo "生成时间: $(date '+%Y年 %m月 %d日 %A %H时%M分%S秒 %Z')" >> "$log_file"
echo "" >> "$log_file"

# 记录日志的函数
log() {
  echo "$1" >> "$log_file"
  echo "$1"
}

log "## 开始清理操作"

# 1. 删除重复文档（保留英文文件名版本）
log "### 删除重复文档"

duplicate_files=(
  "docs/posts/open-source/2025-04-03-钉钉消息监控助手.md"
)

for file in "${duplicate_files[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    log "已删除重复文档: $file"
  else
    log "文件不存在: $file"
  fi
done

# 2. 删除临时脚本文件
log "### 删除临时脚本文件"

temp_scripts=(
  "fix_drafts.sh"
  "fix_filename_issues.sh"
  "fix_filename_quotes.sh"
  "fix_final_issues.sh"
  "fix_front_matter.sh"
  "fix_front_matter_more.sh"
  "fix_front_matter_structure.sh"
  "fix_image_paths.sh"
  "fix_markdown_files.sh"
  "fix_metadata.sh"
  "fix_remaining_files.sh"
  "fix_remote_images.sh"
  "fix_title_match.sh"
  "rename_files.sh"
)

for script in "${temp_scripts[@]}"; do
  if [ -f "$script" ]; then
    rm "$script"
    log "已删除临时脚本: $script"
  fi
done

# 3. 删除日志文件
log "### 删除日志文件"

log_files=(
  "fix_title_match_log.txt"
  "remote_images_log.txt"
  "fix_final_issues_log.txt"
  "fix_front_matter_more_log.txt"
  "fix_filename_quotes_log.txt"
  "fix_remaining_files_log.txt"
  "fix_filename_issues_log.txt"
  "fix_front_matter_structure_log.txt"
  "rename_files_log.txt"
  "filename_check_results.txt"
)

for log_file_name in "${log_files[@]}"; do
  if [ -f "$log_file_name" ]; then
    rm "$log_file_name"
    log "已删除日志文件: $log_file_name"
  fi
done

# 4. 更新README.md
log "### 更新README.md"

if [ -f "README.md.new" ]; then
  mv README.md.new README.md
  log "已更新README.md文件"
else
  log "警告: 未找到README.md.new文件"
fi

log "## 清理操作完成"
log "所有操作都已记录到 $log_file" 