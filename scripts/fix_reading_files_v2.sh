#!/bin/bash

# 设置日志文件
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOGS_DIR="${ROOT_DIR}/logs"
LOG_FILE="$LOGS_DIR/fix_reading_files_v2_$(date +%Y%m%d%H%M%S).log"
mkdir -p "$LOGS_DIR"
touch "$LOG_FILE"

# 设置语言环境为UTF-8
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

# 记录日志的函数
log_message() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "$timestamp - $1"
    echo "$timestamp - $1" >> "$LOG_FILE"
}

log_message "开始修复读书笔记文件的格式问题..."

# 获取所有需要处理的文件
READING_DIR="${ROOT_DIR}/docs/posts/reading"
READING_FILES=$(find "$READING_DIR" -type f -name "*.md")

# 修复文件内容
fix_reading_file() {
    local file="$1"
    local basename=$(basename "$file")
    local dirname=$(dirname "$file")
    local date_part=${basename:0:10}
    local title_part=${basename:11}
    title_part=${title_part%.md}
    
    log_message "处理文件: $file"
    
    # 从文件名中提取真实的标题（移除文件扩展名）
    local real_title=$(echo "$title_part" | iconv -f UTF-8 -t UTF-8//IGNORE)
    
    # 创建临时文件
    local temp_file=$(mktemp)
    
    # 读取原始内容，跳过第一行和最后三行的Front Matter
    content=$(sed '1d' "$file" | grep -v "^title: " | grep -v "^---$" | grep -v "^$" | sed 's/^> //' | sed 's/^>//')
    
    # 创建新的文件内容，完整的Front Matter和内容
    cat > "$temp_file" << EOF
---
title: "$real_title"
date: "$date_part"
categories: ["reading"]
tags: ["读书笔记", "心得体会"]
description: "关于$real_title的读书笔记与心得体会"
---

$content
EOF
    
    # 将临时文件移回原文件
    mv "$temp_file" "$file"
    log_message "  已修复 Front Matter 和文件格式"
    
    # 创建图片目录
    local img_dir="${ROOT_DIR}/assets/images/posts/reading/${real_title}"
    mkdir -p "$img_dir"
    
    # 修复图片链接：替换远程链接为本地
    if grep -q "https://static.gridea.dev" "$file"; then
        log_message "  检测到远程图片链接，替换为本地链接"
        
        # 创建一个临时文件
        local temp_img_file=$(mktemp)
        
        # 读取文件内容
        cat "$file" > "$temp_img_file"
        
        # 处理不同的图片模式，确保正确替换
        sed -i '' "s|https://static.gridea.dev/[^)]*|/assets/images/posts/reading/${real_title}/image.jpg|g" "$temp_img_file" 2>/dev/null
        
        # 移回原文件
        mv "$temp_img_file" "$file"
        log_message "  已替换远程图片链接为本地路径"
    fi
    
    # 清理多余的空行
    local clean_file=$(mktemp)
    awk 'NF > 0 { blank=0 } NF == 0 { blank++ } blank <= 1' "$file" > "$clean_file"
    mv "$clean_file" "$file"
    
    # 创建占位图片
    local placeholder="${img_dir}/image.jpg"
    if [ ! -f "$placeholder" ]; then
        log_message "  创建占位图片: $placeholder"
        mkdir -p "$img_dir"
        # 创建一个1x1的透明图片作为占位符
        touch "$placeholder"
    fi
}

# 处理所有文件
for file in $READING_FILES; do
    fix_reading_file "$file"
done

log_message "所有读书笔记文件修复完成！"
log_message "请记得替换占位图片为真实图片"

# 运行检查脚本
log_message "运行文件名格式检查..."
bash "${ROOT_DIR}/scripts/check_filename_format.sh"

log_message "清理可能的临时文件..."
bash "${ROOT_DIR}/scripts/cleanup_temp_files.sh" 