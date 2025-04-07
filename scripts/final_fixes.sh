#!/bin/bash

# 设置日志文件
LOG_DIR="/Users/dada/Documents/dada_blog/logs"
LOG_FILE="$LOG_DIR/final_fixes_$(date +%Y%m%d%H%M%S).log"
mkdir -p "$LOG_DIR"
touch "$LOG_FILE"

# 记录日志的函数
log_message() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "$timestamp - $1"
    echo "$timestamp - $1" >> "$LOG_FILE"
}

log_message "开始修复剩余的问题文件..."

# 针对性修复
fix_remaining_issues() {
    # 修复 2025-02-16-description- 文件
    local file1="/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-02-16-description-"
    if [ -f "$file1" ]; then
        log_message "修复文件: $file1"
        mv "$file1" "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-02-16-tech-tools-document.md"
        log_message "  已重命名为: 2025-02-16-tech-tools-document.md"
        # 创建或更新文件内容
        cat > "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-02-16-tech-tools-document.md" << EOF
---
title: "tech-tools-document"
date: 2025-02-16
categories: ["tech-tools"]
tags: ["document"]
description: "技术工具文档"
---

# 技术工具文档

这是一个技术工具相关的文档。

EOF
        log_message "  已添加基本内容和Front Matter"
    fi

    # 修复 2024-10-30-description- 文件
    local file2="/Users/dada/Documents/dada_blog/docs/posts/product-management/2024-10-30-description-"
    if [ -f "$file2" ]; then
        log_message "修复文件: $file2"
        mv "$file2" "/Users/dada/Documents/dada_blog/docs/posts/product-management/2024-10-30-product-management-document.md"
        log_message "  已重命名为: 2024-10-30-product-management-document.md"
        # 创建或更新文件内容
        cat > "/Users/dada/Documents/dada_blog/docs/posts/product-management/2024-10-30-product-management-document.md" << EOF
---
title: "product-management-document"
date: 2024-10-30
categories: ["product-management"]
tags: ["document"]
description: "产品管理文档"
---

# 产品管理文档

这是一个产品管理相关的文档。

EOF
        log_message "  已添加基本内容和Front Matter"
    fi

    # 修复 2025-01-15-description- 文件
    local file3="/Users/dada/Documents/dada_blog/docs/posts/product-management/2025-01-15-description-"
    if [ -f "$file3" ]; then
        log_message "修复文件: $file3"
        mv "$file3" "/Users/dada/Documents/dada_blog/docs/posts/product-management/2025-01-15-product-management-document.md"
        log_message "  已重命名为: 2025-01-15-product-management-document.md"
        # 创建或更新文件内容
        cat > "/Users/dada/Documents/dada_blog/docs/posts/product-management/2025-01-15-product-management-document.md" << EOF
---
title: "product-management-document"
date: 2025-01-15
categories: ["product-management"]
tags: ["document"]
description: "产品管理文档"
---

# 产品管理文档

这是一个产品管理相关的文档。

EOF
        log_message "  已添加基本内容和Front Matter"
    fi

    # 修复 2025-01-01-tech-tools-document.md 文件的标题
    local file4="/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-01-01-tech-tools-document.md"
    if [ -f "$file4" ]; then
        log_message "修复文件标题: $file4"
        sed -i '' 's/title: "unnamed document"/title: "tech-tools-document"/' "$file4"
        log_message "  已更新标题为: tech-tools-document"
    fi

    # 修复 2025-03-18-agriculture-insurance-document.md 文件的标题
    local file5="/Users/dada/Documents/dada_blog/docs/posts/insurance/agriculture-insurance/2025-03-18-agriculture-insurance-document.md"
    if [ -f "$file5" ]; then
        log_message "修复文件标题: $file5"
        sed -i '' 's/title: "unnamed document"/title: "agriculture-insurance-document"/' "$file5"
        log_message "  已更新标题为: agriculture-insurance-document"
    fi
}

# 清理可能存在的异常文件
cleanup_anomalies() {
    log_message "清理异常文件..."
    
    # 查找可能的 -.md 文件
    find /Users/dada/Documents/dada_blog -name "-.md" -exec rm -f {} \; 2>/dev/null
    find /Users/dada/Documents/dada_blog -name "description-" -exec rm -f {} \; 2>/dev/null
    
    log_message "清理完成"
}

# 执行修复
fix_remaining_issues
cleanup_anomalies

# 再次运行检查脚本
log_message "运行文件名格式检查..."
if [ -f "/Users/dada/Documents/dada_blog/scripts/check_filename_format.sh" ]; then
    bash /Users/dada/Documents/dada_blog/scripts/check_filename_format.sh
    log_message "检查完成！结果已保存到 $LOG_DIR/filename_check_results.txt"
else
    log_message "错误：找不到检查脚本 /Users/dada/Documents/dada_blog/scripts/check_filename_format.sh"
fi

log_message "所有修复任务完成。" 