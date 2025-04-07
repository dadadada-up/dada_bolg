#!/bin/bash

# 设置日志文件
LOG_FILE="organize_yuque_docs_log.txt"
echo "开始组织语雀文档 $(date)" > $LOG_FILE

# 日志函数
log_action() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> $LOG_FILE
  echo "$1"
}

# 创建必要的目录结构
create_directories() {
  log_action "创建目录结构..."
  
  # 主目录
  mkdir -p docs/posts/product-management
  mkdir -p docs/posts/tech-tools
  mkdir -p docs/posts/finance
  mkdir -p docs/posts/insurance
  mkdir -p docs/posts/insurance/agriculture-insurance
  mkdir -p docs/posts/personal-blog
  mkdir -p docs/posts/open-source
  mkdir -p docs/posts/family-life
  mkdir -p docs/posts/family-life/travel
  mkdir -p docs/posts/reading
  
  # 资源目录
  mkdir -p assets/images/posts/product-management
  mkdir -p assets/images/posts/tech-tools
  mkdir -p assets/images/posts/finance
  mkdir -p assets/images/posts/insurance
  mkdir -p assets/images/posts/insurance/agriculture-insurance
  mkdir -p assets/images/posts/personal-blog
  mkdir -p assets/images/posts/open-source
  mkdir -p assets/images/posts/family-life
  mkdir -p assets/images/posts/family-life/travel
  mkdir -p assets/images/posts/reading
  
  log_action "目录结构创建完成"
}

# 下载图片并更新图片链接
process_images() {
  local file=$1
  local filename=$(basename "$file" .md)
  local category=$2
  local dest_file=$3
  
  # 创建图片目录
  local img_dir="assets/images/posts/$category/$filename"
  mkdir -p "$img_dir"
  
  log_action "处理文件 $file 中的图片..."
  
  # 提取图片链接 - 支持多种图片链接格式
  local img_urls=$(grep -o '!\[.*\](http[s]*://[^)]*' "$file" | sed 's/!\[.*\](\(.*\)/\1/')
  
  # 临时文件
  local temp_file=$(mktemp)
  cat "$file" > "$temp_file"
  
  # 遍历图片链接并下载
  local count=1
  for img_url in $img_urls; do
    local img_ext="${img_url##*.}"
    if [[ "$img_ext" == *"/"* || "$img_ext" == "" ]]; then
      img_ext="jpg"  # 默认扩展名
    fi
    local img_filename="image_${count}.${img_ext}"
    local img_path="$img_dir/$img_filename"
    
    # 创建图片目录（确保递归创建）
    mkdir -p "$(dirname "$img_path")"
    
    # 下载图片，设置超时避免卡住
    curl -s -m 20 "$img_url" -o "$img_path"
    
    if [ -f "$img_path" ] && [ -s "$img_path" ]; then
      log_action "  已下载图片: $img_url -> $img_path"
      
      # 更新图片链接 - 使用变量替换可能更安全
      sed -i "" "s|$img_url|/$img_path|g" "$temp_file"
    else
      log_action "  下载图片失败: $img_url"
      # 为失败的图片创建一个占位符，也将其链接更新
      echo "图片下载失败，原链接：$img_url" > "$img_path"
      sed -i "" "s|$img_url|/$img_path|g" "$temp_file"
    fi
    
    ((count++))
  done
  
  # 将处理后的内容复制到目标文件
  cat "$temp_file" > "$dest_file"
  rm "$temp_file"
  
  log_action "图片处理完成，共处理 $((count-1)) 张图片"
}

# 根据文件名和内容分类文档
categorize_document() {
  local file="$1"
  local filename=$(basename "$file")
  local category=""
  
  # 根据文件名或内容来判断分类
  if [[ "$filename" == *"产品"* || "$filename" == *"需求"* || "$filename" == *"PRD"* || "$filename" == *"BRD"* || "$filename" == *"PM"* ]]; then
    category="product-management"
  elif [[ "$filename" == *"Cursor"* || "$filename" == *"技术"* || "$filename" == *"GitHub"* || "$filename" == *"Docker"* || "$filename" == *"Sublime"* || "$filename" == *"HMW"* ]]; then
    category="tech-tools"
  elif [[ "$filename" == *"金融"* || "$filename" == *"投资"* || "$filename" == *"基金"* || "$filename" == *"房地产"* || "$filename" == *"美债"* ]]; then
    category="finance"
  elif [[ "$filename" == *"保险"* ]]; then
    if [[ "$filename" == *"农业保险"* ]]; then
      category="insurance/agriculture-insurance"
    else
      category="insurance"
    fi
  elif [[ "$filename" == *"博客"* ]]; then
    category="personal-blog"
  elif [[ "$filename" == *"开源"* ]]; then
    category="open-source"
  elif [[ "$filename" == *"家庭"* || "$filename" == *"生活"* ]]; then
    if [[ "$filename" == *"旅行"* || "$filename" == *"旅游"* ]]; then
      category="family-life/travel"
    else
      category="family-life"
    fi
  elif [[ "$filename" == *"读后感"* || "$filename" == *"读书"* || "$filename" == *"《"*"》"* ]]; then
    category="reading"
  else
    # 如果文件名无法判断，则尝试通过内容判断
    if grep -q -i "产品\|需求\|用户\|PRD\|BRD\|PM" "$file"; then
      category="product-management"
    elif grep -q -i "技术\|编程\|代码\|GitHub\|Docker\|Cursor" "$file"; then
      category="tech-tools"
    elif grep -q -i "金融\|投资\|基金\|股票\|房地产" "$file"; then
      category="finance"
    elif grep -q -i "保险" "$file"; then
      if grep -q -i "农业保险" "$file"; then
        category="insurance/agriculture-insurance"
      else
        category="insurance"
      fi
    elif grep -q -i "博客\|网站" "$file"; then
      category="personal-blog"
    elif grep -q -i "开源" "$file"; then
      category="open-source"
    elif grep -q -i "家庭\|生活" "$file"; then
      if grep -q -i "旅行\|旅游" "$file"; then
        category="family-life/travel"
      else
        category="family-life"
      fi
    elif grep -q -i "读后感\|读书" "$file"; then
      category="reading"
    else
      category="tech-tools"  # 默认分类
    fi
  fi
  
  echo "$category"
}

