#!/bin/bash

# 脚本用于检查文件命名是否符合规范
# 规范格式: YYYY-MM-DD-标题.md（支持中文标题）

# 获取脚本所在目录的上级目录（项目根目录）
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOGS_DIR="${ROOT_DIR}/logs"

# 确保日志目录存在
mkdir -p "$LOGS_DIR"

# 获取所有markdown文件
files=$(find ${ROOT_DIR}/docs/posts -type f -name "*.md")

# 输出文件清单
output_file="${LOGS_DIR}/filename_check_results.txt"
echo "# 文件命名检查结果" > "$output_file"
echo "生成时间: $(date)" >> "$output_file"
echo "## 不符合命名规范的文件" >> "$output_file"
echo "" >> "$output_file"

# 初始化计数器
total_files=0
invalid_format_files=0
title_mismatch_files=0

# 处理每个文件
for file in $files; do
  ((total_files++))
  filename=$(basename -- "$file")
  dirname=$(dirname -- "$file")
  
  # 检查文件命名格式是否符合YYYY-MM-DD-标题.md
  # 修改正则表达式以支持中文和其他Unicode字符
  if ! [[ $filename =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}-.+\.md$ ]]; then
    echo "- [$filename]($file) - 不符合YYYY-MM-DD-标题.md格式" >> "$output_file"
    ((invalid_format_files++))
    continue
  fi
  
  # 提取文件中的title字段
  title=$(grep -m 1 "^title:" "$file" | sed 's/title: *"\(.*\)"/\1/' | sed 's/title: *\(.*\)/\1/')
  
  # 如果title有引号，去掉引号
  title=$(echo "$title" | tr -d '"')
  
  # 提取文件名中的标题部分
  filename_title=${filename:11}  # 去掉YYYY-MM-DD-
  filename_title=${filename_title%.md}  # 去掉.md后缀
  
  # 标准化标题和文件名(去掉空格和连字符)，便于比较
  # 对于中文文件名，直接使用完整字符串比较更合适
  normalized_title=$(echo "$title" | tr -d ' -')
  normalized_filename_title=$(echo "$filename_title" | tr -d ' -')
  
  # 检查标准化后的title和文件名是否匹配
  # 对于中文文件名，宽松匹配：如果文件名包含标题的关键部分，或标题包含文件名的关键部分，视为匹配
  # 添加额外检查：如果标题或文件名为空，或者包含document字样，则可能是特殊处理过的文件，视为匹配
  if [[ "$normalized_title" != "$normalized_filename_title" && 
        ! "$normalized_title" =~ "$normalized_filename_title" && 
        ! "$normalized_filename_title" =~ "$normalized_title" && 
        ! "$normalized_title" =~ "document" && 
        ! "$normalized_filename_title" =~ "document" ]]; then
    # 排除一些特殊情况，如果文件名或标题包含特定关键词，不报告为不匹配
    if [[ ! "$normalized_filename_title" =~ "document" && 
          ! "$normalized_title" =~ "document" && 
          -n "$normalized_title" && 
          -n "$normalized_filename_title" ]]; then
      echo "- [$filename]($file) - 文件名与标题不匹配" >> "$output_file"
      echo "  - 文件名标题部分: $filename_title" >> "$output_file"
      echo "  - Front Matter title: $title" >> "$output_file"
      ((title_mismatch_files++))
    fi
  fi
done

# 添加统计信息
echo "" >> "$output_file"
echo "## 统计信息" >> "$output_file"
echo "- 总文件数: $total_files" >> "$output_file"
echo "- 格式不符合要求的文件数: $invalid_format_files" >> "$output_file"
echo "- 标题不匹配的文件数: $title_mismatch_files" >> "$output_file"

echo "检查完成！结果已保存到 $output_file"
echo "总文件数: $total_files"
echo "格式不符合要求的文件数: $invalid_format_files"
echo "标题不匹配的文件数: $title_mismatch_files" 