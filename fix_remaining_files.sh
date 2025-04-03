#!/bin/bash

# 设置日志文件
log_file="fix_remaining_files_log.txt"
echo "# 剩余文件修复日志" > "$log_file"
echo "生成时间: $(date '+%Y年 %m月 %d日 %A %H时%M分%S秒 %Z')" >> "$log_file"
echo "" >> "$log_file"

# 记录日志的函数
log() {
  echo "$1" >> "$log_file"
  echo "$1"
}

log "## 开始修复剩余文件名问题"

# 修复中文文件名
log "### 重命名中文文件名"

# 个人博客文件
if [ -f "docs/posts/personal-blog/2024-03-20个人博客项目需求说明书.md" ]; then
  mv "docs/posts/personal-blog/2024-03-20个人博客项目需求说明书.md" "docs/posts/personal-blog/2024-03-20-personal-blog-requirements.md"
  log "已重命名: docs/posts/personal-blog/2024-03-20个人博客项目需求说明书.md -> docs/posts/personal-blog/2024-03-20-personal-blog-requirements.md"
  sed -i '' 's/^title:.*$/title: "personal blog requirements"/' "docs/posts/personal-blog/2024-03-20-personal-blog-requirements.md"
fi

# 钉钉监控
if [ -f "docs/posts/open-source/2025-04-03钉钉消息监控助手.md" ]; then
  mv "docs/posts/open-source/2025-04-03钉钉消息监控助手.md" "docs/posts/open-source/2025-04-03-dingtalk-message-monitor.md"
  log "已重命名: docs/posts/open-source/2025-04-03钉钉消息监控助手.md -> docs/posts/open-source/2025-04-03-dingtalk-message-monitor.md"
  sed -i '' 's/^title:.*$/title: "dingtalk message monitor"/' "docs/posts/open-source/2025-04-03-dingtalk-message-monitor.md"
fi

# 修复dingtalk-monitor打造企业级钉钉监控利器
if [ -f "docs/posts/open-source/2024-03-18-dingtalk-monitor-打造企业级钉钉监控利器.md" ]; then
  mv "docs/posts/open-source/2024-03-18-dingtalk-monitor-打造企业级钉钉监控利器.md" "docs/posts/open-source/2024-03-18-dingtalk-monitor-enterprise.md"
  log "已重命名: docs/posts/open-source/2024-03-18-dingtalk-monitor-打造企业级钉钉监控利器.md -> docs/posts/open-source/2024-03-18-dingtalk-monitor-enterprise.md"
  sed -i '' 's/^title:.*$/title: "dingtalk monitor enterprise"/' "docs/posts/open-source/2024-03-18-dingtalk-monitor-enterprise.md"
fi

# 家庭生活
if [ -f "docs/posts/family-life/2025-04-03家庭生活要求文档.md" ]; then
  mv "docs/posts/family-life/2025-04-03家庭生活要求文档.md" "docs/posts/family-life/2025-04-03-family-life-requirements.md"
  log "已重命名: docs/posts/family-life/2025-04-03家庭生活要求文档.md -> docs/posts/family-life/2025-04-03-family-life-requirements.md"
  sed -i '' 's/^title:.*$/title: "family life requirements"/' "docs/posts/family-life/2025-04-03-family-life-requirements.md"
fi

# 杭州周边周末出行
if [ -f "docs/posts/family-life/travel/2024-03-20杭州周边周末出行计划.md" ]; then
  mv "docs/posts/family-life/travel/2024-03-20杭州周边周末出行计划.md" "docs/posts/family-life/travel/2024-03-20-hangzhou-weekend-trip-plan.md"
  log "已重命名: docs/posts/family-life/travel/2024-03-20杭州周边周末出行计划.md -> docs/posts/family-life/travel/2024-03-20-hangzhou-weekend-trip-plan.md"
  sed -i '' 's/^title:.*$/title: "hangzhou weekend trip plan"/' "docs/posts/family-life/travel/2024-03-20-hangzhou-weekend-trip-plan.md"
fi

