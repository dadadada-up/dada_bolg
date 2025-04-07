#!/bin/bash

# 设置日志文件
LOG_FILE="cleanup_empty_files_log.txt"
echo "开始清理根目录下的空Markdown文件 $(date)" > $LOG_FILE

# 日志函数
log_action() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> $LOG_FILE
  echo "$1"
}

# 找出并删除根目录下的空Markdown文件
log_action "查找根目录下的空Markdown文件..."
empty_files=$(find /Users/dada/Documents/dada_blog -maxdepth 1 -name "*.md" -type f -empty)

if [ -z "$empty_files" ]; then
  log_action "未找到空文件。"
else
  log_action "找到以下空文件："
  for file in $empty_files; do
    log_action "  $file"
  done
  
  log_action "开始删除空文件..."
  for file in $empty_files; do
    rm "$file"
    if [ $? -eq 0 ]; then
      log_action "  已删除: $file"
    else
      log_action "  删除失败: $file"
    fi
  done
fi

log_action "空文件清理完成。"

# 检查非空标准文件
log_action "检查是否有根目录下的非空Markdown文件..."
non_empty_files=$(find /Users/dada/Documents/dada_blog -maxdepth 1 -name "*.md" -type f ! -empty | grep -v "README.md" | grep -v "standardization_report.md" | grep -v "yuque_migration_report.md")

if [ -z "$non_empty_files" ]; then
  log_action "根目录下没有非空的Markdown文件（除了README.md、standardization_report.md和yuque_migration_report.md）。"
else
  log_action "找到以下非空文件，请手动检查是否需要处理："
  for file in $non_empty_files; do
    log_action "  $file"
  done
fi

log_action "清理工作完成。" 