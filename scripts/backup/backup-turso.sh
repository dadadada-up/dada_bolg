#!/bin/bash

# Turso数据库备份脚本
# 
# 用法:
#   npm run backup-turso
#   ./scripts/backup-turso.sh
#
# 环境变量:
#   TURSO_DB_NAME   - Turso数据库名称，默认为"dada-blog-db"
#   BACKUP_DIR      - 备份目录路径，默认为"./data/backups"
#   MAX_DAYS        - 保留的备份天数，默认为30

set -e

# 加载环境变量（如果存在）
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# 配置参数
DB_NAME=${TURSO_DB_NAME:-"dada-blog-db"}
BACKUP_DIR=${BACKUP_DIR:-"./data/backups"}
MAX_DAYS=${MAX_DAYS:-30}

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/turso_backup_${TIMESTAMP}.sql"

echo "开始备份Turso数据库: $DB_NAME"
echo "备份文件: $BACKUP_FILE"

# 检查turso命令是否可用
if ! command -v turso &> /dev/null; then
  echo "错误: 未找到turso命令，请安装Turso CLI"
  echo "安装命令: brew install tursodatabase/tap/turso"
  exit 1
fi

# 检查是否已登录
TURSO_AUTH_STATUS=$(turso auth status 2>&1 || echo "未登录")
if [[ "$TURSO_AUTH_STATUS" == *"未登录"* || "$TURSO_AUTH_STATUS" == *"not authenticated"* ]]; then
  echo "错误: 未登录Turso，请先运行 'turso auth login'"
  exit 1
fi

# 检查数据库是否存在
if ! turso db list | grep -q "$DB_NAME"; then
  echo "错误: 数据库 '$DB_NAME' 不存在"
  echo "可用的数据库:"
  turso db list
  exit 1
fi

# 导出数据库
echo "正在导出数据库..."
turso db dump "$DB_NAME" > "$BACKUP_FILE"

# 检查备份是否成功
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ 备份完成! 文件大小: $BACKUP_SIZE"
  
  # 统计备份中的表和行数
  echo "备份内容统计:"
  TABLE_COUNT=$(grep -c "CREATE TABLE" "$BACKUP_FILE")
  INSERT_COUNT=$(grep -c "INSERT INTO" "$BACKUP_FILE")
  echo "- 表数量: $TABLE_COUNT"
  echo "- 插入语句数量: $INSERT_COUNT"
  
  # 清理旧备份
  echo "正在清理超过 $MAX_DAYS 天的旧备份..."
  find "$BACKUP_DIR" -name "turso_backup_*.sql" -type f -mtime +$MAX_DAYS -delete
  
  # 列出现有备份
  BACKUP_COUNT=$(find "$BACKUP_DIR" -name "turso_backup_*.sql" | wc -l)
  echo "当前有 $BACKUP_COUNT 个备份文件"
  
  echo "最近的5个备份文件:"
  ls -lt "$BACKUP_DIR"/turso_backup_*.sql | head -n 5
else
  echo "❌ 备份失败!"
  exit 1
fi

echo "完成。" 