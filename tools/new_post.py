#!/usr/bin/env python
import os
import sys
from datetime import datetime
import argparse
import re
from pathlib import Path
import shutil

def slugify(text):
    """将中文标题转换为拼音文件名"""
    return datetime.now().strftime('%Y%m%d-%H%M%S')

def get_category_path(category):
    """获取分类对应的目录路径"""
    category_dirs = {
        'AI': ['ai/learning/articles', 'ai/tools/articles', 'ai/projects/articles'],
        'Python': ['tech/python/articles'],
        '工具': ['tech/tools/articles'],
        '产品': ['product/methodology/articles', 'product/insurance/articles'],
        'Finance': ['blog/posts/investment/articles']
    }
    
    if category in category_dirs:
        # 如果有多个可选目录，让用户选择
        dirs = category_dirs[category]
        if len(dirs) > 1:
            print(f"\n选择存放目录:")
            for i, dir in enumerate(dirs, 1):
                print(f"{i}. {dir}")
            choice = int(input("\n请选择目录编号: ")) - 1
            return f"docs/{dirs[choice]}"
        return f"docs/{dirs[0]}"
    return "docs/blog/posts/articles"

def create_post(title, category, tags=None):
    """创建新文章"""
    # 清理标签
    if tags:
        tags = [tag.strip() for tag in tags.split(',') if tag.strip()]

    # 验证分类
    valid_categories = ['AI', 'Python', '工具', '产品', 'Finance']
    if category not in valid_categories:
        print(f"错误：无效的分类。请使用以下分类之一：{', '.join(valid_categories)}")
        return

    # 生成文件名
    slug = slugify(title)
    
    # 确定目录
    post_dir = get_category_path(category)
    os.makedirs(post_dir, exist_ok=True)
    
    # 生成文件路径
    file_path = os.path.join(post_dir, f"{slug}.md")
    
    # 处理标签
    tags_yaml = ""
    if tags:
        tags_yaml = "tags:\n" + "\n".join(f"  - {tag}" for tag in tags)
    
    # 生成文章内容
    content = f"""---
title: "{title}"
date: {datetime.now().strftime('%Y-%m-%d')}
categories:
  - {category}
{tags_yaml}
---

这里写文章摘要...

<!-- more -->

## 背景

## 正文

## 总结

"""

    # 写入文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ 文章已创建：{file_path}")
    
    # 更新索引文件
    update_index(post_dir, title, slug)
    
    return file_path

def update_index(post_dir, title, slug):
    """更新索引文件"""
    index_path = post_dir.parent / 'index.md'
    if not index_path.exists():
        return
        
    with open(index_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 找到合适的分类部分
    section_start = -1
    for i, line in enumerate(lines):
        if line.startswith('## '):
            section_start = i
            
    if section_start == -1:
        return
        
    # 移除同名文章链接
    new_lines = []
    skip_next = False
    for i, line in enumerate(lines):
        if skip_next:
            skip_next = False
            continue
            
        if f'[{title}]' in line:
            # 检查下一行是否为空行
            if i + 1 < len(lines) and lines[i + 1].strip() == '':
                skip_next = True
            continue
            
        new_lines.append(line)
    
    # 在第一个分类下添加新文章
    new_lines.insert(section_start + 1, f'- [{title}](articles/{slug})\n')
    
    # 写回文件
    with open(index_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    print(f"✅ 已更新索引：{index_path}")

def setup_workspace():
    """设置工作空间"""
    # 创建必要的目录
    dirs = [
        'docs/ai/learning/articles',
        'docs/ai/tools/articles',
        'docs/ai/projects/articles',
        'docs/tech/python/articles',
        'docs/tech/tools/articles',
        'docs/product/methodology/articles',
        'docs/product/insurance/articles',
        'docs/blog/posts/investment/articles',
        'docs/blog/posts/articles'
    ]
    
    for dir in dirs:
        os.makedirs(dir, exist_ok=True)

def main():
    parser = argparse.ArgumentParser(description='创建新的博客文章')
    parser.add_argument('title', help='文章标题')
    parser.add_argument('--category', '-c', default='产品',
                      choices=['AI', 'Python', '工具', '产品', 'Finance'],
                      help='文章分类')
    parser.add_argument('--tags', '-t', help='文章标签（用逗号分隔）')
    parser.add_argument('--setup', action='store_true', help='初始化工作空间')
    
    args = parser.parse_args()
    
    if args.setup:
        setup_workspace()
        return
        
    file_path = create_post(args.title, args.category, args.tags)
    
    if file_path:
        print("\n使用说明：")
        print("1. 编辑文件添加文章内容")
        print("2. 在 <!-- more --> 之前的内容会作为文章摘要")
        print("3. 图片请放在 docs/assets/images 目录下")
        print("4. 本地预览：python -m mkdocs serve")
        print("\n快捷命令：")
        print(f"code {file_path}  # 使用 VS Code 打开文件")

if __name__ == '__main__':
    main() 