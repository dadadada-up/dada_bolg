#!/bin/bash

echo "开始创建缺失的图片目录..."

# 基础目录
base_dir="/Users/dada/Documents/dada_blog/content/assets/images/posts"

# 确保基础目录存在
mkdir -p "$base_dir"

# 创建主要类别目录
categories=("finance" "insurance" "product-management" "reading" "tech-tools" "open-source")

for category in "${categories[@]}"; do
  mkdir -p "$base_dir/$category"
  echo "创建目录: $base_dir/$category"
done

# 创建特定的文章图片目录 - 针对finance分类
finance_posts=(
  "2024-10-29-房地产系列"
  "房地产系列"
  "一文详解房地产投资"
  "投资基金的常见费用"
  "《投资第一课》学习笔记"
)

for post in "${finance_posts[@]}"; do
  mkdir -p "$base_dir/finance/$post"
  # 创建示例图片文件
  touch "$base_dir/finance/$post/placeholder.png"
  echo "创建目录: $base_dir/finance/$post (带示例图片)"
done

# 创建特定的文章图片目录 - 针对insurance分类
insurance_posts=(
  "「再保险」平台"
  "一文读懂保险核心系统"
  "一文读懂保险销售渠道"
  "保险条文是如何开发出来的？"
)

for post in "${insurance_posts[@]}"; do
  mkdir -p "$base_dir/insurance/$post"
  # 创建示例图片文件
  touch "$base_dir/insurance/$post/placeholder.png"
  echo "创建目录: $base_dir/insurance/$post (带示例图片)"
done

# 创建特定的文章图片目录 - 针对product-management分类
pm_posts=(
  "PMF"
  "PRD模版"
  "黄金"
  "从小青龙3号解析保险产品模型"
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
  "规则引擎——产品设计高阶思维"
  "产品经理基础篇：如何做用户需求分析？"
  "产品经理入门篇：什么是产品经理，相关角色有哪些？"
  "《供给侧改革背景下中国多层次农业保险产品结构研究》读书笔记"
)

for post in "${pm_posts[@]}"; do
  mkdir -p "$base_dir/product-management/$post"
  # 创建示例图片文件
  touch "$base_dir/product-management/$post/placeholder.png"
  echo "创建目录: $base_dir/product-management/$post (带示例图片)"
done

# 创建特定的文章图片目录 - 针对reading分类
reading_posts=(
  "《小狗钱钱》读后感"
  "《精力管理》读后感"
  "《大国经济学》读书感"
)

for post in "${reading_posts[@]}"; do
  mkdir -p "$base_dir/reading/$post"
  # 创建示例图片文件
  touch "$base_dir/reading/$post/placeholder.png"
  echo "创建目录: $base_dir/reading/$post (带示例图片)"
done

# 创建特定的文章图片目录 - 针对tech-tools分类
tech_posts=(
  "2024-03-18-vscodedrawio"
  "2025-04-03-vscode-drawio-usage"
)

for post in "${tech_posts[@]}"; do
  mkdir -p "$base_dir/tech-tools/$post"
  # 创建示例图片文件
  touch "$base_dir/tech-tools/$post/your-diagram.drawio.svg"
  echo "创建目录: $base_dir/tech-tools/$post (带SVG图片)"
done

echo "目录创建完成。"
echo "现在运行新的图片修复脚本，将图片引用指向这些新的占位图..." 