#!/bin/bash

# 设置日志文件
log_file="fix_final_issues_log.txt"
echo "# 最终文件名修复日志" > "$log_file"
echo "生成时间: $(date '+%Y年 %m月 %d日 %A %H时%M分%S秒 %Z')" >> "$log_file"
echo "" >> "$log_file"

# 记录日志的函数
log() {
  echo "$1" >> "$log_file"
  echo "$1"
}

log "## 开始修复最终文件名问题"

# 修复中文文件名，将其转为拼音或英文
fix_chinese_filenames() {
  log "### 修复中文文件名"
  
  # 处理特定的中文文件
  handle_specific_files() {
    # 创建映射关系
    declare -A filename_map
    
    # 按照格式 "原文件名 -> 新文件名" 添加需要重命名的文件
    filename_map["docs/posts/personal-blog/2024-03-20个人博客项目需求说明书.md"]="docs/posts/personal-blog/2024-03-20-personal-blog-requirements.md"
    filename_map["docs/posts/open-source/2025-04-03钉钉消息监控助手.md"]="docs/posts/open-source/2025-04-03-dingtalk-message-monitor.md"
    filename_map["docs/posts/family-life/2025-04-03家庭生活要求文档.md"]="docs/posts/family-life/2025-04-03-family-life-requirements.md"
    filename_map["docs/posts/family-life/travel/2024-03-20杭州周边周末出行计划.md"]="docs/posts/family-life/travel/2024-03-20-hangzhou-weekend-trip-plan.md"
    filename_map["docs/posts/tech-tools/2025-02-16未命名文档.md"]="docs/posts/tech-tools/2025-02-16-unnamed-document.md"
    filename_map["docs/posts/tech-tools/2025-02-20未命名文档.md"]="docs/posts/tech-tools/2025-02-20-unnamed-document.md"
    filename_map["docs/posts/tech-tools/2025-01-08未命名文档.md"]="docs/posts/tech-tools/2025-01-08-unnamed-document.md"
    filename_map["docs/posts/tech-tools/2025-01-01未命名文档.md"]="docs/posts/tech-tools/2025-01-01-unnamed-document.md"
    filename_map["docs/posts/tech-tools/2025-02-27未命名文档.md"]="docs/posts/tech-tools/2025-02-27-unnamed-document.md"
    filename_map["docs/posts/product-management/2025-02-06未命名文档.md"]="docs/posts/product-management/2025-02-06-unnamed-document.md"
    filename_map["docs/posts/product-management/2024-10-30未命名文档.md"]="docs/posts/product-management/2024-10-30-unnamed-document.md"
    filename_map["docs/posts/product-management/2025-01-15未命名文档.md"]="docs/posts/product-management/2025-01-15-unnamed-document.md"
    filename_map["docs/posts/product-management/2024-10-28交易产品经理相关内容.md"]="docs/posts/product-management/2024-10-28-trading-product-manager.md"
    filename_map["docs/posts/product-management/2025-01-06未命名文档.md"]="docs/posts/product-management/2025-01-06-unnamed-document.md"
    filename_map["docs/posts/product-management/2024-12-30支付宝医疗健康模块产品体验.md"]="docs/posts/product-management/2024-12-30-alipay-health-module-experience.md"
    filename_map["docs/posts/finance/2025-02-09港币和美债学习总结.md"]="docs/posts/finance/2025-02-09-hkd-us-bonds-study.md"
    filename_map["docs/posts/finance/2025-03-27未命名文档.md"]="docs/posts/finance/2025-03-27-unnamed-document.md"
    filename_map["docs/posts/finance/2024-10-29-房地产系列.md"]="docs/posts/finance/2024-10-29-real-estate-series.md"
    filename_map["docs/posts/insurance/2024-03-18农业保险产品研究.md"]="docs/posts/insurance/2024-03-18-agriculture-insurance-research.md"
    filename_map["docs/posts/insurance/agriculture-insurance/2025-03-18未命名文档.md"]="docs/posts/insurance/agriculture-insurance/2025-03-18-unnamed-document.md"
    filename_map["docs/posts/insurance/agriculture-insurance/2024-11-01未命名文档.md"]="docs/posts/insurance/agriculture-insurance/2024-11-01-unnamed-document.md"
    filename_map["docs/posts/insurance/agriculture-insurance/2024-10-31未命名文档.md"]="docs/posts/insurance/agriculture-insurance/2024-10-31-unnamed-document.md"
    filename_map["docs/posts/insurance/agriculture-insurance/2024-01-10农户保险分析文档--保单分层、用户画像与产品关联推荐策略.md"]="docs/posts/insurance/agriculture-insurance/2024-01-10-farmer-insurance-analysis.md"
    
    # 遍历映射关系，重命名文件
    for old_file in "${!filename_map[@]}"; do
      new_file="${filename_map[$old_file]}"
      
      if [ -f "$old_file" ]; then
        mv "$old_file" "$new_file"
        log "已重命名中文文件: $old_file -> $new_file"
        
        # 同时更新文件内的Front Matter标题
        base=$(basename "$new_file")
        if [[ "$base" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}-(.*)\.md$ ]]; then
          title_part="${BASH_REMATCH[1]}"
          # 替换连字符为空格
          title=$(echo "$title_part" | sed 's/-/ /g')
          
          # 更新Front Matter标题
          sed -i '' "s/^title:.*$/title: \"$title\"/" "$new_file"
          log "  已更新文件 $new_file 的Front Matter标题为: $title"
        fi
      else
        log "警告: 文件不存在 $old_file"
      fi
    done
  }
  
  handle_specific_files
}