# 生成Front Matter
generate_front_matter() {
  local file="$1"
  local category="$2"
  
  # 尝试从文件内容中提取标题，优先使用Markdown标题
  local title=$(grep -m 1 "^# " "$file" | sed 's/^# //g' | sed 's/<font[^>]*>\(.*\)<\/font>/\1/g' | sed 's/\*\*\(.*\)\*\*/\1/g')
  
  # 如果找不到一级标题，则使用文件名作为标题
  if [ -z "$title" ]; then
    title=$(basename "$file" .md)
  fi
  
  # 清理标题中可能存在的特殊字符
  title=$(echo "$title" | sed 's/"/\\"/g' | tr -d '\r\n')
  
  # 生成当前日期
  local curr_date=$(date +"%Y-%m-%d")
  
  # 生成分类标签
  local tag=""
  case "$category" in
    "product-management") tag="产品管理" ;;
    "tech-tools") tag="技术工具" ;;
    "finance") tag="金融" ;;
    "insurance") tag="保险" ;;
    "insurance/agriculture-insurance") tag="农业保险" ;;
    "personal-blog") tag="个人博客" ;;
    "open-source") tag="开源项目" ;;
    "family-life") tag="家庭生活" ;;
    "family-life/travel") tag="旅行" ;;
    "reading") tag="读书笔记" ;;
    *) tag="技术" ;;
  esac
  
  # 提取文章前150个字符作为描述，跳过标题行和图片
  local description=$(grep -v "^#" "$file" | grep -v "^!" | sed 's/<[^>]*>//g' | tr -d '\r\n' | head -c 150)
  
  # 清理描述中的特殊字符
  description=$(echo "$description" | sed 's/"/\\"/g')
  
  # 构建Front Matter
  local front_matter="---\ntitle: \"$title\"\ndate: \"$curr_date\"\ncategories: \n  - \"$tag\"\ntags:\n  - \"$tag\"\ndescription: \"$description...\"\npublished: true\n---\n\n"
  
  echo -e "$front_matter"
}

# 清理HTML标签和特殊格式
clean_content() {
  local content="$1"
  
  # 清理HTML标签
  content=$(echo "$content" | sed 's/<font[^>]*>//g' | sed 's/<\/font>//g')
  content=$(echo "$content" | sed 's/<[a-zA-Z][^>]*>//g' | sed 's/<\/[a-zA-Z][^>]*>//g')
  
  # 清理一些常见问题文本
  content=$(echo "$content" | sed 's/暂时无法在飞书文档外展示此内容//g')
  content=$(echo "$content" | sed 's/https:\/\/shimo.im\/file-invite\/[^[:space:]]*//g')
  
  # 删除空行
  content=$(echo "$content" | sed '/^[[:space:]]*$/d')
  
  echo "$content"
}

# 处理一个文件
process_file() {
  local file="$1"
  local filename=$(basename "$file")
  local category=$(categorize_document "$file")
  local date_prefix=$(date +"%Y-%m-%d")
  
  log_action "处理文件: $file"
  log_action "  分类为: $category"
  
  # 生成新文件名 - 保留中文
  local new_filename="${date_prefix}-${filename}"
  # 替换特殊字符
  new_filename=$(echo "$new_filename" | sed 's/[[:space:]]\+/-/g' | sed 's/[:<>|*?\\\/]/-/g')
  local new_filepath="docs/posts/$category/$new_filename"
  
  # 生成Front Matter
  local front_matter=$(generate_front_matter "$file" "$category")
  
  # 获取文件内容并清理
  local content=$(cat "$file")
  content=$(clean_content "$content")
  
  # 创建新文件
  echo -e "${front_matter}${content}" > "$new_filepath"
  
  # 处理图片
  process_images "$file" "$category" "$new_filepath"
  
  log_action "  文件已创建: $new_filepath"
  
  echo "$new_filepath"
}

# 主函数
main() {
  # 创建目录结构
  create_directories
  
  # 处理所有语雀导出的Markdown文件
  local yuque_dir="/Users/dada/Documents/dada_blog/语雀"
  local files=$(find "$yuque_dir" -type f -name "*.md")
  local total_files=$(echo "$files" | wc -l)
  local processed=0
  
  log_action "找到 $total_files 个Markdown文件需要处理"
  
  for file in $files; do
    process_file "$file"
    ((processed++))
    log_action "已处理 $processed / $total_files 个文件"
  done
  
  log_action "所有文件处理完成"
  log_action "转换后的文件位于 docs/posts/ 目录"
  log_action "图片资源位于 assets/images/posts/ 目录"
  
  # 运行文件名格式检查
  if [ -f "./check_filename_format.sh" ]; then
    log_action "运行文件名格式检查..."
    chmod +x check_filename_format.sh
    ./check_filename_format.sh
    log_action "检查完成"
  fi
}

# 执行主函数
main 