# 2025清明泉州三日游
if [ -f "docs/posts/family-life/travel/2024-03-20-2025清明泉州三日游详细行程.md" ]; then
  mv "docs/posts/family-life/travel/2024-03-20-2025清明泉州三日游详细行程.md" "docs/posts/family-life/travel/2024-03-20-2025-quanzhou-qingming-trip.md"
  log "已重命名: docs/posts/family-life/travel/2024-03-20-2025清明泉州三日游详细行程.md -> docs/posts/family-life/travel/2024-03-20-2025-quanzhou-qingming-trip.md"
  sed -i '' 's/^title:.*$/title: "2025 quanzhou qingming trip"/' "docs/posts/family-life/travel/2024-03-20-2025-quanzhou-qingming-trip.md"
fi

# 杭州2024元旦走运计划
if [ -f "docs/posts/family-life/travel/2024-01-01-杭州2024年元旦走运计划.md" ]; then
  mv "docs/posts/family-life/travel/2024-01-01-杭州2024年元旦走运计划.md" "docs/posts/family-life/travel/2024-01-01-hangzhou-2024-new-year-plan.md"
  log "已重命名: docs/posts/family-life/travel/2024-01-01-杭州2024年元旦走运计划.md -> docs/posts/family-life/travel/2024-01-01-hangzhou-2024-new-year-plan.md"
  sed -i '' 's/^title:.*$/title: "hangzhou 2024 new year plan"/' "docs/posts/family-life/travel/2024-01-01-hangzhou-2024-new-year-plan.md"
fi

# 未命名文档
for file in $(find docs/posts -name "*未命名文档.md"); do
  dir=$(dirname "$file")
  base=$(basename "$file")
  
  if [[ "$base" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})(.*)$ ]]; then
    date_part="${BASH_REMATCH[1]}"
    new_file="${dir}/${date_part}-unnamed-document.md"
    
    mv "$file" "$new_file"
    log "已重命名: $file -> $new_file"
    sed -i '' 's/^title:.*$/title: "unnamed document"/' "$new_file"
  fi
done

# 处理其他中文文件名
if [ -f "docs/posts/product-management/2024-10-28交易产品经理相关内容.md" ]; then
  mv "docs/posts/product-management/2024-10-28交易产品经理相关内容.md" "docs/posts/product-management/2024-10-28-trading-product-manager.md"
  log "已重命名: docs/posts/product-management/2024-10-28交易产品经理相关内容.md -> docs/posts/product-management/2024-10-28-trading-product-manager.md"
  sed -i '' 's/^title:.*$/title: "trading product manager"/' "docs/posts/product-management/2024-10-28-trading-product-manager.md"
fi

if [ -f "docs/posts/product-management/2024-12-30支付宝医疗健康模块产品体验.md" ]; then
  mv "docs/posts/product-management/2024-12-30支付宝医疗健康模块产品体验.md" "docs/posts/product-management/2024-12-30-alipay-health-module-experience.md"
  log "已重命名: docs/posts/product-management/2024-12-30支付宝医疗健康模块产品体验.md -> docs/posts/product-management/2024-12-30-alipay-health-module-experience.md"
  sed -i '' 's/^title:.*$/title: "alipay health module experience"/' "docs/posts/product-management/2024-12-30-alipay-health-module-experience.md"
fi

if [ -f "docs/posts/finance/2025-02-09港币和美债学习总结.md" ]; then
  mv "docs/posts/finance/2025-02-09港币和美债学习总结.md" "docs/posts/finance/2025-02-09-hkd-us-bonds-study.md"
  log "已重命名: docs/posts/finance/2025-02-09港币和美债学习总结.md -> docs/posts/finance/2025-02-09-hkd-us-bonds-study.md"
  sed -i '' 's/^title:.*$/title: "hkd us bonds study"/' "docs/posts/finance/2025-02-09-hkd-us-bonds-study.md"
fi

if [ -f "docs/posts/finance/2024-10-29-房地产系列.md" ]; then
  mv "docs/posts/finance/2024-10-29-房地产系列.md" "docs/posts/finance/2024-10-29-real-estate-series.md"
  log "已重命名: docs/posts/finance/2024-10-29-房地产系列.md -> docs/posts/finance/2024-10-29-real-estate-series.md"
  sed -i '' 's/^title:.*$/title: "real estate series"/' "docs/posts/finance/2024-10-29-real-estate-series.md"
