#!/bin/bash

# 设置日志文件
LOG_FILE="fix_empty_docs_log.txt"
echo "开始修复空文档 $(date)" > $LOG_FILE

# 日志函数
log_action() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> $LOG_FILE
  echo "$1"
}

# 创建一个函数来修复特定文件
fix_file() {
  local yuque_file="$1"
  local target_file="$2"
  
  if [ ! -f "$yuque_file" ]; then
    log_action "  错误：源文件不存在 - $yuque_file"
    return 1
  fi
  
  if [ ! -f "$target_file" ]; then
    log_action "  错误：目标文件不存在 - $target_file"
    return 1
  fi
  
  # 检查目标文件是否为空
  if [ -s "$target_file" ]; then
    log_action "  目标文件不为空，跳过处理 - $target_file"
    return 0
  fi
  
  # 读取原始文件内容
  local content=$(cat "$yuque_file")
  
  # 生成Front Matter
  local filename=$(basename "$target_file")
  local title=${filename:11} # 移除前缀的日期部分 YYYY-MM-DD-
  title=${title%.md} # 移除.md后缀
  
  local category=""
  if [[ "$target_file" == *"/tech-tools/"* ]]; then
    category="技术工具"
  elif [[ "$target_file" == *"/product-management/"* ]]; then
    category="产品管理"
  elif [[ "$target_file" == *"/finance/"* ]]; then
    category="金融"
  elif [[ "$target_file" == *"/insurance/"* ]]; then
    category="保险"
  elif [[ "$target_file" == *"/reading/"* ]]; then
    category="读书笔记"
  else
    category="技术"
  fi
  
  local curr_date=$(date +"%Y-%m-%d")
  local front_matter="---\ntitle: \"$title\"\ndate: \"$curr_date\"\ncategories: \n  - \"$category\"\ntags:\n  - \"$category\"\ndescription: \"这是关于$title的文档\"\npublished: true\n---\n\n"
  
  # 将内容写入目标文件
  echo -e "$front_matter$content" > "$target_file"
  
  log_action "  已修复文件: $target_file"
  return 0
}

# 开始修复空文件
log_action "开始修复空的Markdown文档..."

# 修复Docker文件
fix_file "/Users/dada/Documents/dada_blog/语雀/在 macOS 上轻松部署 Docker：详细安装与配置步骤.md" "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-Docker：详细安装与配置步骤.md"

# 修复Desktop文件
fix_file "/Users/dada/Documents/dada_blog/语雀/GitHub Desktop安装与汉化.md" "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-Desktop安装与汉化.md"

# 修复满血使用文件
fix_file "/Users/dada/Documents/dada_blog/语雀/Cursor 满血使用.md" "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-满血使用.md"

# 修复介绍文件
fix_file "/Users/dada/Documents/dada_blog/语雀/Cursor 介绍.md" "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-介绍.md"

# 修复rules文件
fix_file "/Users/dada/Documents/dada_blog/语雀/Cursor rules.md" "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-rules.md"

# 修复HMW分析法文件
fix_file "/Users/dada/Documents/dada_blog/语雀/需求分析 _ HMW分析法.md" "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-HMW分析法.md"

# 修复业务需求文档模板
fix_file "/Users/dada/Documents/dada_blog/语雀/BRD 业务需求文档模板.md" "/Users/dada/Documents/dada_blog/docs/posts/product-management/2025-04-07-业务需求文档模板.md"

# 修复Text文件 - 特殊情况，因为我们没有找到对应的原始文件
if [ -f "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-Text.md" ]; then
  if [ ! -s "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-Text.md" ]; then
    log_action "  尝试修复Text文件 - 没有找到原始文件，使用Sublime Text内容替代"
    
    # 使用Sublime Text内容作为替代
    if [ -f "/Users/dada/Documents/dada_blog/语雀/Sublime Text.md" ]; then
      content=$(cat "/Users/dada/Documents/dada_blog/语雀/Sublime Text.md")
      front_matter="---\ntitle: \"Sublime Text使用指南\"\ndate: \"$(date +"%Y-%m-%d")\"\ncategories: \n  - \"技术工具\"\ntags:\n  - \"技术工具\"\ndescription: \"Sublime Text编辑器的使用指南\"\npublished: true\n---\n\n"
      
      echo -e "${front_matter}${content}" > "/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-Text.md"
      log_action "  已修复文件: /Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-Text.md"
    else
      log_action "  错误：无法找到Sublime Text内容来替代"
    fi
  fi
fi

# 检查是否还有空文件
empty_files=$(find /Users/dada/Documents/dada_blog/docs/posts -name "*.md" -type f -empty)
if [ -z "$empty_files" ]; then
  log_action "所有文件已修复，没有发现空文件。"
else
  log_action "仍有以下空文件，可能需要手动处理："
  for file in $empty_files; do
    log_action "  $file"
  done
fi

log_action "修复工作完成。" 