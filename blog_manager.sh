#!/bin/bash

# 博客管理脚本 - 统一入口
# 用于管理和维护博客文档的各种操作

# 工作目录
WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS_DIR="${WORK_DIR}/scripts"
LOGS_DIR="${WORK_DIR}/logs"
REPORTS_DIR="${WORK_DIR}/reports"
BACKUPS_DIR="${WORK_DIR}/backups"

# 打印彩色输出
print_color() {
  local color=$1
  local text=$2
  case $color in
    "red") echo -e "\033[31m$text\033[0m" ;;
    "green") echo -e "\033[32m$text\033[0m" ;;
    "yellow") echo -e "\033[33m$text\033[0m" ;;
    "blue") echo -e "\033[34m$text\033[0m" ;;
    *) echo "$text" ;;
  esac
}

# 显示帮助信息
show_help() {
  print_color "blue" "博客文档管理工具"
  echo ""
  echo "用法: $0 [命令] [选项]"
  echo ""
  echo "可用命令:"
  print_color "green" "  check        - 检查文件名格式"
  print_color "green" "  convert      - 转换语雀文档"
  print_color "green" "  fix          - 修复文档问题"
  print_color "green" "  rename       - 重命名文件为中文命名"
  print_color "green" "  cleanup      - 清理临时文件"
  print_color "green" "  final        - 执行最终清理并生成报告"
  print_color "green" "  backup       - 创建脚本和日志备份"
  print_color "green" "  report       - 查看标准化报告"
  print_color "green" "  help         - 显示帮助信息"
  echo ""
  echo "选项:"
  echo "  -a, --all      对所有文件执行操作"
  echo "  -v, --verbose  显示详细输出"
  echo ""
  echo "示例:"
  echo "  $0 check        检查所有文件的命名格式"
  echo "  $0 fix --all    修复所有文档问题"
  echo "  $0 report       查看标准化报告"
  echo "  $0 final        执行最终清理并生成完整报告"
}

# 检查文件名格式
check_filename() {
  print_color "blue" "检查文件名格式..."
  bash "${SCRIPTS_DIR}/check_filename_format.sh"
  echo ""
  if [ -f "${LOGS_DIR}/filename_check_results.txt" ]; then
    print_color "green" "检查结果已保存到: ${LOGS_DIR}/filename_check_results.txt"
  fi
}

# 转换语雀文档
convert_yuque_docs() {
  print_color "blue" "开始转换语雀文档..."
  bash "${SCRIPTS_DIR}/convert_yuque_docs.sh"
  echo ""
  print_color "green" "转换完成，日志文件保存在: ${LOGS_DIR}/convert_yuque_docs_log.txt"
}

# 修复文档问题
fix_docs() {
  local fix_all=$1
  
  if [ "$fix_all" = true ]; then
    print_color "blue" "开始全面修复文档问题..."
    bash "${SCRIPTS_DIR}/fix_all.sh"
  else
    print_color "yellow" "请指定要修复的具体问题，或使用 --all 选项修复所有问题"
    echo "可用的修复选项:"
    print_color "green" "  --empty       修复空文档"
    print_color "green" "  --title       修复标题不匹配问题"
    print_color "green" "  --special     处理特殊空文件"
    print_color "green" "  --frontmatter 修复Front Matter问题"
    print_color "green" "  --remaining   修复剩余问题"
  fi
  
  echo ""
  print_color "green" "修复操作完成"
}

# 重命名文件为中文
rename_to_chinese() {
  print_color "blue" "开始将文件重命名为中文..."
  bash "${SCRIPTS_DIR}/rename_to_chinese.sh"
  echo ""
  print_color "green" "重命名完成，日志文件保存在: ${LOGS_DIR}/rename_to_chinese_log.txt"
}

# 清理临时文件
cleanup_files() {
  print_color "blue" "开始清理临时文件..."
  bash "${SCRIPTS_DIR}/cleanup.sh"
  echo ""
  print_color "green" "清理完成，日志文件保存在: ${LOGS_DIR}/cleanup_log.txt"
}

# 创建备份
create_backup() {
  print_color "blue" "开始创建备份..."
  bash "${SCRIPTS_DIR}/create_backup.sh"
  echo ""
  print_color "green" "备份完成，备份文件保存在: ${BACKUPS_DIR}/"
}

# 执行最终清理
final_cleanup() {
  print_color "blue" "开始执行最终清理..."
  bash "${SCRIPTS_DIR}/final_cleanup.sh"
  echo ""
  print_color "green" "最终清理完成，报告已生成"
  
  # 显示最新的报告文件
  local latest_report=$(ls -t "${REPORTS_DIR}"/blog_standardization_report_*.md 2>/dev/null | head -n 1)
  if [ -n "$latest_report" ]; then
    echo ""
    print_color "yellow" "最新报告内容:"
    echo ""
    cat "$latest_report"
  fi
}

# 查看报告
view_report() {
  # 显示最新的标准化报告
  local latest_report=$(ls -t "${REPORTS_DIR}"/blog_standardization_report_*.md 2>/dev/null | head -n 1)
  
  if [ -n "$latest_report" ]; then
    print_color "blue" "最新标准化报告 ($(basename "$latest_report")):"
    echo ""
    cat "$latest_report"
  elif [ -f "${REPORTS_DIR}/standardization_report.md" ]; then
    print_color "blue" "标准化报告:"
    echo ""
    cat "${REPORTS_DIR}/standardization_report.md"
  else
    print_color "red" "报告文件不存在，请先运行 '$0 final' 生成报告"
  fi
}

# 主函数
main() {
  # 创建必要的目录
  mkdir -p "$LOGS_DIR" "$REPORTS_DIR" "$BACKUPS_DIR"
  
  # 如果没有参数，显示帮助信息
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi
  
  # 解析命令
  case "$1" in
    "check")
      check_filename
      ;;
    "convert")
      convert_yuque_docs
      ;;
    "fix")
      shift
      if [ "$1" = "--all" ] || [ "$1" = "-a" ]; then
        fix_docs true
      else
        fix_docs false
      fi
      ;;
    "rename")
      rename_to_chinese
      ;;
    "cleanup")
      cleanup_files
      ;;
    "backup")
      create_backup
      ;;
    "final")
      final_cleanup
      ;;
    "report")
      view_report
      ;;
    "help"|"-h"|"--help")
      show_help
      ;;
    *)
      print_color "red" "未知命令: $1"
      echo ""
      show_help
      exit 1
      ;;
  esac
}

# 执行主函数
main "$@" 