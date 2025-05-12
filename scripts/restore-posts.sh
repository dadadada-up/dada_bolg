#!/bin/bash

# 设置错误时退出
set -e

# 创建必要的目录
mkdir -p blog-app/content/posts/{family-life/travel,finance,insurance/agriculture-insurance,open-source,product-management,reading,tech-tools}

# 从 Git 历史中恢复文章
echo "正在从 Git 历史恢复文章..."
for file in \
  "docs/posts/family-life/travel/2024-01-01-hangzhou-2024-new-year-plan.md" \
  "docs/posts/family-life/travel/2024-03-20-hangzhou-weekend-trip-plan.md" \
  "docs/posts/finance/2025-02-09-hkd-us-bonds-study.md" \
  "docs/posts/insurance/agriculture-insurance/2024-01-10-farmer-insurance-analysis.md" \
  "docs/posts/insurance/agriculture-insurance/2025-03-18-agriculture-insurance-document.md" \
  "docs/posts/open-source/2025-04-03-dingtalk-message-monitor.md" \
  "docs/posts/product-management/2024-10-28-trading-product-manager.md" \
  "docs/posts/product-management/2024-10-30-product-management-document.md" \
  "docs/posts/product-management/2024-12-30-alipay-health-module-experience.md" \
  "docs/posts/product-management/2025-01-15-product-management-document.md" \
  "docs/posts/product-management/2025-02-06-brd-business-requirements-template.md" \
  "docs/posts/tech-tools/2025-01-01-Asset-Tracker.md" \
  "docs/posts/tech-tools/2025-01-01-tech-tools-document.md" \
  "docs/posts/tech-tools/2025-01-07-Cursor-rules.md" \
  "docs/posts/tech-tools/2025-01-07-Sublime-Text.md" \
  "docs/posts/tech-tools/2025-01-24-notion+cursor.md" \
  "docs/posts/tech-tools/2025-02-05-asset.md" \
  "docs/posts/tech-tools/2025-02-05-Notion-API.md" \
  "docs/posts/tech-tools/2025-02-06-macos-docker-installation-guide.md" \
  "docs/posts/tech-tools/2025-02-10-cursor-full-usage.md" \
  "docs/posts/tech-tools/2025-02-10-deepseek.md" \
  "docs/posts/tech-tools/2025-02-16-tech-tools-document.md"
do
  echo "恢复文件: $file"
  git checkout HEAD -- "$file" || echo "警告: 无法恢复 $file"
done

# 移动文件到正确的位置
echo "正在移动文件到 blog-app/content/posts 目录..."
for file in docs/posts/**/*.md; do
  if [ -f "$file" ]; then
    target_file="blog-app/content/posts/${file#docs/posts/}"
    target_dir=$(dirname "$target_file")
    mkdir -p "$target_dir"
    echo "移动: $file -> $target_file"
    mv "$file" "$target_file"
  fi
done

# 删除空目录
echo "清理空目录..."
rm -rf docs/posts

echo "恢复完成！" 