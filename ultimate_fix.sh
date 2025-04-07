#!/bin/bash

# 定义颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}开始终极修复...${NC}"

# 基础目录
BASE_DIR="/Users/dada/Documents/dada_blog"
CONTENT_DIR="$BASE_DIR/content"
ASSETS_DIR="$BASE_DIR/content/assets/images"
PLACEHOLDER_SOURCE="$CONTENT_DIR/placeholder.png"

# 确保占位图存在
if [ ! -f "$PLACEHOLDER_SOURCE" ]; then
    # 创建一个简单的1px透明PNG作为源占位图
    mkdir -p "$(dirname "$PLACEHOLDER_SOURCE")"
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" | base64 -d > "$PLACEHOLDER_SOURCE"
    echo -e "${GREEN}创建了源占位图: $PLACEHOLDER_SOURCE${NC}"
fi

# 确保assets目录存在
mkdir -p "$ASSETS_DIR"

# 计数器
total_created=0
total_fixed=0

# 定义处理图片的函数
create_placeholder() {
    local img_path="$1"
    local output_path="$2"
    local dir_name=$(dirname "$output_path")
    
    # 创建目录（如果不存在）
    if [ ! -d "$dir_name" ]; then
        mkdir -p "$dir_name"
        echo "创建目录: $dir_name"
    fi
    
    # 复制占位图片
    if [ ! -f "$output_path" ]; then
        cp "$PLACEHOLDER_SOURCE" "$output_path" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}创建占位图片: $output_path${NC}"
            total_created=$((total_created+1))
            return 0
        else
            echo -e "${RED}创建占位图片失败: $output_path${NC}"
            return 1
        fi
    else
        echo "图片已存在: $output_path"
        return 0
    fi
}

# 第一步：修复文件中的路径引用
for md_file in $(find "$CONTENT_DIR/posts" -name "*.md" -type f); do
    filename=$(basename "$md_file" .md)
    category=$(echo "$md_file" | sed -E 's|.*/content/posts/([^/]+)/.*|\1|')
    
    # 从Markdown文件中提取图片引用
    img_refs=$(grep -o '!\[[^]]*\]([^)]*)' "$md_file" | sed -E 's/!\[[^]]*\]\(([^)]+)\)/\1/g')
    
    for img_ref in $img_refs; do
        # 跳过外部链接
        if [[ $img_ref == http* ]]; then
            continue
        fi
        
        # 确定图片的新路径
        if [[ $img_ref == "/content/"* ]]; then
            img_name=$(basename "$img_ref")
            new_ref="/content/assets/images/$category/$filename/$img_name"
            
            # 修改引用
            sed -i '' "s|$img_ref|$new_ref|g" "$md_file"
            echo "修复引用 $img_ref -> $new_ref 在 $md_file"
            total_fixed=$((total_fixed+1))
            
            # 创建对应的占位图
            target_path="$BASE_DIR${new_ref#/content}"
            create_placeholder "$img_ref" "$target_path"
        fi
    done
done

# 第二步：为检查脚本找到的缺失图片创建占位图片
missing_images=$(./check_image_references.sh | grep "引用了不存在的图片" | sed -E 's/.*引用了不存在的图片: (\/content\/[^[:space:]]+).*/\1/g')

while IFS= read -r img_path; do
    if [ -n "$img_path" ]; then
        # 提取文件路径，去掉/content前缀
        target_path="$BASE_DIR${img_path#/content}"
        create_placeholder "$img_path" "$target_path"
    fi
done <<< "$missing_images"

echo "完成!"
echo -e "${GREEN}共创建了 $total_created 个占位图片${NC}"
echo -e "${GREEN}共修复了 $total_fixed 个图片引用路径${NC}"

echo "请运行 ./check_image_references.sh 检查结果" 