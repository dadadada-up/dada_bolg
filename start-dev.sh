#!/bin/bash

# 开发环境启动脚本
# 
# 一键启动本地开发环境，包括Turso数据库和Next.js开发服务器
# 使用方法: ./start-dev.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 输出带颜色的消息
log() {
  local type=$1
  local message=$2
  local color=$BLUE
  local prefix="🔹"
  
  case $type in
    "error")
      color=$RED
      prefix="❌"
      ;;
    "success")
      color=$GREEN
      prefix="✅"
      ;;
    "warning")
      color=$YELLOW
      prefix="⚠️"
      ;;
  esac
  
  echo -e "${color}${prefix} ${message}${NC}"
}

# 检查Docker是否运行
check_docker() {
  log "info" "检查Docker是否运行..."
  if ! docker info > /dev/null 2>&1; then
    log "error" "Docker未运行或无法访问"
    log "warning" "请先启动Docker应用"
    exit 1
  fi
  log "success" "Docker正在运行"
}

# 检查Turso容器是否存在
check_turso_container() {
  log "info" "检查Turso容器是否存在..."
  if ! docker ps -a --filter "name=^turso-local$" --format "{{.Names}}" | grep -q "turso-local"; then
    log "warning" "Turso容器不存在，将初始化本地开发环境"
    return 1
  fi
  log "success" "Turso容器已存在"
  return 0
}

# 检查Turso容器是否运行
check_turso_running() {
  log "info" "检查Turso容器是否运行..."
  if ! docker ps --filter "name=^turso-local$" --format "{{.Names}}" | grep -q "turso-local"; then
    log "warning" "Turso容器未运行，将启动容器"
    return 1
  fi
  log "success" "Turso容器正在运行"
  return 0
}

# 启动Turso容器
start_turso() {
  log "info" "启动Turso容器..."
  if ! docker start turso-local > /dev/null 2>&1; then
    log "error" "无法启动Turso容器"
    exit 1
  fi
  log "success" "Turso容器已启动"
}

# 初始化开发环境
init_dev_env() {
  log "info" "初始化开发环境..."
  node scripts/init-dev-db.js
  if [ $? -ne 0 ]; then
    log "error" "初始化开发环境失败"
    exit 1
  fi
}

# 等待Turso服务器准备就绪
wait_for_turso() {
  log "info" "等待Turso服务器准备就绪..."
  local max_attempts=10
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
      log "success" "Turso服务器已准备就绪"
      return 0
    fi
    log "info" "等待Turso服务器... ($attempt/$max_attempts)"
    sleep 1
    attempt=$((attempt + 1))
  done
  
  log "error" "Turso服务器未能在规定时间内准备就绪"
  exit 1
}

# 主函数
main() {
  log "info" "======================================="
  log "info" "🚀 启动本地开发环境..."
  log "info" "======================================="
  
  # 检查Docker
  check_docker
  
  # 检查Turso容器
  if ! check_turso_container; then
    init_dev_env
  elif ! check_turso_running; then
    start_turso
  fi
  
  # 等待Turso服务器准备就绪
  wait_for_turso
  
  # 启动Next.js开发服务器
  log "info" "======================================="
  log "info" "启动Next.js开发服务器..."
  log "info" "======================================="
  log "success" "开发环境已准备就绪!"
  log "info" "访问 http://localhost:3000 查看博客"
  log "info" "按Ctrl+C停止服务器"
  log "info" "======================================="
  
  # 启动Next.js开发服务器
  exec npx next dev
}

# 执行主函数
main 