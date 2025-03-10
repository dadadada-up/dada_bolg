#!/usr/bin/env python
import os
import re
import yaml
from pathlib import Path
import shutil
from datetime import datetime

class PostManager:
    def __init__(self, docs_dir='docs'):
        self.docs_dir = Path(docs_dir)
        self.posts = self._load_posts()
        
    def _load_posts(self):
        """加载所有文章"""
        posts = {}
        for path in self.docs_dir.rglob('*.md'):
            if path.name == 'index.md':
                continue
                
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                # 提取front matter
                front_matter = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
                if front_matter:
                    try:
                        meta = yaml.safe_load(front_matter.group(1))
                        posts[str(path)] = {
                            'title': meta.get('title', '未命名'),
                            'date': meta.get('date', datetime.now().strftime('%Y-%m-%d')),
                            'categories': meta.get('categories', []),
                            'tags': meta.get('tags', [])
                        }
                    except yaml.YAMLError:
                        continue
        return posts
        
    def list_posts(self, category=None):
        """列出文章"""
        print("\n文章列表：")
        for path, meta in self.posts.items():
            if category and category not in meta['categories']:
                continue
            print(f"{meta['title']} ({meta['date']}) - {path}")
            
    def move_post(self, old_path, new_path):
        """移动文章"""
        if old_path not in self.posts:
            print(f"错误：找不到文章 {old_path}")
            return False
            
        old_path = Path(old_path)
        new_path = Path(new_path)
        
        if new_path.exists():
            print(f"错误：目标路径 {new_path} 已存在")
            return False
            
        # 移动文件
        new_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(old_path), str(new_path))
        
        # 更新记录
        self.posts[str(new_path)] = self.posts.pop(str(old_path))
        
        # 更新索引文件
        self._update_index_files(old_path, new_path)
        
        print(f"✅ 已移动文章：{old_path} -> {new_path}")
        return True
        
    def _update_index_files(self, old_path, new_path):
        """更新索引文件"""
        # 更新旧目录的索引
        old_index = old_path.parent / 'index.md'
        if old_index.exists():
            self._remove_from_index(old_index, old_path.name)
            
        # 更新新目录的索引
        new_index = new_path.parent / 'index.md'
        if new_index.exists():
            self._add_to_index(new_index, new_path.name, self.posts[str(new_path)]['title'])
            
    def _remove_from_index(self, index_path, filename):
        """从索引文件中移除条目"""
        with open(index_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # 查找并移除对应的行
        new_lines = [
            line for line in lines
            if filename not in line
        ]
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
            
    def _add_to_index(self, index_path, filename, title):
        """添加条目到索引文件"""
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 在最后一个列表项后添加新文章
        new_entry = f"- [{title}]({filename})\n"
        
        # 查找最后一个列表项
        last_list_item = re.search(r'^- .*$', content, re.MULTILINE)
        if last_list_item:
            pos = last_list_item.end()
            content = content[:pos] + '\n' + new_entry + content[pos:]
        else:
            content += '\n' + new_entry
            
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
    def update_post(self, path, **kwargs):
        """更新文章元数据"""
        if path not in self.posts:
            print(f"错误：找不到文章 {path}")
            return False
            
        path = Path(path)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 提取front matter
        front_matter = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not front_matter:
            print(f"错误：无法解析文章 {path} 的front matter")
            return False
            
        try:
            meta = yaml.safe_load(front_matter.group(1))
            
            # 更新元数据
            for key, value in kwargs.items():
                if value is not None:
                    meta[key] = value
                    
            # 生成新的front matter
            new_front_matter = yaml.dump(meta, allow_unicode=True)
            
            # 替换原有的front matter
            new_content = f"---\n{new_front_matter}---{content[front_matter.end():]}"
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            # 更新记录
            self.posts[str(path)].update(kwargs)
            
            print(f"✅ 已更新文章：{path}")
            return True
            
        except yaml.YAMLError as e:
            print(f"错误：更新文章 {path} 失败 - {str(e)}")
            return False
            
    def delete_post(self, path):
        """删除文章"""
        if path not in self.posts:
            print(f"错误：找不到文章 {path}")
            return False
            
        path = Path(path)
        if not path.exists():
            print(f"错误：文件 {path} 不存在")
            return False
            
        # 删除文件
        path.unlink()
        
        # 更新索引文件
        index_path = path.parent / 'index.md'
        if index_path.exists():
            self._remove_from_index(index_path, path.name)
            
        # 更新记录
        del self.posts[str(path)]
        
        print(f"✅ 已删除文章：{path}")
        return True

def main():
    manager = PostManager()
    
    while True:
        print("\n=== 文章管理工具 ===")
        print("1. 列出所有文章")
        print("2. 按分类列出文章")
        print("3. 移动文章")
        print("4. 更新文章")
        print("5. 删除文章")
        print("0. 退出")
        
        choice = input("\n请选择操作: ")
        
        if choice == '1':
            manager.list_posts()
            
        elif choice == '2':
            category = input("输入分类名称: ")
            manager.list_posts(category)
            
        elif choice == '3':
            manager.list_posts()
            old_path = input("输入要移动的文章路径: ")
            new_path = input("输入目标路径: ")
            manager.move_post(old_path, new_path)
            
        elif choice == '4':
            manager.list_posts()
            path = input("输入要更新的文章路径: ")
            print("\n可更新的字段：")
            print("1. 标题")
            print("2. 分类")
            print("3. 标签")
            field = input("选择要更新的字段 (1-3): ")
            
            if field == '1':
                title = input("输入新标题: ")
                manager.update_post(path, title=title)
            elif field == '2':
                categories = input("输入新分类 (多个分类用逗号分隔): ").split(',')
                manager.update_post(path, categories=categories)
            elif field == '3':
                tags = input("输入新标签 (多个标签用逗号分隔): ").split(',')
                manager.update_post(path, tags=tags)
            else:
                print("无效的选择")
                
        elif choice == '5':
            manager.list_posts()
            path = input("输入要删除的文章路径: ")
            confirm = input("确定要删除吗？(y/N) ")
            if confirm.lower() == 'y':
                manager.delete_post(path)
                
        elif choice == '0':
            break
            
        else:
            print("无效的选择")

if __name__ == '__main__':
    main() 