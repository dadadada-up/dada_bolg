#!/bin/bash

# Turso数据库备份脚本
# 使用此脚本定期备份Turso数据库

# 设置参数
BACKUP_DIR="./data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/turso_backup_${TIMESTAMP}.sql"
DB_NAME=${TURSO_DB_NAME:-"dada-blog-db"}
MAX_DAYS=${MAX_DAYS:-30}

# 输出日志时间前缀
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

# 确保备份目录存在
mkdir -p "$BACKUP_DIR"
log "备份目录: $BACKUP_DIR"

# 检查Turso CLI是否安装
if ! command -v turso &> /dev/null; then
  log "错误: 未找到turso命令，请先安装Turso CLI"
  log "  安装命令: brew install tursodatabase/tap/turso 或 npm install -g turso"
  exit 1
fi

# 检查是否已登录
if ! turso auth status &> /dev/null; then
  log "错误: 未登录Turso，请先运行 'turso auth login'"
  exit 1
fi

# 检查数据库是否存在
if ! turso db list | grep -q "$DB_NAME"; then
  log "错误: 数据库 '$DB_NAME' 不存在，请检查数据库名称"
  log "可用的数据库:"
  turso db list
  exit 1
fi

# 执行备份
log "开始备份数据库 '$DB_NAME'..."
turso db dump "$DB_NAME" > "$BACKUP_FILE"

# 检查备份是否成功
if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log "备份成功: $BACKUP_FILE (大小: $BACKUP_SIZE)"
else
  log "备份失败!"
  exit 1
fi

# 清理旧备份
log "清理${MAX_DAYS}天前的备份文件..."
find "$BACKUP_DIR" -name "turso_backup_*.sql" -type f -mtime +$MAX_DAYS -delete

# 列出当前备份
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "turso_backup_*.sql" | wc -l)
log "当前共有 $BACKUP_COUNT 个备份文件"

# 输出存储信息
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "备份目录总大小: $TOTAL_SIZE"

log "备份完成!"
exit 0 