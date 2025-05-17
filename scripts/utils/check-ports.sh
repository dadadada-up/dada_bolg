#!/bin/bash

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 检查端口函数
check_port() {
  local port=$1
  echo -e "${BLUE}检查端口 $port 是否被占用...${NC}"
  
  # 使用lsof检查端口
  local pid=$(lsof -t -i:$port)
  
  if [ -z "$pid" ]; then
    echo -e "${GREEN}端口 $port 未被占用，可以使用。${NC}"
    return 0
  else
    echo -e "${YELLOW}端口 $port 被进程 $pid 占用。${NC}"
    
    # 获取进程信息
    echo -e "${BLUE}占用端口的进程信息:${NC}"
    lsof -i:$port
    
    # 询问是否释放端口
    read -p "是否释放端口 $port? (y/n): " answer
    if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
      echo -e "${YELLOW}正在终止进程 $pid...${NC}"
      kill -9 $pid
      sleep 1
      
      # 再次检查端口是否被释放
      if [ -z "$(lsof -t -i:$port)" ]; then
        echo -e "${GREEN}端口 $port 已成功释放。${NC}"
        return 0
      else
        echo -e "${RED}无法释放端口 $port，请手动处理。${NC}"
        return 1
      fi
    else
      echo -e "${YELLOW}保留端口 $port 的占用进程。${NC}"
      return 1
    fi
  fi
}

# 主函数
main() {
  echo -e "${BLUE}===== 端口检查工具 =====${NC}"
  
  # 检查常用的开发端口
  local ports=(3000 3001 3002 3003 8000 8080)
  local available_ports=()
  
  for port in "${ports[@]}"; do
    if check_port $port; then
      available_ports+=($port)
    fi
  done
  
  echo -e "\n${GREEN}可用端口列表:${NC}"
  for port in "${available_ports[@]}"; do
    echo -e "- $port"
  done
  
  if [ ${#available_ports[@]} -eq 0 ]; then
    echo -e "${YELLOW}没有找到可用的常用端口，请手动检查其他端口。${NC}"
  fi
}

# 执行主函数
main 