# 修复标题不匹配的问题
fix_title_mismatch() {
  log "### 修复标题不匹配问题"
  
  # 创建标题映射关系
  declare -A title_map
  
  # 按照格式 "文件路径 -> 修正后的Front Matter标题" 添加需要修复的文件
  title_map["docs/posts/open-source/2024-03-18-dingtalk-monitor--打造企业级钉钉监控利器.md"]="dingtalk monitor 打造企业级钉钉监控利器"
  title_map["docs/posts/tech-tools/2024-04-03-Cursor-介绍.md"]="Cursor 介绍"
  title_map["docs/posts/tech-tools/2025-02-14--AI编程--DeepSeek-R1-vs-Claude-3.5-Sonnet.md"]="AI编程 DeepSeek R1 vs Claude 3.5 Sonnet"
  title_map["docs/posts/tech-tools/2025-02-07-GitHub-Desktop安装与汉化.md"]="GitHub Desktop 安装与汉化"
  title_map["docs/posts/tech-tools/2025-02-05-Notion-API.md"]="Notion API"
  title_map["docs/posts/tech-tools/2025-01-07-Sublime-Text.md"]="Sublime Text"
  title_map["docs/posts/tech-tools/2025-01-01-Asset-Tracker.md"]="Asset Tracker"
  title_map["docs/posts/tech-tools/2024-03-18-VS-Code中使用Draw.io完全指南.md"]="VS Code中使用Draw.io完全指南"
  title_map["docs/posts/tech-tools/2025-02-06-在-macOS-上轻松部署-Docker--详细安装与配置步骤.md"]="在 macOS 上轻松部署 Docker 详细安装与配置步骤"
  title_map["docs/posts/tech-tools/2025-02-10-Cursor-满血使用.md"]="Cursor 满血使用"
  title_map["docs/posts/tech-tools/2025-01-07-Cursor-rules.md"]="Cursor rules"
  title_map["docs/posts/product-management/2025-02-06-BRD-业务需求文档模板.md"]="BRD 业务需求文档模板"
  
  # 遍历标题映射关系，更新标题
  for file in "${!title_map[@]}"; do
    title="${title_map[$file]}"
    
    if [ -f "$file" ]; then
      # 更新Front Matter标题
      sed -i '' "s/^title:.*$/title: \"$title\"/" "$file"
      log "已更新文件 $file 的Front Matter标题为: $title"
      
      # 重命名文件以匹配标题
      dir=$(dirname "$file")
      base=$(basename "$file")
      date_part=${base:0:11}  # 提取日期和连字符
      
      # 准备新文件名
      new_title=$(echo "$title" | tr -d ',:?![]{}()<>|;&*~`#$^' | sed 's/ /-/g' | sed 's/---/-/g' | sed 's/--/-/g')
      new_filename="${date_part}${new_title}.md"
      new_path="$dir/$new_filename"
      
      # 重命名文件
      if [ "$file" != "$new_path" ]; then
        mv "$file" "$new_path"
        log "已重命名: $file -> $new_path"
      fi
    else
      log "警告: 文件不存在 $file"
    fi
  done
}

# 清理后缀和格式
cleanup() {
  # 修复可能的double dash
  find docs/posts -type f -name "*--*" | while read -r file; do
    new_file=$(echo "$file" | sed 's/--/-/g')
    if [ "$file" != "$new_file" ]; then
      mv "$file" "$new_file"
      log "已修复double dash: $file -> $new_file"
    fi
  done
  
  # 修复可能的多重后缀
  find docs/posts -type f -name "*.md.md" | while read -r file; do
    new_file=$(echo "$file" | sed 's/\.md\.md$/.md/')
    if [ "$file" != "$new_file" ]; then
      mv "$file" "$new_file"
      log "已修复多重后缀: $file -> $new_file"
    fi
  done
}

# 主程序
fix_chinese_filenames
fix_title_mismatch
cleanup

# 运行最终检查
log "## 执行最终检查"
./check_filename_format.sh

log "## 最终文件名修复完成"
log "所有操作都已记录到 $log_file" 