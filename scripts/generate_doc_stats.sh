#!/bin/bash

# 文档统计生成脚本
# 用于统计不同分类的文档数量并生成Markdown页面

# 获取脚本所在目录的上级目录（项目根目录）
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_DIR="${ROOT_DIR}/docs"
OUTPUT_FILE="${DOCS_DIR}/stats.md"

# 设置语言环境为UTF-8
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

# 创建临时目录
mkdir -p "${ROOT_DIR}/tmp"
TEMP_DIR="${ROOT_DIR}/tmp"

echo "开始生成文档统计..."

# 获取当前日期
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_DATETIME=$(date "+%Y-%m-%d %H:%M:%S")

# 统计分类数量
CATEGORY_COUNT=$(find "${DOCS_DIR}/posts" -maxdepth 1 -type d | grep -v "^${DOCS_DIR}/posts$" | wc -l | tr -d ' ')

# 统计子分类数量
SUBCATEGORY_COUNT=$(find "${DOCS_DIR}/posts" -mindepth 2 -maxdepth 2 -type d | wc -l | tr -d ' ')

# 统计总文档数
TOTAL_DOCS=$(find "${DOCS_DIR}/posts" -type f -name "*.md" | wc -l | tr -d ' ')

# 生成统计页面头部
cat > "$OUTPUT_FILE" << EOF
---
title: "文档统计"
date: "$CURRENT_DATE"
categories: ["站点信息"]
tags: ["统计", "文档管理"]
description: "博客文档的分类统计和最新更新情况"
---

# 文档统计

> 最后更新时间: $CURRENT_DATETIME

## 总体概况

- **总文档数**: ${TOTAL_DOCS}篇
- **分类数量**: ${CATEGORY_COUNT}个主分类
- **子分类数量**: ${SUBCATEGORY_COUNT}个子分类

## 分类统计

| 分类 | 文档数量 | 占比 |
|------|---------|-----|
EOF

# 创建临时文件存储分类统计
CATEGORY_STATS_FILE="${TEMP_DIR}/category_stats.txt"
> "$CATEGORY_STATS_FILE"

# 获取所有一级分类目录及文档数量
find "${DOCS_DIR}/posts" -maxdepth 1 -type d | sort | while read -r category_dir; do
    # 跳过posts目录本身
    if [ "$category_dir" = "${DOCS_DIR}/posts" ]; then
        continue
    fi
    
    category_name=$(basename "$category_dir")
    doc_count=$(find "$category_dir" -type f -name "*.md" | wc -l | tr -d ' ')
    
    # 添加到临时文件
    echo "$category_name|$doc_count" >> "$CATEGORY_STATS_FILE"
done

# 按文档数量排序并计算百分比
sort -t'|' -k2 -nr "$CATEGORY_STATS_FILE" | while IFS='|' read -r category_name doc_count; do
    # 计算百分比
    percentage=$(echo "scale=1; $doc_count * 100 / $TOTAL_DOCS" | bc)
    
    # 添加到统计表格
    echo "| $category_name | $doc_count | ${percentage}% |" >> "$OUTPUT_FILE"
done

# 添加总计行
echo "| **总计** | **$TOTAL_DOCS** | **100%** |" >> "$OUTPUT_FILE"

