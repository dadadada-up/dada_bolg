#!/bin/bash

# 创建备份脚本
# 此脚本将所有清理和修复脚本及日志文件打包成一个备份文件

# 获取当前日期作为备份文件名的一部分
DATE=$(date +"%Y%m%d")
BACKUP_DIR="dada_blog_scripts_backup_${DATE}"
BACKUP_FILE="${BACKUP_DIR}.tar.gz"

# 创建日志文件
LOG_FILE="create_backup_log.txt"
echo "开始创建备份 $(date)" > $LOG_FILE

# 创建临时目录存放备份文件
echo "创建临时备份目录: ${BACKUP_DIR}" | tee -a $LOG_FILE
mkdir -p $BACKUP_DIR

# 复制所有脚本文件到备份目录
echo "复制脚本文件到备份目录..." | tee -a $LOG_FILE
cp -f *.sh $BACKUP_DIR/ 2>/dev/null || echo "未找到脚本文件" | tee -a $LOG_FILE

# 复制所有日志文件到备份目录
echo "复制日志文件到备份目录..." | tee -a $LOG_FILE
cp -f *.log *.txt $BACKUP_DIR/ 2>/dev/null || echo "未找到日志文件" | tee -a $LOG_FILE

# 复制标准化报告到备份目录
echo "复制标准化报告到备份目录..." | tee -a $LOG_FILE
cp -f standardization_report.md $BACKUP_DIR/ 2>/dev/null || echo "未找到标准化报告" | tee -a $LOG_FILE

# 创建备份文件清单
echo "创建备份文件清单..." | tee -a $LOG_FILE
find $BACKUP_DIR -type f | sort > "${BACKUP_DIR}/backup_files_list.txt"

# 显示备份文件内容统计
echo "备份文件统计:" | tee -a $LOG_FILE
echo "脚本文件数量: $(find $BACKUP_DIR -name "*.sh" | wc -l)" | tee -a $LOG_FILE
echo "日志文件数量: $(find $BACKUP_DIR -name "*.log" -o -name "*.txt" | wc -l)" | tee -a $LOG_FILE
echo "总文件数量: $(find $BACKUP_DIR -type f | wc -l)" | tee -a $LOG_FILE

# 创建tar归档
echo "创建tar归档文件: ${BACKUP_FILE}..." | tee -a $LOG_FILE
tar -czf $BACKUP_FILE $BACKUP_DIR

# 检查tar命令是否成功
if [ $? -eq 0 ]; then
    echo "备份文件已成功创建: ${BACKUP_FILE}" | tee -a $LOG_FILE
    # 删除临时目录
    rm -rf $BACKUP_DIR
    echo "已清理临时备份目录" | tee -a $LOG_FILE
else
    echo "创建备份文件失败" | tee -a $LOG_FILE
fi

# 显示备份文件大小
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo "备份文件大小: $SIZE" | tee -a $LOG_FILE
fi

echo "备份过程完成，日志已保存到 $LOG_FILE" | tee -a $LOG_FILE
echo "备份完成时间: $(date)" | tee -a $LOG_FILE 