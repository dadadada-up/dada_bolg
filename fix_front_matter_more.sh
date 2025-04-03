#!/bin/bash

# 设置日志文件
log_file="fix_front_matter_more_log.txt"
echo "# Front Matter进一步修复日志" > "$log_file"
echo "生成时间: $(date '+%Y年 %m月 %d日 %A %H时%M分%S秒 %Z')" >> "$log_file"
echo "" >> "$log_file"

# 记录日志的函数
log() {
  echo "$1" >> "$log_file"
  echo "$1"
}

log "## 开始进一步修复Front Matter格式问题"

fix_front_matter() {
  find docs/posts -type f -name "*.md" | while read -r file; do
    # 检查文件是否以3个或4个破折号开始
    first_line=$(head -n 1 "$file")
    
    if [[ "$first_line" != "---" && "$first_line" != "----" ]]; then
      log "警告: 文件 $file 不是以标准的Front Matter格式开始，跳过"
      continue
    fi
    
    # 提取Front Matter
    front_matter=$(awk '/^---/ {if (i++) exit; else i=1} {if (i==1) print}' "$file")
    
    # 检查是否存在格式问题
    has_issues=false
    
    # 检查引号后面的双引号
    if grep -q ':"' <<< "$front_matter"; then
      has_issues=true
    fi
    
    # 检查单引号后面的双引号
    if grep -q ":'\"" <<< "$front_matter"; then
      has_issues=true
    fi
    
    # 检查行尾的引号
    if grep -q '"$' <<< "$front_matter"; then
      has_issues=true
    fi
    
    # 如果存在格式问题，修复Front Matter
    if $has_issues; then
      log "修复文件: $file"
      
      # 创建临时文件
      tmp_file=$(mktemp)
      
      # 提取Front Matter并修复格式
      awk '
      BEGIN { in_front_matter = 0; front_matter_end = 0; }
      
      # 检测Front Matter的开始
      /^---/ && !in_front_matter {
        in_front_matter = 1;
        print "---";
        next;
      }
      
      # 检测Front Matter的结束
      /^---/ && in_front_matter && !front_matter_end {
        in_front_matter = 0;
        front_matter_end = 1;
        print "---";
        next;
      }
      
      # 处理Front Matter内容
      in_front_matter {
        # 移除行尾的引号
        gsub(/"$/, "");
        
        # 修复冒号后的双引号
        gsub(/:"/, ": \"");
        
        # 修复其他常见问题
        gsub(/: *"/, ": \"");
        gsub(/: *'"'"'/, ": \"");
        
        # 确保每个值都有引号
        if (match($0, /: *(.*[^ ])$/, arr)) {
          if (arr[1] !~ /^".*"$/ && arr[1] !~ /^'"'"'.*'"'"'$/ && arr[1] !~ /^\[.*\]$/ && arr[1] !~ /^{.*}$/ && arr[1] !~ /^[0-9]+$/ && arr[1] !~ /^true$/ && arr[1] !~ /^false$/) {
            gsub(/: *(.*)$/, ": \"\\1\"");
          }
        }
        
        print;
        next;
      }
      
      # 非Front Matter内容直接输出
      { print }
      ' "$file" > "$tmp_file"
      
      # 替换原文件
      mv "$tmp_file" "$file"
      
      log "  Front Matter格式已修复"
    fi
  done
}

# 修复标题字段特定问题
fix_title_field() {
  find docs/posts -type f -name "*.md" | while read -r file; do
    # 检查标题字段格式
    title_line=$(grep -A 10 "^---" "$file" | grep -i "title:")
    
    if [[ -z "$title_line" ]]; then
      # 如果没有找到标题字段，从文件名提取
      base=$(basename "$file")
      if [[ "$base" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}-(.*)\.md$ ]]; then
        # 从文件名提取标题部分
        title_part="${BASH_REMATCH[1]}"
        # 替换连字符为空格
        title=$(echo "$title_part" | sed 's/-/ /g')
        
        # 在Front Matter中添加标题字段
        sed -i '' "s/^---$/---\ntitle: \"$title\"/" "$file"
        log "已为文件 $file 添加标题字段: $title"
      else
        log "警告: 文件 $file 名称格式不符合标准，无法提取标题"
      fi
      continue
    fi
    
    # 检查标题字段格式问题
    if [[ "$title_line" =~ title:[[:space:]]*$ ]]; then
      # 标题字段为空，从文件名提取
      base=$(basename "$file")
      if [[ "$base" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}-(.*)\.md$ ]]; then
        title_part="${BASH_REMATCH[1]}"
        title=$(echo "$title_part" | sed 's/-/ /g')
        
        # 更新标题字段
        sed -i '' "s/title:[[:space:]]*$/title: \"$title\"/" "$file"
        log "已更新文件 $file 的空标题字段: $title"
      else
        log "警告: 文件 $file 名称格式不符合标准，无法提取标题"
      fi
    fi
    
    # 修复标题字段的引号问题
    if grep -q "title: *[^\"']" "$file" && ! grep -q "title: *\[" "$file"; then
      # 如果标题没有用引号括起来，添加引号
      sed -i '' "s/title: *\(.*\)$/title: \"\1\"/" "$file"
      log "已为文件 $file 的标题字段添加引号"
    fi
  done
}

# 主程序
fix_front_matter
fix_title_field

log "## Front Matter格式修复完成"
log "所有操作都已记录到 $log_file" 