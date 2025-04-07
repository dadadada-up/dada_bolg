#!/bin/bash

# 设置日志文件
LOG_FILE="rename_to_chinese_log.txt"
echo "开始将文件名转换为中文 $(date)" > $LOG_FILE

# 日志函数
log_action() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> $LOG_FILE
  echo "$1"
}

log_action "正在检索所有Markdown文件..."

# 获取所有markdown文件
files=$(find docs/posts -type f -name "*.md")
total_files=0
renamed_files=0

# 处理每个文件
for file in $files; do
  ((total_files++))
  filename=$(basename "$file")
  dirname=$(dirname "$file")
  
  # 提取文件日期部分（前10个字符: YYYY-MM-DD）
  date_part=${filename:0:10}
  
  # 确保文件名格式正确
  if [[ ! $date_part =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    log_action "跳过: $file - 文件名前缀不是有效的日期格式"
    continue
  fi
  
  # 从文件内容提取title字段
  title=$(grep -m 1 "^title:" "$file" | sed 's/title: *"\(.*\)"/\1/' | sed 's/title: *\(.*\)/\1/')
  
  # 去掉title中的引号
  title=$(echo "$title" | tr -d '"')
  
  # 如果title为空或是"unnamed document"，则跳过
  if [[ -z "$title" || "$title" == "unnamed document" ]]; then
    log_action "跳过: $file - 无标题或未命名文档"
    continue
  fi
  
  # 替换title中的特殊字符为连字符
  safe_title=$(echo "$title" | tr -d ':"<>|*?\\/' | tr ' ' '-')
  
  # 创建新文件名
  new_filename="${date_part}-${safe_title}.md"
  new_filepath="${dirname}/${new_filename}"
  
  # 如果当前文件名已经是中文，则跳过
  if [[ "$filename" == "$new_filename" ]]; then
    log_action "跳过: $file - 文件名已经符合要求"
    continue
  fi
  
  # 重命名文件
  mv "$file" "$new_filepath"
  if [ $? -eq 0 ]; then
    log_action "已重命名: $file -> $new_filepath"
    ((renamed_files++))
  else
    log_action "重命名失败: $file"
  fi
done

log_action "文件名转换完成"
log_action "总文件数: $total_files"
log_action "已重命名文件数: $renamed_files"

# 运行最终检查
if [ -f "./check_filename_format.sh" ]; then
  log_action "运行文件检查..."
  chmod +x check_filename_format.sh
  ./check_filename_format.sh
  log_action "检查完成"
fi

echo "所有操作已完成并记录到 $LOG_FILE" 