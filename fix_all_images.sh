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

echo "开始修复所有图片引用问题..."

# 创建占位图片如果不存在
if [ ! -f "$PLACEHOLDER_SOURCE" ]; then
    echo "创建源占位图片..."
    mkdir -p "$(dirname "$PLACEHOLDER_SOURCE")"
    touch "$PLACEHOLDER_SOURCE"
    echo -e "${GREEN}创建了源占位图片: $PLACEHOLDER_SOURCE${NC}"
fi

# 变量初始化
total_fixed=0

# 查找所有Markdown文件中的图片引用并修复
find "$POSTS_DIR" -name "*.md" | while read -r file; do
    echo "处理文件: $file"
    
    # 提取文章类别和名称
    category=$(echo "$file" | sed -E "s|$POSTS_DIR/([^/]+)/.*|\1|")
    file_name=$(basename "$file" .md)
    
    # 创建临时文件
    temp_file="${file}.temp"
    
    # 处理引用中的posts/posts路径问题
    sed 's|/content/assets/images/posts/posts/|/content/assets/images/posts/|g' "$file" > "$temp_file"
    mv "$temp_file" "$file"
    
    # 查找所有图片引用
    img_refs=$(grep -o '!\[.*\](.*)\|!\[.*\](\S*)' "$file" | sed -E 's/!\[.*\]\(([^)]+)\)/\1/g')
    
    # 计算引用数量
    ref_count=$(echo "$img_refs" | grep -c "^")
    
    if [ $ref_count -gt 0 ]; then
        echo "发现 $ref_count 个图片引用"
        
        # 遍历每个图片引用
        echo "$img_refs" | while read -r img_path; do
            if [ -n "$img_path" ]; then
                # 处理以/content开头的路径
                if [[ "$img_path" == /content/* ]]; then
                    # 去掉/content前缀
                    rel_path="${img_path#/content}"
                    full_path="$BASE_DIR$rel_path"
                    
                    # 检查目标图片是否存在
                    if [ ! -f "$full_path" ]; then
                        # 确定图片目录
                        img_dir=$(dirname "$full_path")
                        
                        # 创建目录如果不存在
                        if [ ! -d "$img_dir" ]; then
                            mkdir -p "$img_dir"
                            echo "创建目录: $img_dir"
                        fi
                        
                        # 复制占位图片
                        cp "$PLACEHOLDER_SOURCE" "$full_path"
                        if [ $? -eq 0 ]; then
                            echo -e "${GREEN}创建占位图片: $full_path${NC}"
                            total_fixed=$((total_fixed + 1))
                        else
                            echo -e "${RED}创建占位图片失败: $full_path${NC}"
                        fi
                    else
                        echo "图片已存在: $full_path"
                    fi
                fi
            fi
        done
    fi
done

echo "完成!"
echo -e "${GREEN}共创建了 $total_fixed 个占位图片${NC}"
echo "请运行 ./check_image_references.sh 检查结果" 