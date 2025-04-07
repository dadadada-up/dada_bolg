#!/bin/bash

# 调用scripts目录下的博客管理脚本
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/scripts/manage_blog.sh" "$@" 