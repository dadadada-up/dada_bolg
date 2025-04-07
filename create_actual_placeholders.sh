#!/bin/bash

# 设置基础目录和路径
BASE_DIR="/Users/dada/Documents/dada_blog"
POSTS_DIR="$BASE_DIR/content/posts"
ASSETS_DIR="$BASE_DIR/content/assets/images"
PLACEHOLDER_SOURCE="$BASE_DIR/content/placeholder.png"

# 定义颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "开始创建实际的占位图片文件..."

# 检查源占位图片是否存在
if [ ! -f "$PLACEHOLDER_SOURCE" ]; then
    echo -e "${RED}错误：源占位图片不存在: $PLACEHOLDER_SOURCE${NC}"
    echo "创建一个空的占位图片..."
    # 创建一个简单的1px透明PNG作为占位图
    mkdir -p "$(dirname "$PLACEHOLDER_SOURCE")"
    convert -size 1x1 xc:transparent "$PLACEHOLDER_SOURCE" 2>/dev/null || touch "$PLACEHOLDER_SOURCE"
    echo -e "${GREEN}创建了占位图片: $PLACEHOLDER_SOURCE${NC}"
fi

# 初始化计数器
total_created=0
total_failed=0

# 递归遍历所有Markdown文件
find "$POSTS_DIR" -name "*.md" | while read -r md_file; do
    echo "处理文件: $md_file"
    
    # 从文件名提取目录名
    filename=$(basename "$md_file" .md)
    category=$(echo "$md_file" | sed -E "s|$POSTS_DIR/([^/]+)/.*|\1|")
    
    # 提取所有图片引用
    grep -o '!\[.*\]([^)]\+)' "$md_file" | sed -E 's/!\[.*\]\(([^)]+)\)/\1/g' | while read -r img_path; do
        # 如果包含占位图片路径
        if [[ $img_path == *"/content/assets/images/posts/"* ]]; then
            # 提取完整路径（去掉/content前缀）
            relative_path="${img_path#/content}"
            target_path="$BASE_DIR$relative_path"
            
            # 确保目标目录存在
            target_dir=$(dirname "$target_path")
            if [ ! -d "$target_dir" ]; then
                mkdir -p "$target_dir"
                echo "创建目录: $target_dir"
            fi
            
            # 复制占位图片
            if [ ! -f "$target_path" ]; then
                cp "$PLACEHOLDER_SOURCE" "$target_path" 2>/dev/null
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}创建占位图片: $target_path${NC}"
                    total_created=$((total_created+1))
                else
                    echo -e "${RED}创建占位图片失败: $target_path${NC}"
                    total_failed=$((total_failed+1))
                fi
            fi
        fi
    done
done

# 使用子shell保留变量值
TOTAL_CREATED=$total_created
TOTAL_FAILED=$total_failed

echo "完成!"
echo -e "${GREEN}共创建了 $TOTAL_CREATED 个占位图片${NC}"
if [ $TOTAL_FAILED -gt 0 ]; then
    echo -e "${RED}有 $TOTAL_FAILED 个占位图片创建失败${NC}"
fi

echo "请运行 ./check_image_references.sh 检查结果" 