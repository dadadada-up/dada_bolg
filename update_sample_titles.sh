#!/bin/bash

# 设置日志文件
LOG_FILE="update_sample_titles_log.txt"
echo "开始更新示例文件标题 $(date)" > $LOG_FILE

# 日志函数
log_action() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> $LOG_FILE
  echo "$1"
}

log_action "开始更新文件标题..."

# 更新示例文件标题
update_title() {
  file=$1
  new_title=$2
  
  if [ -f "$file" ]; then
    # 备份原文件
    cp "$file" "${file}.bak"
    
    # 更新标题
    sed -i '' "s/^title:.*$/title: \"$new_title\"/" "$file"
    
    if [ $? -eq 0 ]; then
      log_action "已更新标题: $file -> \"$new_title\""
    else
      log_action "标题更新失败: $file"
      # 恢复备份
      mv "${file}.bak" "$file"
    fi
  else
    log_action "文件不存在: $file"
  fi
}

# 更新具体文件的标题
update_title "docs/posts/personal-blog/2024-03-20-personal-blog-requirements.md" "个人博客项目需求说明书"
update_title "docs/posts/open-source/2024-03-18-dingtalk-monitor-enterprise.md" "钉钉监控：企业级应用实践"
update_title "docs/posts/finance/2024-10-29-real-estate-series.md" "房地产系列分析"
update_title "docs/posts/tech-tools/2025-04-03-vscode-drawio-usage.md" "VSCode绘图插件使用指南"
update_title "docs/posts/insurance/2024-03-18-agriculture-insurance-research.md" "农业保险研究报告"

log_action "标题更新完成"

# 清理备份文件
find docs -name "*.bak" -delete
log_action "已清理备份文件"

# 运行重命名脚本
if [ -f "./rename_to_chinese.sh" ]; then
  log_action "运行文件名转换脚本..."
  chmod +x rename_to_chinese.sh
  ./rename_to_chinese.sh
  log_action "文件名转换完成"
fi

echo "所有操作已完成并记录到 $LOG_FILE" 