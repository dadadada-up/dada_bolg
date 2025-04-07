#!/bin/bash

# 设置日志文件
LOG_DIR="/Users/dada/Documents/dada_blog/logs"
LOG_FILE="$LOG_DIR/fix_remaining_issues_$(date +%Y%m%d%H%M%S).log"
mkdir -p "$LOG_DIR"
touch "$LOG_FILE"

# 记录日志的函数
log_message() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "$timestamp - $1"
    echo "$timestamp - $1" >> "$LOG_FILE"
}

log_message "开始修复剩余的文件名和标题问题..."

# 检查不符合命名规范的文件
fix_filename_format() {
    local file="$1"
    local basename=$(basename "$file")
    local dirname=$(dirname "$file")
    
    # 处理格式不正确的文件名
    if [[ ! "$basename" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}-.*\.md$ ]]; then
        log_message "处理格式不正确的文件: $file"
        
        # 如果文件名以日期开头但缺少后面的部分
        if [[ "$basename" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})-?(.*)\..+$ ]]; then
            local date_part="${BASH_REMATCH[1]}"
            local title_part="${BASH_REMATCH[2]}"
            
            # 如果标题部分为空或者只有"-"或者空格
            if [[ -z "$title_part" || "$title_part" == "-" || "$title_part" == " -" ]]; then
                # 从文件内容提取标题
                local content_title=$(head -n 20 "$file" | grep -i "title:" | head -n 1 | sed 's/title:[[:space:]]*//i' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
                
                # 如果内容中有标题则使用，否则使用默认标题
                if [[ -n "$content_title" && "$content_title" != "null" && "$content_title" != "undefined" ]]; then
                    local new_filename="${date_part}-${content_title}.md"
                    log_message "  从内容中提取标题: $content_title"
                else
                    # 获取目录名作为标题的一部分
                    local dir_name=$(basename "$dirname")
                    local new_filename="${date_part}-${dir_name}-document.md"
                    log_message "  使用目录名作为标题: $dir_name-document"
                fi
                
                # 确保新文件名不包含特殊字符
                new_filename=$(echo "$new_filename" | tr -d ':?<>*|"')
                
                # 移动文件
                mv "$file" "$dirname/$new_filename"
                log_message "  重命名文件: $basename -> $new_filename"
                
                # 返回新文件路径供后续处理
                echo "$dirname/$new_filename"
                return
            fi
        fi
    fi
    
    # 如果没有修改，返回原文件路径
    echo "$file"
}

# 确保Front Matter标题与文件名一致
fix_title_mismatch() {
    local file="$1"
    local basename=$(basename "$file")
    
    # 只处理正确格式的文件
    if [[ "$basename" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})-(.*)\.md$ ]]; then
        local title_from_filename="${BASH_REMATCH[2]}"
        
        # 检查文件中是否有标题
        if grep -q -i "^title:" "$file"; then
            # 提取当前标题
            local current_title=$(grep -i "^title:" "$file" | head -n 1 | sed 's/title:[[:space:]]*//i' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
            
            # 如果标题为空或与文件名不一致
            if [[ -z "$current_title" || "$current_title" == "null" || "$current_title" == "undefined" ]]; then
                log_message "修复文件标题: $file"
                log_message "  文件名标题: $title_from_filename"
                log_message "  当前Front Matter标题: $current_title"
                
                # 更新标题
                sed -i '' "s/^title:.*$/title: \"$title_from_filename\"/" "$file"
                log_message "  已更新Front Matter标题为: $title_from_filename"
            fi
        else
            # 如果没有标题字段，在Front Matter中添加
            log_message "添加缺失的标题字段: $file"
            
            # 检查是否有Front Matter
            if grep -q "^---" "$file"; then
                # 在第一个---后添加标题
                sed -i '' "/^---/a\\
title: \"$title_from_filename\"
" "$file"
                log_message "  已添加标题: $title_from_filename"
            fi
        fi
    fi
}

# 主处理逻辑
process_files() {
    local files=$(find /Users/dada/Documents/dada_blog/docs/posts -type f -name "*.md")
    local count=0
    local fixed_format=0
    local fixed_title=0
    
    for file in $files; do
        count=$((count + 1))
        
        # 修复文件名格式
        local fixed_file=$(fix_filename_format "$file")
        if [[ "$fixed_file" != "$file" ]]; then
            fixed_format=$((fixed_format + 1))
            file="$fixed_file"
        fi
        
        # 修复标题不匹配
        fix_title_mismatch "$file"
        if [[ $? -eq 0 ]]; then
            fixed_title=$((fixed_title + 1))
        fi
    done
    
    log_message "处理完成。"
    log_message "总文件数: $count"
    log_message "修复的文件名格式: $fixed_format"
    log_message "修复的标题不匹配: $fixed_title"
}

# 执行主处理逻辑
process_files

# 再次运行检查脚本
log_message "运行文件名格式检查..."
if [ -f "/Users/dada/Documents/dada_blog/scripts/check_filename_format.sh" ]; then
    bash /Users/dada/Documents/dada_blog/scripts/check_filename_format.sh
    log_message "检查完成！结果已保存到 $LOG_DIR/filename_check_results.txt"
else
    log_message "错误：找不到检查脚本 /Users/dada/Documents/dada_blog/scripts/check_filename_format.sh"
fi

log_message "所有修复任务完成。" 