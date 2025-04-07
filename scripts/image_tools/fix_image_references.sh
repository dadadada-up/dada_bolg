#!/bin/bash

# 自动修复文章中的图片引用问题
echo "开始修复文章中的图片引用..."

# 查找所有包含图片引用的Markdown文件
files=$(grep -l "!\[" content/posts/**/*.md)

if [ -z "$files" ]; then
    echo "未找到包含图片引用的文件"
    exit 0
fi

echo "修复结果:"
fixed_count=0

# 遍历文件并修复图片引用
for file in $files; do
    # 提取所有图片引用
    image_refs=$(grep -o "!\[.*\](.*)" "$file" | sed 's/!\[.*\](\(.*\))/\1/g')
    
    for image_ref in $image_refs; do
        # 去除开头的/
        image_path=${image_ref#/}
        
        # 检查图片文件是否存在
        if [ ! -f "$image_path" ]; then
            # 尝试在同目录下查找类似名称的图片
            dir_path=$(dirname "$image_path")
            if [ -d "$dir_path" ]; then
                similar_image=$(ls "$dir_path" | head -1)
                if [ ! -z "$similar_image" ]; then
                    # 构建正确的图片路径
                    correct_path="/${dir_path}/${similar_image}"
                    
                    # 转义路径中的特殊字符
                    escaped_image_ref=$(echo "$image_ref" | sed 's/\//\\\//g')
                    escaped_correct_path=$(echo "$correct_path" | sed 's/\//\\\//g')
                    
                    # 替换图片引用
                    sed -i '' "s|$escaped_image_ref|$escaped_correct_path|g" "$file"
                    
                    echo "[$file] 修复图片引用: $image_ref -> $correct_path"
                    fixed_count=$((fixed_count + 1))
                else
                    echo "[$file] 无法修复图片引用: $image_ref (找不到替代图片)"
                fi
            else
                echo "[$file] 无法修复图片引用: $image_ref (目录不存在)"
            fi
        fi
    done
done

echo "总共修复了 $fixed_count 个图片引用问题"

if [ $fixed_count -gt 0 ]; then
    echo "修复完成，请重新运行check_image_references.sh检查结果"
fi

exit 0 