#!/bin/bash

# 设置日志文件
log_file="fix_filename_issues_log.txt"
echo "# 文件名修复日志" > "$log_file"
echo "生成时间: $(date '+%Y年 %m月 %d日 %A %H时%M分%S秒 %Z')" >> "$log_file"
echo "" >> "$log_file"

# 记录日志的函数
log() {
  echo "$1" >> "$log_file"
  echo "$1"
}

log "## 开始修复文件名问题"

# 处理不符合YYYY-MM-DD-标题.md格式的文件
handle_missing_title_files() {
  log "### 处理缺少标题的文件"
  
  # 查找所有格式为YYYY-MM-DD-.md的文件
  find docs/posts -type f -name "????-??-??-.md" | while read -r file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    date_part=${base:0:10}
    
    # 从Front Matter中提取标题
    title=$(grep -A 3 "^---" "$file" | grep "title:" | sed 's/title: *//;s/^"//;s/"$//;s/^'"'"'//;s/'"'"'$//')
    
    if [ -z "$title" ]; then
      log "警告: 文件 $file 没有Front Matter标题，尝试从文件名或目录获取标题"
      # 尝试从目录名获取标题
      dir_name=$(basename "$dir")
      if [ "$dir_name" != "posts" ] && [ "$dir_name" != "tech-tools" ] && [ "$dir_name" != "personal-blog" ] && [ "$dir_name" != "finance" ] && [ "$dir_name" != "insurance" ] && [ "$dir_name" != "product-management" ] && [ "$dir_name" != "family-life" ] && [ "$dir_name" != "open-source" ] && [ "$dir_name" != "agriculture-insurance" ]; then
        title=$dir_name
        log "使用目录名作为标题: $title"
      else
        title="未命名文档"
        log "使用默认标题: $title"
      fi
      
      # 更新Front Matter标题
      sed -i '' "s/title: *.*$/title: \"$title\"/" "$file"
      log "已更新文件 $file 的Front Matter标题为: $title"
    fi
    
    # 准备新文件名
    new_title=$(echo "$title" | tr -d ',:?![]{}()<>|;&*~`#$^' | sed 's/ /-/g' | sed 's/---/-/g' | sed 's/--/-/g')
    new_filename="${date_part}${new_title}.md"
    new_path="$dir/$new_filename"
    
    # 重命名文件
    if [ "$base" != "$new_filename" ]; then
      mv "$file" "$new_path"
      log "已重命名: $file -> $new_path"
    else
      log "文件名已符合要求: $file"
    fi
  done
}

# 处理文件名分段的问题
handle_fragmented_filenames() {
  log "### 处理文件名分段的问题"
  
  # 查找所有可能的文件名片段
  fragmented_files=$(find docs/posts -type f ! -name "*.md" | sort)
  
  if [ -n "$fragmented_files" ]; then
    log "发现可能的文件名片段:"
    echo "$fragmented_files" | while read -r fragment; do
      log "  - $fragment"
    done
    
    # 找出基础文件名和扩展名部分
    for fragment in $fragmented_files; do
      dir=$(dirname "$fragment")
      base=$(basename "$fragment")
      
      # 查找同目录下的相关文件片段
      related_fragments=$(find "$dir" -maxdepth 1 -type f ! -name "*.md" | grep -v "$fragment" | sort)
      
      # 尝试找到日期格式片段作为开始
      date_fragment=$(echo "$fragment" | grep -o "[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}-")
      
      if [ -n "$date_fragment" ]; then
        log "找到日期片段: $date_fragment"
        # 构建可能的完整文件名
        prefix=$fragment
        suffix=""
        
        for rel_frag in $related_fragments; do
          rel_base=$(basename "$rel_frag")
          if [[ $rel_base != *"$date_fragment"* ]]; then
            suffix="${suffix}${rel_base}"
          fi
        done
        
        if [ -n "$suffix" ]; then
          new_filename="${base}${suffix}.md"
          new_path="$dir/$new_filename"
          
          # 创建临时文件
          tmp_file="/tmp/merged_file.md"
          cat "$fragment" > "$tmp_file"
          
          for rel_frag in $related_fragments; do
            rel_base=$(basename "$rel_frag")
            if [[ $rel_base != *"$date_fragment"* ]]; then
              cat "$rel_frag" >> "$tmp_file"
              log "合并片段: $rel_frag"
            fi
          done
          
          # 移动到新文件
          mv "$tmp_file" "$new_path"
          log "已创建合并文件: $new_path"
          
          # 删除原始片段
          rm "$fragment"
          log "已删除片段: $fragment"
          
          for rel_frag in $related_fragments; do
            rel_base=$(basename "$rel_frag")
            if [[ $rel_base != *"$date_fragment"* ]]; then
              rm "$rel_frag"
              log "已删除片段: $rel_frag"
            fi
          done
        else
          # 如果没有找到相关片段，直接重命名为.md文件
          new_path="$dir/${base}.md"
          mv "$fragment" "$new_path"
          log "已重命名单个片段: $fragment -> $new_path"
        fi
      fi
    done
  else
    log "未发现文件名分段问题"
  fi
}

# 处理文件名与Front Matter标题不匹配的问题
handle_mismatched_titles() {
  log "### 处理文件名与标题不匹配的问题"
  
  find docs/posts -type f -name "????-??-??-*.md" | while read -r file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    filename_length=${#base}
    
    # 提取日期部分（前11个字符，包括连字符）
    date_part="${base:0:11}"
    
    # 提取名称部分（剩余部分，不包括.md扩展名）
    name_part="${base:11:$((filename_length-14))}"
    
    # 从Front Matter中提取标题
    title=$(grep -A 3 "^---" "$file" | grep "title:" | sed 's/title: *//;s/^"//;s/"$//;s/^'"'"'//;s/'"'"'$//')
    
    # 如果标题为空，跳过
    if [ -z "$title" ]; then
      log "警告: 文件 $file 没有Front Matter标题，跳过"
      continue
    fi
    
    # 格式化标题为文件名格式
    formatted_title=$(echo "$title" | tr -d ',:?![]{}()<>|;&*~`#$^' | sed 's/ /-/g' | sed 's/---/-/g' | sed 's/--/-/g')
    
    # 如果格式化后的标题不等于当前文件名部分，重命名文件
    if [ "$formatted_title" != "$name_part" ]; then
      new_filename="${date_part}${formatted_title}.md"
      new_path="$dir/$new_filename"
      
      # 检查目标文件是否已存在
      if [ -f "$new_path" ]; then
        log "警告: 目标文件已存在，无法重命名 $file -> $new_path"
      else
        mv "$file" "$new_path"
        log "已重命名: $file -> $new_path (标题不匹配修复)"
      fi
    fi
  done
}

# 主程序
handle_missing_title_files
handle_fragmented_filenames
handle_mismatched_titles

# 运行最终检查
log "## 执行最终检查"
./check_filename_format.sh

log "## 文件名修复完成"
log "所有操作都已记录到 $log_file" 