# 添加子分类统计
echo "" >> "$OUTPUT_FILE"
echo "## 子分类统计" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 获取所有一级分类目录
find "${DOCS_DIR}/posts" -maxdepth 1 -type d | sort | while read -r category_dir; do
    # 跳过posts目录本身
    if [ "$category_dir" = "${DOCS_DIR}/posts" ]; then
        continue
    fi
    
    category_name=$(basename "$category_dir")
    
    # 检查是否有子分类
    subcategories=$(find "$category_dir" -maxdepth 1 -type d | sort)
    if [ -n "$subcategories" ]; then
        echo "### $category_name" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "| 子分类 | 文档数量 |" >> "$OUTPUT_FILE"
        echo "|--------|---------|" >> "$OUTPUT_FILE"
        
        # 先获取当前分类下的文档数量（不在子分类中的）
        direct_count=$(find "$category_dir" -maxdepth 1 -type f -name "*.md" | wc -l | tr -d ' ')
        if [ "$direct_count" -gt 0 ]; then
            echo "| (直接在${category_name}下) | $direct_count |" >> "$OUTPUT_FILE"
        fi
        
        # 获取子分类统计
        find "$category_dir" -mindepth 1 -maxdepth 1 -type d | sort | while read -r subcategory_dir; do
            subcategory_name=$(basename "$subcategory_dir")
            sub_count=$(find "$subcategory_dir" -type f -name "*.md" | wc -l | tr -d ' ')
            
            # 只显示有文档的子分类
            if [ "$sub_count" -gt 0 ]; then
                echo "| $subcategory_name | $sub_count |" >> "$OUTPUT_FILE"
            fi
            
            # 检查是否有第三级分类
            find "$subcategory_dir" -mindepth 1 -maxdepth 1 -type d | sort | while read -r third_level_dir; do
                third_level_name=$(basename "$third_level_dir")
                third_count=$(find "$third_level_dir" -type f -name "*.md" | wc -l | tr -d ' ')
                
                # 只显示有文档的三级分类
                if [ "$third_count" -gt 0 ]; then
                    echo "| &nbsp;&nbsp;&nbsp;&nbsp;$third_level_name | $third_count |" >> "$OUTPUT_FILE"
                fi
            done
        done
        
        echo "" >> "$OUTPUT_FILE"
    fi
done

# 添加最近更新的文档
echo "## 最近更新的10篇文档" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "| 标题 | 日期 | 分类 |" >> "$OUTPUT_FILE"
echo "|------|------|------|" >> "$OUTPUT_FILE"

# 使用find和grep获取所有文档的标题和日期
find "${DOCS_DIR}/posts" -type f -name "*.md" | while read -r doc_file; do
    title=$(grep -m 1 "^title:" "$doc_file" | sed 's/title: *"\(.*\)"/\1/' | sed 's/title: *\(.*\)/\1/' | tr -d '"')
    date=$(grep -m 1 "^date:" "$doc_file" | sed 's/date: *"\(.*\)"/\1/' | sed 's/date: *\(.*\)/\1/' | tr -d '"')
    category_path=$(dirname "$doc_file" | sed "s|${DOCS_DIR}/posts/||")
    
    # 获取最终分类名称
    if [[ "$category_path" == *"/"* ]]; then
        main_category=$(echo "$category_path" | cut -d'/' -f1)
        sub_category=$(echo "$category_path" | cut -d'/' -f2)
        category="$main_category/$sub_category"
    else
        category="$category_path"
    fi
    
    # 保存到临时文件，包含日期以便排序
    echo "$date|$title|$category|$doc_file" >> "${TEMP_DIR}/recent_docs.txt"
done

# 按日期排序并获取最近的10篇
if [ -f "${TEMP_DIR}/recent_docs.txt" ]; then
    sort -r "${TEMP_DIR}/recent_docs.txt" | head -10 | while IFS='|' read -r date title category file; do
        # 提取文件的相对路径（用于链接）
        rel_path=$(echo "$file" | sed "s|${ROOT_DIR}/||")
        echo "| [$title](/$rel_path) | $date | $category |" >> "$OUTPUT_FILE"
    done
fi

# 添加文档增长趋势和使用指南
cat >> "$OUTPUT_FILE" << EOF

## 文档增长趋势

由于统计页面在GitHub Actions中自动生成，因此可以通过查看历史版本来了解文档的增长趋势。

### 如何使用本统计

1. **查找特定主题**: 通过分类统计找到感兴趣的主题区域
2. **获取最新内容**: "最近更新"部分显示了最新添加的文档
3. **了解内容分布**: 百分比数据帮助你了解内容的侧重点

> 注：本统计页面由自动脚本生成，每次代码提交时自动更新。
EOF

echo "文档统计生成完成！输出文件: $OUTPUT_FILE"

# 清理临时文件
rm -rf "${TEMP_DIR}" 