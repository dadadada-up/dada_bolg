#!/bin/bash

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 系统命令
FIND="/usr/bin/find"
DIRNAME="/usr/bin/dirname"
BASENAME="/usr/bin/basename"
XARGS="/usr/bin/xargs"
GREP="/usr/bin/grep"
SED="/usr/bin/sed"
MKDIR="/bin/mkdir"
TOUCH="/usr/bin/touch"
MKTEMP="/usr/bin/mktemp"
MV="/bin/mv"
ECHO="/bin/echo"

# 基础目录
BASE_DIR="."
POSTS_DIR="$BASE_DIR/content/posts"
IMAGES_DIR="$BASE_DIR/content/assets/images"

# 遍历所有markdown文件
$FIND "$POSTS_DIR" -type f -name "*.md" | while read -r file; do
    $ECHO -e "${YELLOW}处理文件: $file${NC}"
    
    # 获取文章所属分类（目录名）
    category=$($DIRNAME "$file" | $XARGS $BASENAME)
    
    # 获取文章文件名（不含扩展名）
    filename=$($BASENAME "$file" .md)
    
    # 创建图片目录
    img_dir="$IMAGES_DIR/$category/$filename"
    $MKDIR -p "$img_dir"
    
    # 创建占位图片
    $TOUCH "$img_dir/placeholder.png"
    
    # 临时文件
    temp_file=$($MKTEMP)
    
    # 修复图片引用
    while IFS= read -r line; do
        if $ECHO "$line" | $GREP -q "!\[.*\](/assets/images/[^)]*)" ; then
            # 提取图片名
            img_name=$($ECHO "$line" | $GREP -o '/assets/images/[^)]*' | $XARGS $BASENAME)
            # 替换为新路径
            new_line=$($ECHO "$line" | $SED "s|/assets/images/[^)]*|/content/assets/images/$category/$filename/$img_name|g")
            $ECHO "$new_line" >> "$temp_file"
        else
            $ECHO "$line" >> "$temp_file"
        fi
    done < "$file"
    
    # 替换原文件
    $MV "$temp_file" "$file"
    
    $ECHO -e "${GREEN}完成处理: $file${NC}"
done

$ECHO -e "${GREEN}所有文件处理完成${NC}" 