#!/bin/bash

# 博客系统管理脚本
# 整合了各种功能，便于维护和使用

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# 显示帮助信息
show_help() {
    echo -e "${GREEN}博客系统管理脚本${NC}"
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  preview        启动博客预览服务器"
    echo "  check-images   检查图片引用"
    echo "  fix-images     修复图片引用问题"
    echo "  backup         创建博客内容备份"
    echo "  clean          清理临时文件"
    echo "  help           显示此帮助信息"
    echo ""
}

# 启动预览服务器
preview_blog() {
    echo -e "${GREEN}启动博客预览服务器...${NC}"
    cd "$BASE_DIR"
    python3 server.py
}

# 检查图片引用
check_images() {
    echo -e "${GREEN}检查图片引用...${NC}"
    cd "$BASE_DIR"
    bash "$SCRIPT_DIR/image_tools/check_image_references.sh"
}

# 修复图片引用
fix_images() {
    echo -e "${GREEN}修复图片引用问题...${NC}"
    cd "$BASE_DIR"
    bash "$SCRIPT_DIR/image_tools/fix_all_images.sh"
}

# 备份博客内容
backup_blog() {
    echo -e "${GREEN}创建博客内容备份...${NC}"
    cd "$BASE_DIR"
    
    # 创建备份目录
    BACKUP_DIR="$BASE_DIR/temp/backups"
    mkdir -p "$BACKUP_DIR"
    
    # 备份时间戳
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    
    # 备份内容目录
    tar -czf "$BACKUP_DIR/content_$TIMESTAMP.tar.gz" content
    
    echo -e "${GREEN}备份完成: $BACKUP_DIR/content_$TIMESTAMP.tar.gz${NC}"
}

# 清理临时文件
clean_temp() {
    echo -e "${GREEN}清理临时文件...${NC}"
    cd "$BASE_DIR"
    
    # 移除macOS生成的.DS_Store文件
    find . -name ".DS_Store" -delete
    
    echo -e "${GREEN}清理完成${NC}"
}

# 主函数
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    case "$1" in
        preview)
            preview_blog
            ;;
        check-images)
            check_images
            ;;
        fix-images)
            fix_images
            ;;
        backup)
            backup_blog
            ;;
        clean)
            clean_temp
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}错误: 未知选项 $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@" 