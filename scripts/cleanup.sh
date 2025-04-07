#!/bin/bash

# 获取脚本所在目录的上级目录（项目根目录）
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOGS_DIR="${ROOT_DIR}/logs"
SCRIPTS_DIR="${ROOT_DIR}/scripts"
REPORTS_DIR="${ROOT_DIR}/reports"

# 创建日志文件
LOG_FILE="${LOGS_DIR}/cleanup_log.txt"
echo "清理日志 $(date)" > $LOG_FILE

echo "开始清理临时文件..." | tee -a $LOG_FILE

# 删除所有日志文件
echo "删除日志文件..." | tee -a $LOG_FILE
for log_file in ${LOGS_DIR}/*.log ${LOGS_DIR}/fix_*_log.txt
do
    if [ -f "$log_file" ] && [ "$log_file" != "$LOG_FILE" ]; then
        echo "  删除: $log_file" | tee -a $LOG_FILE
        rm -f "$log_file"
    fi
done

# 删除所有临时文件
echo "删除临时文件..." | tee -a $LOG_FILE
for temp_file in ${LOGS_DIR}/*.tmp ${LOGS_DIR}/filename_check_results.txt
do
    if [ -f "$temp_file" ]; then
        echo "  删除: $temp_file" | tee -a $LOG_FILE
        rm -f "$temp_file"
    fi
done

# 删除所有临时脚本
echo "删除临时脚本..." | tee -a $LOG_FILE
for script_file in ${SCRIPTS_DIR}/fix_*.sh
do
    if [ -f "$script_file" ] && [ "$script_file" != "${SCRIPTS_DIR}/fix_all.sh" ]; then
        echo "  删除: $script_file" | tee -a $LOG_FILE
        # 暂时不实际删除脚本文件，防止误删
        # rm -f "$script_file"
    fi
done

echo "保留工作报告..." | tee -a $LOG_FILE
echo "  保留: ${REPORTS_DIR}/standardization_report.md" | tee -a $LOG_FILE

# 最后一次检查文件名格式是否正确
if [ -f "${SCRIPTS_DIR}/check_filename_format.sh" ]; then
    echo "运行最后的检查..." | tee -a $LOG_FILE
    bash "${SCRIPTS_DIR}/check_filename_format.sh"
    echo "  这是最后的检查结果，将保留 ${LOGS_DIR}/filename_check_results.txt 文件作为参考" | tee -a $LOG_FILE
fi

echo "清理完成！" | tee -a $LOG_FILE
echo "保留 $LOG_FILE 文件作为清理记录" | tee -a $LOG_FILE 