#!/bin/bash

# 设置日志文件
LOG_FILE="cleanup_special_files_log.txt"
echo "开始处理特殊空文件 $(date)" > $LOG_FILE

# 日志函数
log_action() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> $LOG_FILE
  echo "$1"
}

# 要处理的特殊文件列表
special_files=(
  "/Users/dada/Documents/dada_blog/上轻松部署"
  "/Users/dada/Documents/dada_blog/_"
  "/Users/dada/Documents/dada_blog/macOS"
)

log_action "开始处理特殊空文件..."

# 检查文件是否存在并且为空
for file in "${special_files[@]}"; do
  if [ -f "$file" ]; then
    if [ ! -s "$file" ]; then
      log_action "发现空文件: $file"
      
      # 删除空文件
      rm "$file"
      if [ $? -eq 0 ]; then
        log_action "  已删除空文件: $file"
      else
        log_action "  删除失败: $file"
      fi
    else
      log_action "文件不为空，跳过: $file"
    fi
  else
    log_action "文件不存在，跳过: $file"
  fi
done

# 检查目标文件夹中是否有对应的正确文件
log_action "检查在docs/posts目录中是否有对应的正确文件..."

# 检查上轻松部署
docs_file="/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-上轻松部署.md"
if [ -f "$docs_file" ]; then
  if [ -s "$docs_file" ]; then
    log_action "  已找到对应文件: $docs_file (非空)"
  else
    log_action "  找到对应文件但为空: $docs_file"
    
    # 尝试修复空文件
    yuque_file="/Users/dada/Documents/dada_blog/语雀/在 macOS 上轻松部署 Docker：详细安装与配置步骤.md"
    if [ -f "$yuque_file" ]; then
      content=$(cat "$yuque_file")
      front_matter="---\ntitle: \"在macOS上轻松部署Docker\"\ndate: \"$(date +"%Y-%m-%d")\"\ncategories: \n  - \"技术工具\"\ntags:\n  - \"技术工具\"\ndescription: \"在macOS上轻松部署Docker的详细教程\"\npublished: true\n---\n\n"
      
      echo -e "${front_matter}${content}" > "$docs_file"
      log_action "  已修复文件: $docs_file"
    else
      log_action "  错误：无法找到对应的语雀文件修复空文件"
    fi
  fi
else
  log_action "  未找到对应文件: $docs_file"
fi

# 检查macOS
docs_file="/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-macOS.md"
if [ -f "$docs_file" ]; then
  if [ -s "$docs_file" ]; then
    log_action "  已找到对应文件: $docs_file (非空)"
  else
    log_action "  找到对应文件但为空: $docs_file"
    
    # 尝试修复空文件
    # macOS可能是在 macOS 上轻松部署 Docker 的部分内容
    yuque_file="/Users/dada/Documents/dada_blog/语雀/在 macOS 上轻松部署 Docker：详细安装与配置步骤.md"
    if [ -f "$yuque_file" ]; then
      content=$(cat "$yuque_file")
      front_matter="---\ntitle: \"macOS系统使用指南\"\ndate: \"$(date +"%Y-%m-%d")\"\ncategories: \n  - \"技术工具\"\ntags:\n  - \"技术工具\"\ndescription: \"macOS系统的使用指南和技巧\"\npublished: true\n---\n\n"
      
      echo -e "${front_matter}${content}" > "$docs_file"
      log_action "  已修复文件: $docs_file"
    else
      log_action "  错误：无法找到对应的语雀文件修复空文件"
    fi
  fi
else
  log_action "  未找到对应文件: $docs_file"
fi

# 检查_
docs_file="/Users/dada/Documents/dada_blog/docs/posts/tech-tools/2025-04-07-_.md"
if [ -f "$docs_file" ]; then
  if [ -s "$docs_file" ]; then
    log_action "  已找到对应文件: $docs_file (非空)"
  else
    log_action "  找到对应文件但为空: $docs_file"
    
    # 由于_文件名不明确，我们可以创建一个空的模板文件
    front_matter="---\ntitle: \"常用开发工具记录\"\ndate: \"$(date +"%Y-%m-%d")\"\ncategories: \n  - \"技术工具\"\ntags:\n  - \"技术工具\"\ndescription: \"常用开发工具和资源的记录\"\npublished: true\n---\n\n# 常用开发工具记录\n\n这是一个记录常用开发工具和资源的文档。\n\n## 开发环境\n\n- 开发环境配置\n- IDE设置\n- 终端设置\n\n## 常用命令\n\n```bash\n# 一些常用命令示例\n```\n\n## 资源链接\n\n- [开发工具官网](#)\n- [文档资源](#)\n\n"
    
    echo -e "${front_matter}" > "$docs_file"
    log_action "  已创建模板文件: $docs_file"
  fi
else
  log_action "  未找到对应文件: $docs_file"
fi

log_action "特殊文件处理完成。" 