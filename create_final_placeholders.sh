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

# 直接从检查脚本的输出中提取所有丢失的图片路径
missing_images=$(./check_image_references.sh | grep "引用了不存在的图片" | sed -E 's/.*引用了不存在的图片: (\/content\/[^[:space:]]+).*/\1/g')

# 计数器
total_created=0
total_failed=0

# 处理每个缺失的图片路径
echo "$missing_images" | while read -r img_path; do
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
                total_created=$((total_created+1))
            else
                echo -e "${RED}创建占位图片失败: $full_path${NC}"
                total_failed=$((total_failed+1))
            fi
        else
            echo "图片已存在: $full_path"
        fi
    fi
done

echo "完成!"
echo -e "${GREEN}共创建了 $total_created 个占位图片${NC}"
if [ $total_failed -gt 0 ]; then
    echo -e "${RED}有 $total_failed 个占位图片创建失败${NC}"
fi

echo "请运行 ./check_image_references.sh 检查结果" 