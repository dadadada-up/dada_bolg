#!/bin/bash

# 设置日志文件
log_file="fix_front_matter_structure_log.txt"
echo "# Front Matter结构修复日志" > "$log_file"
echo "生成时间: $(date '+%Y年 %m月 %d日 %A %H时%M分%S秒 %Z')" >> "$log_file"
echo "" >> "$log_file"

# 记录日志的函数
log() {
  echo "$1" >> "$log_file"
  echo "$1"
}

log "## 开始修复Front Matter结构问题"

fix_front_matter_structure() {
  find docs/posts -type f -name "*.md" | while read -r file; do
    # 检查文件的前10行
    head_content=$(head -n 10 "$file")
    
    # 检查是否以---开始
    if ! grep -q "^---$" <<< "$head_content"; then
      log "修复文件: $file"
      
      # 检查是否有其他类型的Front Matter标记
      if grep -q "^---\"" <<< "$head_content" || grep -q "^----" <<< "$head_content"; then
        # 创建临时文件
        tmp_file=$(mktemp)
        
        # 替换不规范的Front Matter开始标记
        sed '1s/^---\"$/---/' "$file" | sed '1s/^----$/---/' > "$tmp_file"
        
        # 查找Front Matter结束位置
        end_line=$(grep -n "^---\"$\|^----$" "$tmp_file" | head -n 2 | tail -n 1 | cut -d: -f1)
        
        if [ -n "$end_line" ]; then
          # 修复Front Matter结束标记
          sed -i '' "${end_line}s/^---\"$/---/" "$tmp_file"
          sed -i '' "${end_line}s/^----$/---/" "$tmp_file"
          
          # 处理Front Matter中的问题
          awk -v end=$end_line '
          NR == 1, NR == end {
            # 去除行尾引号
            gsub(/"$/, "");
            
            # 修复冒号后面的引号
            gsub(/: *"/, ": \"");
            gsub(/: *'"'"'/, ": \"");
            
            # 删除每行末尾的引号
            gsub(/"$/, "");
            
            # 修复字段行尾可能的格式问题
            if ($0 ~ /^[a-zA-Z_]+:/) {
              gsub(/:"/, ": \"");
              gsub(/: *$/, ": \"\"");
            }
            
            print;
            next;
          }
          { print }
          ' "$tmp_file" > "${tmp_file}.new"
          
          mv "${tmp_file}.new" "$file"
          rm "$tmp_file"
          
          log "  已修复Front Matter结构"
        else
          # 如果找不到结束标记，假设第10行前后是Front Matter的结束
          sed -i '' '10i\
---' "$tmp_file"
          
          mv "$tmp_file" "$file"
          log "  已添加缺失的Front Matter结束标记"
        fi
      else
        # 如果没有任何Front Matter，添加基本的Front Matter
        log "  文件缺少Front Matter，添加基本结构"
        
        # 提取文件名中的日期和标题
        base=$(basename "$file")
        
        if [[ "$base" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})-(.*)\.md$ ]]; then
          date="${BASH_REMATCH[1]}"
          title="${BASH_REMATCH[2]}"
          # 替换连字符为空格
          title=$(echo "$title" | sed 's/-/ /g')
          
          # 创建临时文件
          tmp_file=$(mktemp)
          
          # 添加基本Front Matter
          cat > "$tmp_file" << EOF
---
title: "$title"
date: "$date"
categories:
  - "未分类"
tags:
  - "未标记"
description: ""
published: true
---

EOF
          
          # 追加原文件内容
          cat "$file" >> "$tmp_file"
          
          mv "$tmp_file" "$file"
          log "  已添加基本Front Matter"
        else
          log "  警告: 文件名格式不符合标准，跳过 $file"
        fi
      fi
    fi
  done
}

# 修复引号问题
fix_quotes() {
  find docs/posts -type f -name "*.md" | while read -r file; do
    # 检查文件是否有Front Matter
    if grep -q "^---$" "$file"; then
      # 获取Front Matter结束行号
      end_line=$(grep -n "^---$" "$file" | head -n 2 | tail -n 1 | cut -d: -f1)
      
      if [ -n "$end_line" ]; then
        # 创建临时文件
        tmp_file=$(mktemp)
        
        # 处理Front Matter中的引号问题
        awk -v end=$end_line '
        NR == 1, NR == end {
          # 处理行尾的引号
          gsub(/"$/, "");
          
          # 修复字段行尾可能的格式问题
          if ($0 ~ /^[a-zA-Z_]+:/) {
            # 检查是否有冒号后的值
            if ($0 ~ /^[a-zA-Z_]+: *[^ ]/) {
              # 如果值不是以引号开始，添加引号
              if ($0 !~ /^[a-zA-Z_]+: *"/ && $0 !~ /^[a-zA-Z_]+: *\[/ && $0 !~ /^[a-zA-Z_]+: *{/) {
                sub(/^([a-zA-Z_]+): */, "\\1: \"");
                $0 = $0 "\"";
              }
            } else if ($0 ~ /^[a-zA-Z_]+: *$/) {
              # 如果冒号后没有值，添加空引号
              $0 = $0 "\"\"";
            }
          }
          
          print;
          next;
        }
        { print }
        ' "$file" > "$tmp_file"
        
        mv "$tmp_file" "$file"
      fi
    fi
  done
}

# 主程序
fix_front_matter_structure
fix_quotes

# 最后运行fix_filename_issues.sh脚本
log "## 运行文件名修复脚本"
./fix_filename_issues.sh

log "## Front Matter结构修复完成"
log "所有操作都已记录到 $log_file" 