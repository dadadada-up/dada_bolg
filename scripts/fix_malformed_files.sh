#!/bin/bash

# 设置日志文件
LOG_DIR="/Users/dada/Documents/dada_blog/logs"
LOG_FILE="$LOG_DIR/fix_malformed_files_$(date +%Y%m%d%H%M%S).log"
mkdir -p "$LOG_DIR"
touch "$LOG_FILE"

# 记录日志的函数
log_message() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "$timestamp - $1"
    echo "$timestamp - $1" >> "$LOG_FILE"
}

log_message "开始修复格式不正确的文件..."

# 直接处理已知有问题的文件
fix_specific_files() {
    # 修复文件: /Users/dada/Documents/dada_blog/docs/posts/family-life/2025-04-03-个人博客项目需求说明书.md
    local file1="/Users/dada/Documents/dada_blog/docs/posts/family-life/2025-04-03-个人博客项目需求说明书.md"
    if [ -f "$file1" ]; then
        log_message "修复文件: $file1"
        sed -i '' 's/title: "family life requirements"/title: "个人博客项目需求说明书"/' "$file1"
        log_message "  已更新标题为: 个人博客项目需求说明书"
    fi

    # 修复 2025-02-16-description- 文件
    local file2="/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-02-16-description-"
    if [ -f "$file2" ]; then
        log_message "修复文件: $file2"
        mv "$file2" "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-02-16-tech-tools-document.md"
        log_message "  已重命名为: 2025-02-16-tech-tools-document.md"
    fi

    # 修复 2025-01-01-.md 文件
    local file3="/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-01-01-.md"
    if [ -f "$file3" ]; then
        log_message "修复文件: $file3"
        mv "$file3" "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-01-01-tech-tools-document.md"
        log_message "  已重命名为: 2025-01-01-tech-tools-document.md"
        # 更新标题
        sed -i '' 's/title: ""/title: "tech-tools-document"/' "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-01-01-tech-tools-document.md"
        log_message "  已更新标题为: tech-tools-document"
    fi

    # 修复 2024-10-30-description- 文件
    local file4="/Users/dada/Documents/dada_blog/docs/posts/product-management/2024-10-30-description-"
    if [ -f "$file4" ]; then
        log_message "修复文件: $file4"
        mv "$file4" "/Users/dada/Documents/dada_blog/docs/posts/product-management/2024-10-30-product-management-document.md"
        log_message "  已重命名为: 2024-10-30-product-management-document.md"
        # 更新标题
        sed -i '' 's/title: ""/title: "product-management-document"/' "/Users/dada/Documents/dada_blog/docs/posts/product-management/2024-10-30-product-management-document.md"
        log_message "  已更新标题为: product-management-document"
    fi

    # 修复 2025-01-15-description- 文件
    local file5="/Users/dada/Documents/dada_blog/docs/posts/product-management/2025-01-15-description-"
    if [ -f "$file5" ]; then
        log_message "修复文件: $file5"
        mv "$file5" "/Users/dada/Documents/dada_blog/docs/posts/product-management/2025-01-15-product-management-document.md"
        log_message "  已重命名为: 2025-01-15-product-management-document.md"
        # 更新标题
        sed -i '' 's/title: ""/title: "product-management-document"/' "/Users/dada/Documents/dada_blog/docs/posts/product-management/2025-01-15-product-management-document.md"
        log_message "  已更新标题为: product-management-document"
    fi

    # 修复 2025-03-18-.md 文件
    local file6="/Users/dada/Documents/dada_blog/docs/posts/insurance/agriculture-insurance/2025-03-18-.md"
    if [ -f "$file6" ]; then
        log_message "修复文件: $file6"
        mv "$file6" "/Users/dada/Documents/dada_blog/docs/posts/insurance/agriculture-insurance/2025-03-18-agriculture-insurance-document.md"
        log_message "  已重命名为: 2025-03-18-agriculture-insurance-document.md"
        # 更新标题
        sed -i '' 's/title: ""/title: "agriculture-insurance-document"/' "/Users/dada/Documents/dada_blog/docs/posts/insurance/agriculture-insurance/2025-03-18-agriculture-insurance-document.md"
        log_message "  已更新标题为: agriculture-insurance-document"
    fi
}

# 处理不符合格式的空文件
clean_empty_files() {
    log_message "寻找不规范的空文件..."
    
    # 查找带有 -.md 格式的文件
    local weird_files=$(find /Users/dada/Documents/dada_blog -name "-.md")
    
    if [ -n "$weird_files" ]; then
        for file in $weird_files; do
            log_message "删除异常空文件: $file"
            rm -f "$file"
            log_message "  已删除"
        done
    else
        log_message "未找到异常空文件"
    fi
}

# 执行修复
fix_specific_files
clean_empty_files

# 再次运行检查脚本
log_message "运行文件名格式检查..."
if [ -f "/Users/dada/Documents/dada_blog/scripts/check_filename_format.sh" ]; then
    bash /Users/dada/Documents/dada_blog/scripts/check_filename_format.sh
    log_message "检查完成！结果已保存到 $LOG_DIR/filename_check_results.txt"
else
    log_message "错误：找不到检查脚本 /Users/dada/Documents/dada_blog/scripts/check_filename_format.sh"
fi

log_message "所有修复任务完成。" 