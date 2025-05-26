#!/bin/bash

# 启动本地开发环境
# 此脚本同时启动Next.js开发服务器和Turso本地服务器

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
  echo "错误: Docker未运行，请先启动Docker"
  exit 1
fi

# 检查Turso容器是否已存在
if docker ps -a | grep -q turso-local; then
  echo "发现现有的Turso容器，正在移除..."
  docker rm -f turso-local > /dev/null
fi

# 启动Turso本地服务器
echo "启动Turso本地服务器..."
docker run -d --name turso-local -p 8080:8080 ghcr.io/tursodatabase/libsql-server:latest > /dev/null

# 等待Turso服务器启动
echo "等待Turso服务器启动..."
sleep 3

# 测试Turso服务器是否正常运行
if ! curl -s -X POST -H "Content-Type: application/json" -d '{"statements":[{"q":"SELECT 1"}]}' http://localhost:8080/ > /dev/null; then
  echo "错误: Turso服务器未正常运行"
  exit 1
fi

echo "Turso服务器已启动并正常运行"

# 启动Next.js开发服务器
echo "启动Next.js开发服务器..."
npm run dev 