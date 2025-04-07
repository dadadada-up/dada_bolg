#!/bin/bash

# 综合脚本，一次性修复所有文档问题

# 获取脚本所在目录的上级目录（项目根目录）
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="${ROOT_DIR}/scripts"

echo "====== 开始修复文档问题 ======"
echo "执行时间: $(date)"
echo ""

# 提示用户选择是否进行中文文件名转换
echo "是否将文件名转换为中文（基于文档title字段）？"
echo "1) 是，将文件名转换为中文"
echo "2) 否，保持英文命名"
read -p "请输入选项 (1/2): " chinese_option
echo ""

# 1. 修复Front Matter格式
echo "第1步: 修复Front Matter格式..."
chmod +x "${SCRIPTS_DIR}/fix_front_matter.sh"
bash "${SCRIPTS_DIR}/fix_front_matter.sh"
echo ""

# 2. 修复Front Matter结构
echo "第2步: 修复Front Matter结构..."
chmod +x "${SCRIPTS_DIR}/fix_front_matter_structure.sh"
bash "${SCRIPTS_DIR}/fix_front_matter_structure.sh"
echo ""

# 3. 修复图片路径
echo "第3步: 修复本地图片路径..."
chmod +x "${SCRIPTS_DIR}/fix_image_paths.sh"
bash "${SCRIPTS_DIR}/fix_image_paths.sh"
echo ""

# 4. 处理远程图片
echo "第4步: 处理远程图片..."
chmod +x "${SCRIPTS_DIR}/fix_remote_images.sh"
bash "${SCRIPTS_DIR}/fix_remote_images.sh"
echo ""

# 5. 修复文件名中的引号问题
echo "第5步: 修复文件名中的引号问题..."
chmod +x "${SCRIPTS_DIR}/fix_filename_quotes.sh"
bash "${SCRIPTS_DIR}/fix_filename_quotes.sh"
echo ""

# 6. 处理剩余的文件命名问题
echo "第6步: 处理剩余的文件命名问题..."
chmod +x "${SCRIPTS_DIR}/fix_remaining_files.sh"
bash "${SCRIPTS_DIR}/fix_remaining_files.sh"
echo ""

# 7. 修复标题匹配问题
echo "第7步: 修复标题匹配问题..."
chmod +x "${SCRIPTS_DIR}/fix_title_match.sh"
bash "${SCRIPTS_DIR}/fix_title_match.sh"
echo ""

# 8. 可选：将文件名转换为中文
if [ "$chinese_option" == "1" ]; then
  echo "第8步: 将文件名转换为中文..."
  chmod +x "${SCRIPTS_DIR}/rename_to_chinese.sh"
  bash "${SCRIPTS_DIR}/rename_to_chinese.sh"
  echo ""
else
  echo "跳过第8步: 保持英文文件名"
  echo ""
fi

# 9. 检查最终结果
echo "第9步: 检查最终结果..."
chmod +x "${SCRIPTS_DIR}/check_filename_format.sh"
bash "${SCRIPTS_DIR}/check_filename_format.sh"
echo ""

echo "====== 文档修复完成 ======"
echo "所有脚本已执行完毕，请查看各个日志文件了解详细信息。"
echo "- Front Matter格式: 查看 ${ROOT_DIR}/logs/fix_front_matter.log 和 ${ROOT_DIR}/logs/fix_front_matter_structure.log 输出"
echo "- 图片路径: 查看 ${ROOT_DIR}/logs/fix_image_paths.log 输出"
echo "- 远程图片处理: 查看 ${ROOT_DIR}/logs/remote_images_log.txt"
echo "- 文件名引号问题: 查看 ${ROOT_DIR}/logs/fix_filename_quotes_log.txt"
echo "- 文件重命名: 查看 ${ROOT_DIR}/logs/fix_remaining_files_log.txt"
echo "- 标题匹配修复: 查看 ${ROOT_DIR}/logs/fix_title_match_log.txt"
if [ "$chinese_option" == "1" ]; then
  echo "- 中文文件名转换: 查看 ${ROOT_DIR}/logs/rename_to_chinese_log.txt"
fi
echo "- 最终检查结果: 查看 ${ROOT_DIR}/logs/filename_check_results.txt" 