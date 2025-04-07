#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 基础路径设置
BASE_DIR="/Users/dada/Documents/dada_blog"
CONTENT_DIR="$BASE_DIR/content"
POSTS_DIR="$CONTENT_DIR/posts"
ASSETS_DIR="$BASE_DIR/assets/images"
PLACEHOLDER_SOURCE="$CONTENT_DIR/placeholder.png"

echo -e "${BLUE}开始最终修复所有图片引用问题...${NC}"

# 确保源占位图片存在
if [ ! -f "$PLACEHOLDER_SOURCE" ]; then
    echo -e "${YELLOW}源占位图片不存在，尝试创建...${NC}"
    # 尝试使用ImageMagick创建1px透明PNG
    if command -v convert &> /dev/null; then
        convert -size 1x1 xc:transparent "$PLACEHOLDER_SOURCE"
        echo -e "${GREEN}已创建占位图片: $PLACEHOLDER_SOURCE${NC}"
    else
        # 如果ImageMagick不可用，创建一个空文件
        touch "$PLACEHOLDER_SOURCE"
        echo -e "${YELLOW}ImageMagick不可用，创建了空文件作为占位: $PLACEHOLDER_SOURCE${NC}"
    fi
fi

# 确保assets目录存在
mkdir -p "$ASSETS_DIR"

# 初始化计数器
created_count=0
fixed_count=0

# 修复Markdown文件中的图片引用路径
fix_image_paths() {
    echo -e "${BLUE}修复Markdown文件中的图片引用路径...${NC}"
    
    # 查找所有Markdown文件
    find "$POSTS_DIR" -type f -name "*.md" | while read -r md_file; do
        # 获取文件相对路径（从content/posts开始）
        rel_path="${md_file#$POSTS_DIR/}"
        # 获取目录名（不包含.md扩展名）
        dir_name=$(dirname "$rel_path")
        file_name=$(basename "$md_file" .md)
        
        # 修复不包含/assets/images/的路径但包含/content/assets/images/的路径
        if grep -q "/content/assets/images/" "$md_file"; then
            # 替换 /content/assets/images/ 为 /assets/images/
            sed -i '' 's|/content/assets/images/|/assets/images/|g' "$md_file"
            ((fixed_count++))
            echo -e "${GREEN}已修复文件中的图片引用路径: $md_file${NC}"
        fi
    done
}

# 创建占位图片的函数
create_placeholder() {
    local target_dir="$1"
    local target_file="$2"
    
    # 确保目标目录存在
    mkdir -p "$target_dir"
    
    # 如果目标文件不存在，则复制占位图片
    if [ ! -f "$target_file" ]; then
        cp "$PLACEHOLDER_SOURCE" "$target_file"
        ((created_count++))
        echo -e "${GREEN}已创建占位图片: $target_file${NC}"
    else
        echo -e "${YELLOW}占位图片已存在: $target_file${NC}"
    fi
}

# 修复图片路径
fix_image_paths

# 运行检查脚本并收集结果
echo -e "${BLUE}运行检查脚本查找缺失的图片...${NC}"
check_output=$(./check_image_references.sh)

# 从检查脚本输出中提取缺失的图片路径
echo "$check_output" | grep "引用了不存在的图片:" | sed 's/.*引用了不存在的图片: //g' | while read -r path; do
    # 转换路径：从 /content/assets/images/xxx 到 /Users/dada/Documents/dada_blog/assets/images/xxx
    # 去除开头的 /content 前缀
    rel_path="${path#/content}"
    
    # 完整目标路径
    target_path="$BASE_DIR$rel_path"
    
    # 目标目录
    target_dir=$(dirname "$target_path")
    
    # 创建占位图片
    create_placeholder "$target_dir" "$target_path"
done

echo -e "${BLUE}========== 最终修复结果 ==========${NC}"
echo -e "${GREEN}共创建了 $created_count 个占位图片${NC}"
echo -e "${GREEN}共修复了 $fixed_count 个图片引用路径${NC}"
echo -e "${BLUE}请运行 ./check_image_references.sh 验证结果${NC}" 