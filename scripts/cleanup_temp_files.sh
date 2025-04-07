#!/bin/bash

# 设置日志文件
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOGS_DIR="${ROOT_DIR}/logs"
LOG_FILE="$LOGS_DIR/cleanup_temp_files_$(date +%Y%m%d%H%M%S).log"
mkdir -p "$LOGS_DIR"
touch "$LOG_FILE"

# 记录日志的函数
log_message() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "$timestamp - $1"
    echo "$timestamp - $1" >> "$LOG_FILE"
}

log_message "开始清理临时文件和隐藏文件..."

# 删除以.!开头的临时文件
find "$ROOT_DIR" -type f -name ".!*" -exec rm -f {} \; 2>/dev/null
log_message "已删除以.!开头的临时文件"

# 删除以~结尾的备份文件
find "$ROOT_DIR" -type f -name "*~" -exec rm -f {} \; 2>/dev/null
log_message "已删除以~结尾的备份文件"

# 删除以.swp结尾的Vim临时文件
find "$ROOT_DIR" -type f -name "*.swp" -exec rm -f {} \; 2>/dev/null
log_message "已删除Vim临时文件"

# 删除._开头的macOS元数据文件
find "$ROOT_DIR" -type f -name "._*" -exec rm -f {} \; 2>/dev/null
log_message "已删除macOS元数据文件"

# 删除.DS_Store文件
find "$ROOT_DIR" -type f -name ".DS_Store" -exec rm -f {} \; 2>/dev/null
log_message "已删除.DS_Store文件"

# 删除 .tmp 文件
find "$ROOT_DIR" -type f -name "*.tmp" -exec rm -f {} \; 2>/dev/null
log_message "已删除.tmp文件"

# 删除临时文件目录
rm -rf "$ROOT_DIR"/tmp 2>/dev/null
log_message "已删除临时文件目录"

log_message "临时文件清理完成"

# 再次检查文件格式
log_message "运行文件名格式检查..."
bash "${ROOT_DIR}/scripts/check_filename_format.sh" 