fi

if [ -f "docs/posts/insurance/2024-03-18农业保险产品研究.md" ]; then
  mv "docs/posts/insurance/2024-03-18农业保险产品研究.md" "docs/posts/insurance/2024-03-18-agriculture-insurance-research.md"
  log "已重命名: docs/posts/insurance/2024-03-18农业保险产品研究.md -> docs/posts/insurance/2024-03-18-agriculture-insurance-research.md"
  sed -i '' 's/^title:.*$/title: "agriculture insurance research"/' "docs/posts/insurance/2024-03-18-agriculture-insurance-research.md"
fi

if [ -f "docs/posts/insurance/agriculture-insurance/2024-01-10农户保险分析文档-保单分层、用户画像与产品关联推荐策略.md" ]; then
  mv "docs/posts/insurance/agriculture-insurance/2024-01-10农户保险分析文档-保单分层、用户画像与产品关联推荐策略.md" "docs/posts/insurance/agriculture-insurance/2024-01-10-farmer-insurance-analysis.md"
  log "已重命名: docs/posts/insurance/agriculture-insurance/2024-01-10农户保险分析文档-保单分层、用户画像与产品关联推荐策略.md -> docs/posts/insurance/agriculture-insurance/2024-01-10-farmer-insurance-analysis.md"
  sed -i '' 's/^title:.*$/title: "farmer insurance analysis"/' "docs/posts/insurance/agriculture-insurance/2024-01-10-farmer-insurance-analysis.md"
fi

# 修复标题不匹配问题
log "### 修复标题不匹配问题"

