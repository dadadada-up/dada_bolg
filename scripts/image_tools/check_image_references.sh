#!/bin/bash

# 检查图片引用是否与实际文件匹配
echo "开始检查文章中的图片引用..."

# 查找所有包含图片引用的Markdown文件
files=$(/usr/bin/grep -l "!\[" content/posts/**/*.md)

if [ -z "$files" ]; then
    echo "未找到包含图片引用的文件"
    exit 0
fi

echo "检查结果:"
count=0
issue_count=0

# 遍历文件并检查图片引用
for file in $files; do
    # 提取所有图片引用
    image_refs=$(/usr/bin/grep -o "!\[.*\](.*)" "$file" | /usr/bin/sed 's/!\[.*\](\(.*\))/\1/g')
    
    for image_ref in $image_refs; do
        # 去除开头的/
        image_path=${image_ref#/}
        
        # 检查图片文件是否存在
        if [ ! -f "$image_path" ]; then
            echo "[$file] 引用了不存在的图片: $image_ref"
            
            # 尝试在同目录下查找类似名称的图片
            dir_path=$(/usr/bin/dirname "$image_path")
            if [ -d "$dir_path" ]; then
                similar_image=$(/bin/ls "$dir_path" | /usr/bin/head -1)
                if [ ! -z "$similar_image" ]; then
                    echo "  可能的替代图片: $dir_path/$similar_image"
                fi
            fi
            
            issue_count=$((issue_count + 1))
        else
            echo "[$file] 图片引用正确: $image_ref"
        fi
        count=$((count + 1))
    done
done

echo "总共检查了 $count 个图片引用，发现 $issue_count 个问题"

if [ $issue_count -gt 0 ]; then
    echo "请使用 fix_image_references.sh 脚本修复这些问题"
    exit 1
fi

exit 0 