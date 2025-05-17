#!/bin/bash

# Turso数据库恢复脚本
# 使用此脚本从备份文件恢复Turso数据库

# 设置参数
BACKUP_DIR="./data/backups"
DB_NAME=${TURSO_DB_NAME:-"dada-blog-db"}

# 输出日志时间前缀
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

# 显示使用方法
show_usage() {
  echo "使用方法: $0 [选项] [备份文件]"
  echo "选项:"
  echo "  -h, --help        显示此帮助信息"
  echo "  -l, --list        列出可用的备份文件"
  echo "  -f, --file FILE   指定备份文件路径"
  echo "  -n, --new NAME    创建新数据库（而不是恢复到现有数据库）"
  echo "  -y, --yes         不询问确认"
  echo ""
  echo "示例:"
  echo "  $0 -l                          列出可用备份"
  echo "  $0 -f backups/backup_20230101.sql  从指定文件恢复"
  echo "  $0 -n restored-db              创建新数据库并恢复"
  echo "  $0 -y                          自动确认并恢复最新备份"
}

# 列出可用的备份文件
list_backups() {
  log "可用的备份文件:"
  if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
    log "  没有找到备份文件"
    exit 1
  fi
  
  echo "======================================================================================"
  echo "| 序号 | 备份文件                          | 大小   | 日期                      |"
  echo "--------------------------------------------------------------------------------------"
  
  local i=1
  while IFS= read -r file; do
    local filename=$(basename "$file")
    local filesize=$(du -h "$file" | cut -f1)
    local filedate=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file")
    printf "| %-4s | %-35s | %-6s | %-25s |\n" "$i" "$filename" "$filesize" "$filedate"
    i=$((i+1))
  done < <(find "$BACKUP_DIR" -name "*.sql" | sort -r)
  
  echo "======================================================================================"
}

# 参数解析
BACKUP_FILE=""
NEW_DB=""
AUTO_YES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_usage
      exit 0
      ;;
    -l|--list)
      list_backups
      exit 0
      ;;
    -f|--file)
      BACKUP_FILE="$2"
      shift 2
      ;;
    -n|--new)
      NEW_DB="$2"
      shift 2
      ;;
    -y|--yes)
      AUTO_YES=true
      shift
      ;;
    *)
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

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

# 如果未指定备份文件，则使用最新的备份
if [ -z "$BACKUP_FILE" ]; then
  BACKUP_FILE=$(find "$BACKUP_DIR" -name "*.sql" | sort -r | head -1)
  if [ -z "$BACKUP_FILE" ]; then
    log "错误: 未找到备份文件"
    exit 1
  fi
  log "使用最新的备份文件: $(basename "$BACKUP_FILE")"
elif [ ! -f "$BACKUP_FILE" ]; then
  # 检查是否为备份目录中的文件名
  POSSIBLE_FILE="$BACKUP_DIR/$BACKUP_FILE"
  if [ -f "$POSSIBLE_FILE" ]; then
    BACKUP_FILE="$POSSIBLE_FILE"
  else
    log "错误: 备份文件不存在: $BACKUP_FILE"
    exit 1
  fi
fi

# 确认恢复操作
if [ "$AUTO_YES" != true ]; then
  read -p "确认从 $(basename "$BACKUP_FILE") 恢复到 ${NEW_DB:-$DB_NAME} ? [y/N] " confirm
  if [[ "$confirm" != [yY] && "$confirm" != [yY][eE][sS] ]]; then
    log "操作已取消"
    exit 0
  fi
fi

# 执行恢复
if [ -n "$NEW_DB" ]; then
  # 创建新数据库并恢复
  log "创建新数据库 '$NEW_DB'..."
  if turso db list | grep -q "$NEW_DB"; then
    log "警告: 数据库 '$NEW_DB' 已存在"
    if [ "$AUTO_YES" != true ]; then
      read -p "是否继续操作并覆盖? [y/N] " confirm
      if [[ "$confirm" != [yY] && "$confirm" != [yY][eE][sS] ]]; then
        log "操作已取消"
        exit 0
      fi
    fi
    # 删除现有数据库
    log "删除现有数据库 '$NEW_DB'..."
    turso db destroy "$NEW_DB" --confirm "$NEW_DB"
  fi
  
  # 创建新数据库
  log "创建新数据库 '$NEW_DB'..."
  turso db create "$NEW_DB"
  
  # 恢复数据
  log "将备份 $(basename "$BACKUP_FILE") 恢复到 '$NEW_DB'..."
  cat "$BACKUP_FILE" | turso db shell "$NEW_DB"
  
  # 验证恢复
  log "验证恢复结果..."
  TABLES_COUNT=$(turso db shell "$NEW_DB" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'" --json | grep -o '"rows":\[\[.*\]\]' | sed 's/.*\[\[\(.*\)\]\].*/\1/')
  log "恢复的表数量: $TABLES_COUNT"
  
  log "恢复完成! 数据已恢复到新数据库 '$NEW_DB'"
else
  # 恢复到现有数据库
  log "将备份 $(basename "$BACKUP_FILE") 恢复到现有数据库 '$DB_NAME'..."
  
  # 检查数据库是否存在
  if ! turso db list | grep -q "$DB_NAME"; then
    log "错误: 数据库 '$DB_NAME' 不存在"
    log "可用的数据库:"
    turso db list
    exit 1
  fi
  
  # 先备份当前数据（以防万一）
  TEMP_BACKUP_FILE="$BACKUP_DIR/pre_restore_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
  log "创建当前数据库的临时备份: $(basename "$TEMP_BACKUP_FILE")"
  turso db dump "$DB_NAME" > "$TEMP_BACKUP_FILE"
  
  # 清空现有数据库
  log "清空现有数据库..."
  turso db shell "$DB_NAME" "
    -- 禁用外键约束
    PRAGMA foreign_keys = OFF;
    
    -- 获取所有非系统表
    SELECT 'DROP TABLE IF EXISTS ' || name || ';'
    FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  " | grep "DROP TABLE" | turso db shell "$DB_NAME"
  
  # 恢复数据
  log "恢复数据..."
  cat "$BACKUP_FILE" | turso db shell "$DB_NAME"
  
  # 验证恢复
  log "验证恢复结果..."
  TABLES_COUNT=$(turso db shell "$DB_NAME" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'" --json | grep -o '"rows":\[\[.*\]\]' | sed 's/.*\[\[\(.*\)\]\].*/\1/')
  log "恢复的表数量: $TABLES_COUNT"
  
  log "恢复完成! 数据已恢复到现有数据库 '$DB_NAME'"
  log "如需回滚，可使用临时备份: $(basename "$TEMP_BACKUP_FILE")"
fi

exit 0 