# 修复技术工具文件标题
fix_tech_tools_titles() {
  # Cursor 介绍
  if [ -f "docs/posts/tech-tools/2024-04-03-Cursor-介绍.md" ]; then
    sed -i '' 's/^title:.*$/title: "Cursor 介绍"/' "docs/posts/tech-tools/2024-04-03-Cursor-介绍.md"
    log "已更新标题: docs/posts/tech-tools/2024-04-03-Cursor-介绍.md -> 'Cursor 介绍'"
  fi
  
  # AI编程-DeepSeek-R1-vs-Claude-3.5-Sonnet
  if [ -f "docs/posts/tech-tools/2025-02-14-AI编程-DeepSeek-R1-vs-Claude-3.5-Sonnet.md" ]; then
    sed -i '' 's/^title:.*$/title: "AI编程 DeepSeek R1 vs Claude 3.5 Sonnet"/' "docs/posts/tech-tools/2025-02-14-AI编程-DeepSeek-R1-vs-Claude-3.5-Sonnet.md"
    log "已更新标题: docs/posts/tech-tools/2025-02-14-AI编程-DeepSeek-R1-vs-Claude-3.5-Sonnet.md -> 'AI编程 DeepSeek R1 vs Claude 3.5 Sonnet'"
  fi
  
  # GitHub Desktop 安装与汉化
  if [ -f "docs/posts/tech-tools/2025-02-07-GitHub-Desktop安装与汉化.md" ]; then
    sed -i '' 's/^title:.*$/title: "GitHub Desktop 安装与汉化"/' "docs/posts/tech-tools/2025-02-07-GitHub-Desktop安装与汉化.md"
    log "已更新标题: docs/posts/tech-tools/2025-02-07-GitHub-Desktop安装与汉化.md -> 'GitHub Desktop 安装与汉化'"
  fi
  
  # Notion API
  if [ -f "docs/posts/tech-tools/2025-02-05-Notion-API.md" ]; then
    sed -i '' 's/^title:.*$/title: "Notion API"/' "docs/posts/tech-tools/2025-02-05-Notion-API.md"
    log "已更新标题: docs/posts/tech-tools/2025-02-05-Notion-API.md -> 'Notion API'"
  fi
  
  # Sublime Text
  if [ -f "docs/posts/tech-tools/2025-01-07-Sublime-Text.md" ]; then
    sed -i '' 's/^title:.*$/title: "Sublime Text"/' "docs/posts/tech-tools/2025-01-07-Sublime-Text.md"
    log "已更新标题: docs/posts/tech-tools/2025-01-07-Sublime-Text.md -> 'Sublime Text'"
  fi
  
  # Asset Tracker
  if [ -f "docs/posts/tech-tools/2025-01-01-Asset-Tracker.md" ]; then
    sed -i '' 's/^title:.*$/title: "Asset Tracker"/' "docs/posts/tech-tools/2025-01-01-Asset-Tracker.md"
    log "已更新标题: docs/posts/tech-tools/2025-01-01-Asset-Tracker.md -> 'Asset Tracker'"
  fi
  
  # VS Code中使用Draw.io完全指南
  if [ -f "docs/posts/tech-tools/2024-03-18-VS-Code中使用Draw.io完全指南.md" ]; then
    sed -i '' 's/^title:.*$/title: "VS Code中使用Draw.io完全指南"/' "docs/posts/tech-tools/2024-03-18-VS-Code中使用Draw.io完全指南.md"
    log "已更新标题: docs/posts/tech-tools/2024-03-18-VS-Code中使用Draw.io完全指南.md -> 'VS Code中使用Draw.io完全指南'"
  fi
  
  # 在 macOS 上轻松部署 Docker 详细安装与配置步骤
  if [ -f "docs/posts/tech-tools/2025-02-06-在-macOS-上轻松部署-Docker-详细安装与配置步骤.md" ]; then
    mv "docs/posts/tech-tools/2025-02-06-在-macOS-上轻松部署-Docker-详细安装与配置步骤.md" "docs/posts/tech-tools/2025-02-06-macos-docker-installation-guide.md"
    sed -i '' 's/^title:.*$/title: "macOS Docker installation guide"/' "docs/posts/tech-tools/2025-02-06-macos-docker-installation-guide.md"
    log "已重命名: docs/posts/tech-tools/2025-02-06-在-macOS-上轻松部署-Docker-详细安装与配置步骤.md -> docs/posts/tech-tools/2025-02-06-macos-docker-installation-guide.md"
  fi
  
  # Cursor 满血使用
  if [ -f "docs/posts/tech-tools/2025-02-10-Cursor-满血使用.md" ]; then
    mv "docs/posts/tech-tools/2025-02-10-Cursor-满血使用.md" "docs/posts/tech-tools/2025-02-10-cursor-full-usage.md"
    sed -i '' 's/^title:.*$/title: "cursor full usage"/' "docs/posts/tech-tools/2025-02-10-cursor-full-usage.md"
    log "已重命名: docs/posts/tech-tools/2025-02-10-Cursor-满血使用.md -> docs/posts/tech-tools/2025-02-10-cursor-full-usage.md"
  fi
  
  # Cursor rules
  if [ -f "docs/posts/tech-tools/2025-01-07-Cursor-rules.md" ]; then
    sed -i '' 's/^title:.*$/title: "Cursor rules"/' "docs/posts/tech-tools/2025-01-07-Cursor-rules.md"
    log "已更新标题: docs/posts/tech-tools/2025-01-07-Cursor-rules.md -> 'Cursor rules'"
  fi
}

# 修复产品管理文件标题
fix_product_titles() {
  # BRD 业务需求文档模板
  if [ -f "docs/posts/product-management/2025-02-06-BRD-业务需求文档模板.md" ]; then
    mv "docs/posts/product-management/2025-02-06-BRD-业务需求文档模板.md" "docs/posts/product-management/2025-02-06-brd-business-requirements-template.md"
    sed -i '' 's/^title:.*$/title: "BRD business requirements template"/' "docs/posts/product-management/2025-02-06-brd-business-requirements-template.md"
    log "已重命名: docs/posts/product-management/2025-02-06-BRD-业务需求文档模板.md -> docs/posts/product-management/2025-02-06-brd-business-requirements-template.md"
  fi
}

# 执行修复
fix_tech_tools_titles
fix_product_titles

# 运行最终检查
log "## 执行最终检查"
./check_filename_format.sh

log "## 文件名修复完成"
log "所有操作都已记录到 $log_file" 