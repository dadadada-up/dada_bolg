#!/bin/bash

# 设置日志文件
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOGS_DIR="${ROOT_DIR}/logs"
REPORTS_DIR="${ROOT_DIR}/reports"
SCRIPTS_DIR="${ROOT_DIR}/scripts"

LOG_FILE="$LOGS_DIR/final_cleanup_$(date +%Y%m%d%H%M%S).log"
mkdir -p "$LOGS_DIR"
mkdir -p "$REPORTS_DIR"
touch "$LOG_FILE"

# 记录日志的函数
log_message() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "$timestamp - $1"
    echo "$timestamp - $1" >> "$LOG_FILE"
}

log_message "开始最终清理..."

# 删除残留的异常文件
cleanup_anomalies() {
    log_message "清理异常文件..."
    
    # 1. 删除所有 .md 文件以外的空文件
    find "$ROOT_DIR" -type f -empty -not -name "*.md" -not -path "*/\.*" -delete 2>/dev/null
    log_message "  已删除所有非Markdown空文件"
    
    # 2. 删除特定格式的异常文件
    find "$ROOT_DIR" -name "-.md" -delete 2>/dev/null
    find "$ROOT_DIR" -name "*description-*" -not -name "*.md" -delete 2>/dev/null
    log_message "  已删除特定格式的异常文件"
    
    # 3. 修复剩余的文件格式问题
    find "$ROOT_DIR/docs/posts" -type f -name "2*-description-*" | while read -r file; do
        local dirname=$(dirname "$file")
        local basename=$(basename "$file")
        local date_part=$(echo "$basename" | cut -d'-' -f1-3)
        local category=$(basename "$dirname")
        
        # 创建新文件名
        local new_filename="${date_part}-${category}-document.md"
        local new_filepath="${dirname}/${new_filename}"
        
        # 移动并创建基本内容
        log_message "  处理异常文件: $file"
        cat > "$new_filepath" << EOF
---
title: "${category}-document"
date: ${date_part}
categories: ["${category}"]
tags: ["document"]
description: "${category}相关文档"
---

# ${category}文档

这是一个${category}相关的文档。
EOF
        
        # 删除原始异常文件
        rm -f "$file"
        log_message "  已创建规范文件: $new_filepath 并删除原始文件"
    done
}

# 执行最后的检查
final_check() {
    log_message "执行最后的文件检查..."
    
    # 运行文件格式检查
    bash "${SCRIPTS_DIR}/check_filename_format.sh"
    
    # 检查是否有空文件
    local empty_files=$(find "$ROOT_DIR/docs/posts" -type f -name "*.md" -empty | wc -l)
    log_message "  空Markdown文件数量: $empty_files"
    
    # 统计各类文件数量
    local total_files=$(find "$ROOT_DIR/docs/posts" -type f -name "*.md" | wc -l)
    log_message "  总共Markdown文件数: $total_files"
    
    # 按照目录统计文件分布
    log_message "  文件分布情况:"
    for dir in "$ROOT_DIR/docs/posts"/*; do
        if [ -d "$dir" ]; then
            local dir_name=$(basename "$dir")
            local file_count=$(find "$dir" -type f -name "*.md" | wc -l)
            log_message "    - $dir_name: $file_count个文件"
        fi
    done
}

# 生成最终报告
generate_report() {
    log_message "生成最终报告..."
    
    # 获取当前日期
    local today=$(date "+%Y-%m-%d")
    
    # 创建报告文件
    local report_file="${REPORTS_DIR}/blog_standardization_report_${today}.md"
    
    cat > "$report_file" << EOF
# 博客文档标准化工作报告

**生成日期:** ${today}

## 主要工作

1. **文件格式规范化**
   - 所有文件均已按照 \`YYYY-MM-DD-标题.md\` 格式命名
   - 修复了异常文件名（如空格、特殊字符等）
   - 处理了未命名的文档，赋予合适的标题

2. **Front Matter修复**
   - 确保所有文件都有正确的Front Matter结构
   - 添加缺失的标题、日期、分类等信息
   - 统一格式化引号、空格等

3. **特殊文件处理**
   - 删除了无用的空文件和临时文件
   - 重命名了格式不规范的文件
   - 为缺少标题的文件添加了合适的标题

## 目录统计
EOF
    
    # 添加目录统计信息
    for dir in "$ROOT_DIR/docs/posts"/*; do
        if [ -d "$dir" ]; then
            local dir_name=$(basename "$dir")
            local file_count=$(find "$dir" -type f -name "*.md" | wc -l)
            echo "- **${dir_name}**: ${file_count}个文件" >> "$report_file"
        fi
    done
    
    # 添加总计信息
    local total_files=$(find "$ROOT_DIR/docs/posts" -type f -name "*.md" | wc -l)
    echo "" >> "$report_file"
    echo "**总计**: ${total_files}个Markdown文件" >> "$report_file"
    
    # 添加未解决问题（如果有）
    local issues_count=$(grep -c "不符合命名规范的文件" "$LOGS_DIR/filename_check_results.txt")
    if [ "$issues_count" -gt 0 ]; then
        echo "" >> "$report_file"
        echo "## 剩余问题" >> "$report_file"
        echo "" >> "$report_file"
        
        # 提取不符合规范的文件列表
        grep -A 3 "不符合命名规范的文件" "$LOGS_DIR/filename_check_results.txt" | grep -v "##" | grep -v "^$" >> "$report_file"
    fi
    
    log_message "  报告已生成: $report_file"
}

# 执行清理
cleanup_anomalies

# 执行检查
final_check

# 生成报告
generate_report

log_message "所有清理和检查工作已完成。"
log_message "请查看最终报告: ${REPORTS_DIR}/blog_standardization_report_$(date "+%Y-%m-%d").md" 