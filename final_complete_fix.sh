#!/bin/bash

# 定义颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}开始创建最终的占位图片...${NC}"

# 基础目录
BASE_DIR="/Users/dada/Documents/dada_blog"
PLACEHOLDER_SOURCE="$BASE_DIR/content/placeholder.png"

# 确保占位图存在
if [ ! -f "$PLACEHOLDER_SOURCE" ]; then
    # 创建一个简单的1px透明PNG作为源占位图
    mkdir -p "$(dirname "$PLACEHOLDER_SOURCE")"
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" | base64 -d > "$PLACEHOLDER_SOURCE"
    echo -e "${GREEN}创建了源占位图: $PLACEHOLDER_SOURCE${NC}"
fi

# 计数器
total_created=0
total_fixed=0

# 从检查脚本的输出中提取所有丢失的图片路径
missing_images=$(./check_image_references.sh | grep "引用了不存在的图片" | sed -E 's/.*引用了不存在的图片: (\/content\/assets\/images\/posts\/[^[:space:]]+).*/\1/g')

# 处理每个缺失的图片路径
while IFS= read -r img_path; do
    if [ -n "$img_path" ]; then
        # 去掉/content前缀
        rel_path="${img_path#/content}"
        full_path="$BASE_DIR$rel_path"
        
        # 确保目标目录存在
        target_dir=$(dirname "$full_path")
        if [ ! -d "$target_dir" ]; then
            mkdir -p "$target_dir"
            echo "创建目录: $target_dir"
        fi
        
        # 复制占位图片
        if [ ! -f "$full_path" ]; then
            cp "$PLACEHOLDER_SOURCE" "$full_path" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}创建占位图片: $full_path${NC}"
                ((total_created++))
            else
                echo -e "${RED}创建占位图片失败: $full_path${NC}"
            fi
        else
            echo "图片已存在: $full_path"
        fi
    fi
done <<< "$missing_images"

# 修复图片链接路径问题 - 通过搜索不包含"/posts/"的图片引用
for file in $(find "$BASE_DIR/content/posts" -name "*.md" -type f); do
    # 先获取文件名（不包括路径和扩展名）
    filename=$(basename "$file" .md)
    # 获取文件所在目录类别
    category=$(echo "$file" | sed -E 's|.*/content/posts/([^/]+)/.*|\1|')
    
    # 查找文章中引用的图片，修改不正确的路径格式
    modified=false
    
    # 查找不包含"/posts/"的图片引用
    while IFS= read -r line; do
        # 提取图片路径
        img_paths=$(echo "$line" | grep -oE '!\[[^]]*\]\([^)]+\)' | sed -E 's/!\[[^]]*\]\(([^)]+)\)/\1/g')
        
        for img_path in $img_paths; do
            # 跳过外部链接和已经包含/posts/的路径
            if [[ $img_path == http* || $img_path == *"/posts/"* ]]; then
                continue
            fi
            
            # 修复路径为正确格式: /content/assets/images/posts/category/filename/imagename
            if [[ $img_path == "/content/assets/images/"* ]]; then
                # 提取图片名称
                img_name=$(basename "$img_path")
                # 构建新路径
                new_path="/content/assets/images/posts/$category/$filename/$img_name"
                
                # 替换文件中的路径
                sed -i '' "s|$img_path|$new_path|g" "$file"
                
                # 确保新图片目录存在
                new_dir="$BASE_DIR/assets/images/posts/$category/$filename"
                if [ ! -d "$new_dir" ]; then
                    mkdir -p "$new_dir"
                    echo "创建目录: $new_dir"
                fi
                
                # 复制占位图到新位置
                new_full_path="$BASE_DIR${new_path#/content}"
                if [ ! -f "$new_full_path" ]; then
                    cp "$PLACEHOLDER_SOURCE" "$new_full_path" 2>/dev/null
                    if [ $? -eq 0 ]; then
                        echo -e "${GREEN}创建占位图片: $new_full_path${NC}"
                        ((total_created++))
                    else
                        echo -e "${RED}创建占位图片失败: $new_full_path${NC}"
                    fi
                fi
                
                ((total_fixed++))
                modified=true
            fi
        done
    done < "$file"
    
    if $modified; then
        echo "已修复文件中的图片引用: $file"
    fi
done

echo "完成!"
echo -e "${GREEN}共创建了 $total_created 个占位图片${NC}"
echo -e "${GREEN}共修复了 $total_fixed 个图片引用路径${NC}"

echo "请运行 ./check_image_references.sh 检查结果" 