#!/bin/bash

# 脚本用于修复文档的Front Matter格式问题

# 获取脚本所在目录的上级目录（项目根目录）
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOGS_DIR="${ROOT_DIR}/logs"
DOCS_DIR="${ROOT_DIR}/docs/posts"

# 确保日志目录存在
mkdir -p "$LOGS_DIR"

# 日志文件
LOG_FILE="${LOGS_DIR}/fix_front_matter_issues_log.txt"
echo "开始修复Front Matter格式问题 $(date)" > "$LOG_FILE"

# 日志函数
log_message() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a "$LOG_FILE"
}

# 修复文件的Front Matter
fix_front_matter() {
  local file="$1"
  local filename=$(basename "$file")
  local dirname=$(dirname "$file")
  local category=$(echo "$dirname" | awk -F '/' '{print $(NF)}')
  
  log_message "处理文件: $file"
  
  # 创建临时文件
  local temp_file=$(mktemp)
  
  # 检查文件是否以---开头
  if ! grep -q "^---" "$file"; then
    log_message "  文件不包含Front Matter, 添加基本Front Matter"
    
    # 从文件名提取日期和标题
    local date_part=${filename:0:10}
    local title_part=${filename:11}
    title_part=${title_part%.md}
    
    # 如果是unnamed-document，尝试从内容中获取更好的标题
    if [[ "$title_part" == "unnamed-document" ]]; then
      # 尝试从文件内容的第一个标题中获取标题
      local content_title=$(grep -m 1 "^# " "$file" | sed 's/^# //')
      if [[ -n "$content_title" ]]; then
        title_part="$content_title"
        log_message "  从内容中提取标题: $title_part"
      fi
    fi
    
    # 生成基本Front Matter
    cat > "$temp_file" << EOF
---
title: "${title_part}"
date: "${date_part}"
categories: 
  - "${category}"
tags:
  - "${category}"
description: "关于${title_part}的详细介绍"
---

EOF
    
    # 将原文件内容追加到临时文件
    cat "$file" >> "$temp_file"
  else
    # 处理已有Front Matter但格式有问题的情况
    local in_front_matter=false
    local fixed_front_matter=""
    local content=""
    local line_count=0
    local front_matter_end=false
    
    while IFS= read -r line; do
      ((line_count++))
      
      # 检测Front Matter的开始
      if [[ "$line" == "---" && "$line_count" -le 3 && "$in_front_matter" == false ]]; then
        in_front_matter=true
        fixed_front_matter+="---\n"
        continue
      fi
      
      # 检测Front Matter的结束
      if [[ "$line" == "---" && "$in_front_matter" == true && "$front_matter_end" == false ]]; then
        in_front_matter=false
        front_matter_end=true
        fixed_front_matter+="---\n\n"
        continue
      fi
      
      # 处理Front Matter中的内容
      if [[ "$in_front_matter" == true ]]; then
        # 修复常见的格式问题
        
        # 1. 修复categories格式
        if [[ "$line" =~ ^categories:.*$ ]]; then
          if ! [[ "$line" =~ ^categories:[[:space:]]+$ ]]; then
            # 只保留冒号后的值，并确保有正确的空格
            local cat_value=$(echo "$line" | sed 's/^categories:[[:space:]]*//g' | tr -d '"')
            if [[ -z "$cat_value" ]]; then
              fixed_front_matter+="categories: \n  - \"${category}\"\n"
            else
              fixed_front_matter+="categories: \n  - \"${cat_value}\"\n"
            fi
          else
            fixed_front_matter+="categories: \n  - \"${category}\"\n"
          fi
          continue
        fi
        
        # 2. 修复tags格式
        if [[ "$line" =~ ^tags:.*$ ]]; then
          if ! [[ "$line" =~ ^tags:[[:space:]]+$ ]]; then
            local tag_value=$(echo "$line" | sed 's/^tags:[[:space:]]*//g' | tr -d '"')
            if [[ -z "$tag_value" ]]; then
              fixed_front_matter+="tags:\n  - \"${category}\"\n"
            else
              fixed_front_matter+="tags:\n  - \"${tag_value}\"\n"
            fi
          else
            fixed_front_matter+="tags:\n  - \"${category}\"\n"
          fi
          continue
        fi
        
        # 3. 修复title格式
        if [[ "$line" =~ ^title:.*$ ]]; then
          local title_value=$(echo "$line" | sed 's/^title:[[:space:]]*//g' | tr -d '"')
          if [[ "$title_value" == "unnamed document" ]]; then
            # 从文件名中提取更好的标题
            local new_title=${filename:11}
            new_title=${new_title%.md}
            fixed_front_matter+="title: \"${new_title}\"\n"
          else
            fixed_front_matter+="title: \"${title_value}\"\n"
          fi
          continue
        fi
        
        # 4. 修复date格式
        if [[ "$line" =~ ^date:.*$ ]]; then
          local date_value=$(echo "$line" | sed 's/^date:[[:space:]]*//g' | tr -d "\"'")
          if [[ -z "$date_value" || ! "$date_value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
            # 从文件名中提取日期
            local date_from_filename=${filename:0:10}
            fixed_front_matter+="date: \"${date_from_filename}\"\n"
          else
            fixed_front_matter+="date: \"${date_value}\"\n"
          fi
          continue
        fi
        
        # 5. 修复description格式
        if [[ "$line" =~ ^description:.*$ ]]; then
          local desc_value=$(echo "$line" | sed 's/^description:[[:space:]]*//g')
          # 移除引号
          desc_value=$(echo "$desc_value" | sed 's/^"//g' | sed 's/"$//g')
          # 限制描述长度
          if [[ ${#desc_value} -gt 150 ]]; then
            desc_value="${desc_value:0:147}..."
          fi
          fixed_front_matter+="description: \"${desc_value}\"\n"
          continue
        fi
        
        # 跳过任何不规范的行
        if [[ "$line" =~ ^\\.* || "$line" =~ ^[0-9]+:.* ]]; then
          continue
        fi
        
        # 保留其他有效行
        if [[ -n "$line" ]]; then
          fixed_front_matter+="$line\n"
        fi
      else
        # 文件内容
        content+="$line\n"
      fi
    done < "$file"
    
    # 如果未找到Front Matter结束标记，添加一个
    if [[ "$front_matter_end" == false && "$in_front_matter" == true ]]; then
      fixed_front_matter+="---\n\n"
    fi
    
    # 写入修复后的Front Matter和内容到临时文件
    echo -e "$fixed_front_matter$content" > "$temp_file"
  fi
  
  # 将临时文件移回原文件
  mv "$temp_file" "$file"
  log_message "  已修复Front Matter"
}

# 修复未命名文档的标题
rename_unnamed_docs() {
  local file="$1"
  local filename=$(basename "$file")
  local dirname=$(dirname "$file")
  
  # 如果文件名包含unnamed-document
  if [[ "$filename" == *"unnamed-document.md" ]]; then
    log_message "处理未命名文档: $file"
    
    # 尝试从内容中获取一个更好的标题
    local title=""
    
    # 方法1: 从Front Matter中获取title
    title=$(grep -m 1 "^title:" "$file" | sed 's/^title:[[:space:]]*//g' | tr -d '"')
    
    # 如果title是unnamed document或为空，尝试从内容获取标题
    if [[ -z "$title" || "$title" == "unnamed document" ]]; then
      # 方法2: 从文件内容的第一个标题中获取
      title=$(grep -m 1 "^# " "$file" | sed 's/^# //')
    fi
    
    # 如果还是未找到合适标题，使用内容的前20个字符
    if [[ -z "$title" ]]; then
      title=$(sed -n '6,15p' "$file" | tr -d '\n' | head -c 20 | sed 's/[[:space:]]*$//')
      # 添加"关于"前缀
      title="关于${title}的说明"
    fi
    
    # 如果仍然为空，使用一个通用标题
    if [[ -z "$title" ]]; then
      title="文档归档-$(date +"%Y%m%d%H%M%S")"
    fi
    
    # 清理标题，仅保留允许的字符
    title=$(echo "$title" | tr -cd '[:alnum:] [:punct:]' | tr -s ' ')
    # 将特殊字符替换为连字符
    title=$(echo "$title" | sed 's/[\/\:*?"<>|]/-/g')
    
    # 提取日期部分
    local date_part=${filename:0:10}
    
    # 新文件名
    local new_filename="${date_part}-${title}.md"
    local new_filepath="${dirname}/${new_filename}"
    
    # 重命名文件
    mv "$file" "$new_filepath"
    log_message "  已重命名: $filename -> $new_filename"
    
    # 更新文件内的Front Matter
    fix_front_matter "$new_filepath"
  fi
}

# 主函数
main() {
  log_message "开始修复文档的Front Matter问题..."
  
  # 处理所有Markdown文件
  find "$DOCS_DIR" -type f -name "*.md" | while read -r file; do
    # 首先修复Front Matter格式
    fix_front_matter "$file"
    
    # 如果是未命名文档，尝试重命名
    if [[ "$(basename "$file")" == *"unnamed-document.md" ]]; then
      rename_unnamed_docs "$file"
    fi
  done
  
  log_message "Front Matter修复完成。"
  log_message "运行文件名格式检查..."
  bash "${ROOT_DIR}/scripts/check_filename_format.sh"
}

# 执行主函数
main 