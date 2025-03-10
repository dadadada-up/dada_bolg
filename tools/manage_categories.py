#!/usr/bin/env python
import os
import re
import yaml
from pathlib import Path
import shutil

class CategoryManager:
    def __init__(self, docs_dir='docs'):
        self.docs_dir = Path(docs_dir)
        self.categories = self._load_categories()
        
    def _load_categories(self):
        """加载所有分类"""
        categories = {}
        for path in self.docs_dir.rglob('index.md'):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                # 提取front matter中的分类
                front_matter = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
                if front_matter:
                    try:
                        meta = yaml.safe_load(front_matter.group(1))
                        if 'categories' in meta:
                            cat = meta['categories']
                            if isinstance(cat, list):
                                cat = cat[0]
                            categories[str(path.parent)] = cat
                    except yaml.YAMLError:
                        continue
        return categories
        
    def list_categories(self):
        """列出所有分类"""
        print("\n当前分类结构：")
        for path, category in self.categories.items():
            print(f"{category}: {path}")
            
    def add_category(self, name, path):
        """添加新分类"""
        path = self.docs_dir / path
        if path.exists():
            print(f"错误：目录 {path} 已存在")
            return False
            
        # 创建目录结构
        os.makedirs(path, exist_ok=True)
        os.makedirs(path / 'articles', exist_ok=True)
        
        # 创建索引文件
        index_content = f"""---
title: "{name}"
date: {datetime.now().strftime('%Y-%m-%d')}
categories:
  - {name}
---

# {name}

这里是 {name} 分类的文章集合。

<!-- more -->

## 文章列表

"""
        
        with open(path / 'index.md', 'w', encoding='utf-8') as f:
            f.write(index_content)
            
        self.categories[str(path)] = name
        print(f"✅ 已创建分类：{name} -> {path}")
        return True
        
    def rename_category(self, old_path, new_name):
        """重命名分类"""
        if old_path not in self.categories:
            print(f"错误：找不到分类 {old_path}")
            return False
            
        path = Path(old_path)
        index_path = path / 'index.md'
        if not index_path.exists():
            print(f"错误：找不到索引文件 {index_path}")
            return False
            
        # 更新索引文件
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 更新front matter
        content = re.sub(
            r'(categories:\n\s*- ).*',
            f'\\1{new_name}',
            content
        )
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        self.categories[old_path] = new_name
        print(f"✅ 已重命名分类：{old_path} -> {new_name}")
        return True
        
    def move_category(self, old_path, new_path):
        """移动分类"""
        if old_path not in self.categories:
            print(f"错误：找不到分类 {old_path}")
            return False
            
        old_path = Path(old_path)
        new_path = Path(new_path)
        
        if new_path.exists():
            print(f"错误：目标路径 {new_path} 已存在")
            return False
            
        # 移动目录
        shutil.move(str(old_path), str(new_path))
        
        # 更新分类记录
        category = self.categories.pop(str(old_path))
        self.categories[str(new_path)] = category
        
        print(f"✅ 已移动分类：{old_path} -> {new_path}")
        return True
        
    def delete_category(self, path):
        """删除分类"""
        if path not in self.categories:
            print(f"错误：找不到分类 {path}")
            return False
            
        path = Path(path)
        if not path.exists():
            print(f"错误：目录 {path} 不存在")
            return False
            
        # 检查是否有文章
        articles = list(path.rglob('*.md'))
        if len(articles) > 1:  # 不包括 index.md
            print(f"警告：该分类下还有 {len(articles)-1} 篇文章")
            confirm = input("确定要删除吗？(y/N) ")
            if confirm.lower() != 'y':
                return False
                
        # 删除目录
        shutil.rmtree(path)
        del self.categories[str(path)]
        
        print(f"✅ 已删除分类：{path}")
        return True

def main():
    manager = CategoryManager()
    
    while True:
        print("\n=== 分类管理工具 ===")
        print("1. 列出所有分类")
        print("2. 添加新分类")
        print("3. 重命名分类")
        print("4. 移动分类")
        print("5. 删除分类")
        print("0. 退出")
        
        choice = input("\n请选择操作: ")
        
        if choice == '1':
            manager.list_categories()
            
        elif choice == '2':
            name = input("输入分类名称: ")
            path = input("输入分类路径: ")
            manager.add_category(name, path)
            
        elif choice == '3':
            manager.list_categories()
            path = input("输入要重命名的分类路径: ")
            name = input("输入新名称: ")
            manager.rename_category(path, name)
            
        elif choice == '4':
            manager.list_categories()
            old_path = input("输入要移动的分类路径: ")
            new_path = input("输入目标路径: ")
            manager.move_category(old_path, new_path)
            
        elif choice == '5':
            manager.list_categories()
            path = input("输入要删除的分类路径: ")
            manager.delete_category(path)
            
        elif choice == '0':
            break
            
        else:
            print("无效的选择")

if __name__ == '__main__':
    main() 