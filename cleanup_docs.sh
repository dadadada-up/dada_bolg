#!/bin/bash

# 设置日志文件
LOG_FILE="cleanup_docs_log.txt"
echo "开始清理已整合的文档 $(date)" > $LOG_FILE

# 日志函数
log_action() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> $LOG_FILE
  echo "$1"
}

# 检查README.md是否存在
if [ ! -f "README.md" ]; then
  log_action "错误：README.md不存在，无法继续清理"
  exit 1
fi

log_action "检查要删除的文件是否存在..."

# 要删除的文件列表
files_to_delete=(
  "CONTRIBUTING.md"
  "docs/README.md"
  "摘要.md"
)

# 检查并删除文件
for file in "${files_to_delete[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    log_action "已删除文件: $file"
  else
    log_action "文件不存在，跳过: $file"
  fi
done

# 清理临时文件
temp_files=(
  "filename_check_results.txt"
  "files_to_delete.txt"
  "README.md.new"
)

for file in "${temp_files[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    log_action "已清理临时文件: $file"
  fi
done

log_action "清理已整合的文档完成"

# 运行最终检查
if [ -f "./check_filename_format.sh" ]; then
  log_action "运行最终文件检查..."
  ./check_filename_format.sh
  log_action "最终检查完成"
fi

echo "所有操作已完成并记录到 $LOG_FILE" 