#!/bin/bash

echo "创建posts子目录结构..."

# 主目录
base_dir="/Users/dada/Documents/dada_blog/content/assets/images/posts/posts"

# 确保目录存在
mkdir -p "$base_dir"

# 创建基本子目录
categories=("finance" "insurance" "product-management" "reading" "tech-tools" "open-source" "family-life")

# 创建每个分类的目录
for category in "${categories[@]}"; do
  mkdir -p "$base_dir/$category"
  echo "创建目录: $base_dir/$category"
done

# 创建各个分类下的目录
finance_posts=(
  "一文详解房地产投资"
  "港币购买美债学习"
  "《投资第一课》学习笔记"
)

for post in "${finance_posts[@]}"; do
  mkdir -p "$base_dir/finance/$post"
  touch "$base_dir/finance/$post/placeholder.png"
  echo "创建目录: $base_dir/finance/$post (带占位图)"
done

insurance_posts=(
  "融资信保"
  "农业保险研究报告"
  "一文读懂保险销售渠道"
  "一文读懂保险核心系统"
  "「再保险」平台"
  "保险条文是如何开发出来的？"
)

for post in "${insurance_posts[@]}"; do
  mkdir -p "$base_dir/insurance/$post"
  touch "$base_dir/insurance/$post/placeholder.png"
  echo "创建目录: $base_dir/insurance/$post (带占位图)"
done

pm_posts=(
  "PMF"
  "PRD模版"
  "黄金"
  "保全系统建设"
  "保险产品分类"
  "如何理解中台？"
  "知识管理的认知"
  "产品生命周期理论"
  "港币购买美债学习"
  "竞品分析如何写？"
  "支付宝基金产品分析"
  "产品体验分析报告如何写？"
  "支付宝医疗健康模块产品体验"
  "产品经理必备技能：功能和流程"
  "产品经理基础篇：如何做用户需求分析？"
  "产品经理入门篇：什么是产品经理，相关角色有哪些？"
  "《供给侧改革背景下中国多层次农业保险产品结构研究》读书笔记"
)

for post in "${pm_posts[@]}"; do
  mkdir -p "$base_dir/product-management/$post"
  touch "$base_dir/product-management/$post/placeholder.png"
  echo "创建目录: $base_dir/product-management/$post (带占位图)"
done

reading_posts=(
  "《小狗钱钱》读后感"
  "《精力管理》读后感"
  "《大国经济学》读书感"
  "《"新基建"时代农业保险数智化转型》读书笔记"
  "《供给侧改革背景下中国多层次农业保险产品结构研究》读书笔记"
)

for post in "${reading_posts[@]}"; do
  mkdir -p "$base_dir/reading/$post"
  touch "$base_dir/reading/$post/placeholder.png"
  echo "创建目录: $base_dir/reading/$post (带占位图)"
done

tech_posts=(
  "Asset-Tracker"
  "tech-tools-document"
  "VSCode绘图插件使用指南"
  "VS-Code中使用Draw.io完全指南"
)

for post in "${tech_posts[@]}"; do
  mkdir -p "$base_dir/tech-tools/$post"
  touch "$base_dir/tech-tools/$post/placeholder.png"
  echo "创建目录: $base_dir/tech-tools/$post (带占位图)"
done

open_source_posts=(
  "钉钉监控：企业级应用实践"
  "dingtalk-message-monitor"
)

for post in "${open_source_posts[@]}"; do
  mkdir -p "$base_dir/open-source/$post"
  touch "$base_dir/open-source/$post/placeholder.png"
  echo "创建目录: $base_dir/open-source/$post (带占位图)"
done

family_life_posts=(
  "2025泉州清明之旅"
  "hangzhou-2024-new-year-plan"
)

for post in "${family_life_posts[@]}"; do
  mkdir -p "$base_dir/family-life/$post"
  touch "$base_dir/family-life/$post/placeholder.png"
  echo "创建目录: $base_dir/family-life/$post (带占位图)"
done

echo "所有目录和占位图文件已创建完成！" 