#!/bin/bash

# 设置日志文件
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOGS_DIR="${ROOT_DIR}/logs"
LOG_FILE="$LOGS_DIR/fix_reading_files_$(date +%Y%m%d%H%M%S).log"
mkdir -p "$LOGS_DIR"
touch "$LOG_FILE"

# 记录日志的函数
log_message() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "$timestamp - $1"
    echo "$timestamp - $1" >> "$LOG_FILE"
}

log_message "开始修复读书笔记类文件格式问题..."

# 获取所有需要处理的文件
READING_DIR="${ROOT_DIR}/docs/posts/reading"
READING_FILES=$(find "$READING_DIR" -type f -name "*.md")

# 修复文件内容
fix_reading_file() {
    local file="$1"
    local basename=$(basename "$file")
    local date_part=${basename:0:10}
    local title_part=${basename:11}
    title_part=${title_part%.md}
    
    log_message "处理文件: $file"
    
    # 创建临时文件
    local temp_file=$(mktemp)
    
    # 提取文件内容（去掉第一行和最后三行）
    content=$(sed '1d;$d;$d;$d' "$file")
    
    # 创建正确的Front Matter
    cat > "$temp_file" << EOF
---
title: "$title_part"
date: "$date_part"
categories: ["reading"]
tags: ["读书笔记", "心得体会"]
description: "关于$title_part的读书笔记与心得体会"
---

$content
EOF

    # 将临时文件移回原文件
    mv "$temp_file" "$file"
    log_message "  已修复 Front Matter 和文件格式"
    
    # 查找并替换远程图片链接为本地链接
    if grep -q "https://static.gridea.dev" "$file"; then
        log_message "  检测到远程图片链接，替换为本地链接"
        
        # 创建图片目录
        local img_dir="${ROOT_DIR}/assets/images/posts/reading/${title_part}"
        mkdir -p "$img_dir"
        
        # 替换远程图片链接
        sed -i '' 's|https://static.gridea.dev/[^)]*|/assets/images/posts/reading/'"$title_part"'/image_placeholder.jpg|g' "$file"
        log_message "  已替换远程图片链接为本地路径"
    fi
}

# 处理所有文件
for file in $READING_FILES; do
    fix_reading_file "$file"
done

log_message "所有读书笔记文件修复完成！"
log_message "请记得检查图片路径，确保本地图片文件存在"

# 运行检查脚本
log_message "运行文件名格式检查..."
bash "${ROOT_DIR}/scripts/check_filename_format.sh" 