#!/bin/bash

# 查找所有包含图片引用的Markdown文件
echo "查找包含图片引用的Markdown文件..."
files=$(grep -l "/assets/images/" content/posts/**/*.md)

if [ -z "$files" ]; then
    echo "未找到包含图片引用的文件"
    exit 0
fi

echo "更新图片路径:"
count=0

# 遍历文件并替换图片路径
for file in $files; do
    # 替换图片路径
    sed -i '' 's|/assets/images/|/content/assets/images/|g' "$file"
    echo "已更新: $file"
    count=$((count + 1))
done

echo "总共更新了 $count 个文件中的图片路径" 