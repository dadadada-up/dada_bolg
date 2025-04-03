#!/bin/bash

# 脚本用于修复Markdown文件的命名和Front Matter
# 1. 从Front Matter中提取date，更新文件名
# 2. 根据内容和路径分析，添加合适的categories
# 3. 添加适当的tags

function get_category_from_path() {
  local file_path=$1
  
  if [[ $file_path == */product-management/* ]]; then
    echo "产品管理"
  elif [[ $file_path == */tech-tools/* ]]; then
    echo "技术工具"
  elif [[ $file_path == */finance/* ]]; then
    echo "财务金融"
  elif [[ $file_path == */insurance/agriculture-insurance/* ]]; then
    echo "保险,农业保险"
  elif [[ $file_path == */insurance/* ]]; then
    echo "保险"
  elif [[ $file_path == */family-life/travel/* ]]; then
    echo "家庭生活,旅行"
  elif [[ $file_path == */family-life/* ]]; then
    echo "家庭生活"
  elif [[ $file_path == */personal-blog/* ]]; then
    echo "个人博客"
  elif [[ $file_path == */open-source/* ]]; then
    echo "开源项目"
  else
    echo "未分类"
  fi
}

function generate_tags() {
  local file_path=$1
  local title=$2
  local file_content=$3
  
  # 基于文件名和内容生成tags
  tags=()
  
  # 从文件名和标题提取关键词
  keywords=$(echo "$title" | tr ' ' '\n' | grep -v '^$')
  
  # 根据路径添加基本标签
  if [[ $file_path == */product-management/* ]]; then
    tags+=("产品管理")
    if grep -q -i "需求" <<< "$file_content"; then
      tags+=("需求分析")
    fi
    if grep -q -i "架构" <<< "$file_content"; then
      tags+=("产品架构")
    fi
    if grep -q -i "体验" <<< "$file_content"; then
      tags+=("用户体验")
    fi
  elif [[ $file_path == */tech-tools/* ]]; then
    tags+=("技术")
    if grep -q -i "cursor" <<< "$title$file_content"; then
      tags+=("Cursor")
    fi
    if grep -q -i "notion" <<< "$title$file_content"; then
      tags+=("Notion")
    fi
    if grep -q -i "github" <<< "$title$file_content"; then
      tags+=("GitHub")
    fi
    if grep -q -i "deepseek" <<< "$title$file_content"; then
      tags+=("DeepSeek")
    fi
    if grep -q -i "ai" <<< "$title$file_content" || grep -q -i "人工智能" <<< "$file_content"; then
      tags+=("AI")
    fi
  elif [[ $file_path == */finance/* ]]; then
    tags+=("财务")
    if grep -q -i "理财" <<< "$file_content"; then
      tags+=("理财")
    fi
    if grep -q -i "房地产" <<< "$file_content" || grep -q -i "房子" <<< "$file_content"; then
      tags+=("房地产")
    fi
    if grep -q -i "投资" <<< "$file_content"; then
      tags+=("投资")
    fi
  elif [[ $file_path == */insurance/* ]]; then
    tags+=("保险")
    if [[ $file_path == */agriculture-insurance/* ]] || grep -q -i "农业" <<< "$file_content"; then
      tags+=("农业保险")
    fi
  elif [[ $file_path == */family-life/* ]]; then
    tags+=("生活")
    if [[ $file_path == */travel/* ]] || grep -q -i "旅行" <<< "$file_content" || grep -q -i "出行" <<< "$file_content"; then
      tags+=("旅行")
      
      # 检测城市
      if grep -q -i "杭州" <<< "$title$file_content"; then
        tags+=("杭州")
      fi
      if grep -q -i "泉州" <<< "$title$file_content"; then
        tags+=("泉州")
      fi
    fi
  elif [[ $file_path == */personal-blog/* ]]; then
    tags+=("博客")
    if grep -q -i "需求" <<< "$file_content"; then
      tags+=("需求文档")
    fi
  elif [[ $file_path == */open-source/* ]]; then
    tags+=("开源")
    if grep -q -i "dingtalk" <<< "$title$file_content" || grep -q -i "钉钉" <<< "$file_content"; then
      tags+=("钉钉")
    fi
  fi
  
  # 返回唯一的标签列表
  echo $(printf "%s\n" "${tags[@]}" | sort -u | tr '\n' ',' | sed 's/,$//')
}

function process_file() {
  local file=$1
  echo "处理文件: $file"
  
  # 检查文件是否有Front Matter
  if ! grep -q "^---" "$file"; then
    echo "  跳过 - 没有Front Matter"
    return
  fi
  
  # 获取文件内容
  file_content=$(cat "$file")
  
  # 提取Front Matter中的日期
  date_line=$(grep -m 1 "^date:" "$file" || echo "")
  title_line=$(grep -m 1 "^title:" "$file" || echo "")
  
  # 如果没有日期，跳过文件
  if [ -z "$date_line" ]; then
    echo "  跳过 - 没有日期字段"
    return
  fi
  
  # 提取日期
  file_date=$(echo "$date_line" | sed -E 's/^date: *//;s/['"'"'"]//g')
  
  # 转换日期格式为YYYY-MM-DD
  formatted_date=$(echo "$file_date" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')
  if [ -z "$formatted_date" ]; then
    # 尝试将其他格式转换为YYYY-MM-DD
    if [[ $file_date =~ ^[0-9]{4}/[0-9]{2}/[0-9]{2} ]]; then
      formatted_date=$(echo "$file_date" | sed 's|/|-|g' | cut -d' ' -f1)
    elif [[ $file_date =~ ^[0-9]{4}\.[0-9]{2}\.[0-9]{2} ]]; then
      formatted_date=$(echo "$file_date" | sed 's|\.|-|g' | cut -d' ' -f1)
    else
      # 如果无法解析日期，使用今天的日期
      formatted_date=$(date +%Y-%m-%d)
    fi
  fi
  
  # 提取标题
  file_title=$(echo "$title_line" | sed -E 's/^title: *//;s/^["'"'"']//;s/["'"'"']$//')
  
  # 当前文件名的基本部分(不包括扩展名和日期)
  current_basename=$(basename "$file" .md)
  current_basename_no_date=$(echo "$current_basename" | sed -E 's/^[0-9]{4}-[0-9]{2}-[0-9]{2}-//')
  
  # 目标目录
  target_dir=$(dirname "$file")
  
  # 新文件名
  new_basename="${formatted_date}-${current_basename_no_date}.md"
  new_file="${target_dir}/${new_basename}"
  
  # 如果文件名需要更改，重命名文件
  if [ "$file" != "$new_file" ]; then
    echo "  更新文件名: $(basename "$file") -> ${new_basename}"
    mv "$file" "$new_file"
    file="$new_file"
  fi
  
  # 获取文件内容，准备修改categories和tags
  file_content=$(cat "$file")
  
  # 基于路径生成合适的分类
  path_category=$(get_category_from_path "$file")
  
  # 生成合适的标签
  auto_tags=$(generate_tags "$file" "$file_title" "$file_content")
  
  # 根据文件内容和Front Matter格式，修改categories和tags
  if grep -q "categories: \[.*\]" "$file"; then
    # 方括号格式的categories
    if grep -q "categories: \[\]" "$file" || grep -q "categories: \[未分类\]" "$file"; then
      # 空categories或未分类，替换为新的分类
      categories_array=$(echo "$path_category" | tr ',' ' ')
      sed -i '' -E "s/categories: \[.*\]/categories: [$categories_array]/" "$file"
      echo "  更新categories: [$categories_array]"
    fi
  elif grep -q "categories:" "$file"; then
    # YAML列表格式的categories
    if ! grep -A1 "categories:" "$file" | tail -n 1 | grep -q "  -"; then
      # 空categories，替换为新的分类
      categories_yaml=""
      IFS=',' read -ra CATS <<< "$path_category"
      for cat in "${CATS[@]}"; do
        categories_yaml="${categories_yaml}  - ${cat}\n"
      done
      # 替换为YAML格式的分类列表
      sed -i '' -E "/^categories:/,/^[a-z]/{/^categories:/b;/^[a-z]/b;d}" "$file"
      sed -i '' -E "s/^categories:/categories:\n${categories_yaml%\\n}/" "$file"
      echo "  更新categories为YAML格式"
    fi
  else
    # 没有categories，添加categories
    categories_array=$(echo "$path_category" | tr ',' ' ')
    sed -i '' -E "/^---/,/^---/{/^---/b;/^---/b;/^date:/a\\
categories: [$categories_array]
}" "$file"
    echo "  添加categories: [$categories_array]"
  fi
  
  # 处理tags
  if grep -q "tags: \[.*\]" "$file"; then
    # 方括号格式的tags
    if grep -q "tags: \[\]" "$file"; then
      # 空tags，替换为新的标签
      tags_array=$(echo "$auto_tags" | tr ',' ' ')
      sed -i '' -E "s/tags: \[.*\]/tags: [$tags_array]/" "$file"
      echo "  更新tags: [$tags_array]"
    fi
  elif grep -q "tags:" "$file"; then
    # YAML列表格式的tags
    if ! grep -A1 "tags:" "$file" | tail -n 1 | grep -q "  -"; then
      # 空tags，替换为新的标签
      tags_yaml=""
      IFS=',' read -ra TAGS <<< "$auto_tags"
      for tag in "${TAGS[@]}"; do
        tags_yaml="${tags_yaml}  - ${tag}\n"
      done
      # 替换为YAML格式的标签列表
      sed -i '' -E "/^tags:/,/^[a-z]/{/^tags:/b;/^[a-z]/b;d}" "$file"
      sed -i '' -E "s/^tags:/tags:\n${tags_yaml%\\n}/" "$file"
      echo "  更新tags为YAML格式"
    fi
  else
    # 没有tags，添加tags
    tags_array=$(echo "$auto_tags" | tr ',' ' ')
    sed -i '' -E "/^---/,/^---/{/^---/b;/^---/b;/^categories:/a\\
tags: [$tags_array]
}" "$file"
    echo "  添加tags: [$tags_array]"
  fi
  
  # 确保published字段存在
  if ! grep -q "published:" "$file"; then
    sed -i '' -E "/^---/,/^---/{/^---/b;/^---/b;/^tags:/a\\
published: true
}" "$file"
    echo "  添加published: true"
  fi
  
  echo "  文件处理完成"
}

# 主程序
echo "开始处理Markdown文件..."

# 处理博客文章
find /Users/dada/Documents/dada_bolg/docs/posts -type f -name "*.md" | while read file; do
  process_file "$file"
done

# 处理草稿文章
find /Users/dada/Documents/dada_bolg/docs/drafts -type f -name "*.md" | while read file; do
  process_file "$file"
done

echo "所有文件处理完成！" 