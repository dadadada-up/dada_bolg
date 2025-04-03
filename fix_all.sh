#!/bin/bash

# 综合脚本，一次性修复所有文档问题

echo "====== 开始修复文档问题 ======"
echo "执行时间: $(date)"
echo ""

# 1. 修复Front Matter格式
echo "第1步: 修复Front Matter格式..."
chmod +x fix_front_matter.sh
./fix_front_matter.sh
echo ""

# 2. 修复Front Matter结构
echo "第2步: 修复Front Matter结构..."
chmod +x fix_front_matter_structure.sh
./fix_front_matter_structure.sh
echo ""

# 3. 修复图片路径
echo "第3步: 修复本地图片路径..."
chmod +x fix_image_paths.sh
./fix_image_paths.sh
echo ""

# 4. 处理远程图片
echo "第4步: 处理远程图片..."
chmod +x fix_remote_images.sh
./fix_remote_images.sh
echo ""

# 5. 修复文件名中的引号问题
echo "第5步: 修复文件名中的引号问题..."
chmod +x fix_filename_quotes.sh
./fix_filename_quotes.sh
echo ""

# 6. 处理剩余的文件命名问题
echo "第6步: 处理剩余的文件命名问题..."
chmod +x fix_remaining_files.sh
./fix_remaining_files.sh
echo ""

# 7. 修复标题匹配问题
echo "第7步: 修复标题匹配问题..."
chmod +x fix_title_match.sh
./fix_title_match.sh
echo ""

# 8. 检查最终结果
echo "第8步: 检查最终结果..."
chmod +x check_filename_format.sh
./check_filename_format.sh
echo ""

echo "====== 文档修复完成 ======"
echo "所有脚本已执行完毕，请查看各个日志文件了解详细信息。"
echo "- Front Matter格式: 查看 fix_front_matter.sh 和 fix_front_matter_structure.sh 输出"
echo "- 图片路径: 查看 fix_image_paths.sh 输出"
echo "- 远程图片处理: 查看 remote_images_log.txt"
echo "- 文件名引号问题: 查看 fix_filename_quotes_log.txt"
echo "- 文件重命名: 查看 fix_remaining_files_log.txt"
echo "- 标题匹配修复: 查看 fix_title_match_log.txt"
echo "- 最终检查结果: 查看 filename_check_results.txt" 