import os
import re
from pathlib import Path

def fix_image_paths(file_path):
    """修复文章中的图片路径"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 计算相对路径深度
    rel_path = Path(file_path).relative_to('docs/blog/posts')
    depth = len(rel_path.parts) - 1
    relative_prefix = '../' * depth
    
    # 替换绝对路径为相对路径
    def replace_path(match):
        path = match.group(2)
        if path.startswith('/assets/'):
            return f'![{match.group(1)}]({relative_prefix}../../{path[1:]})'
        return match.group(0)
    
    # 匹配 Markdown 图片语法
    pattern = r'!\[(.*?)\]\((/assets/.*?)\)'
    new_content = re.sub(pattern, replace_path, content)
    
    # 匹配 HTML 图片标签
    html_pattern = r'<img[^>]*src="(/assets/[^"]*)"[^>]*>'
    def replace_html_path(match):
        path = match.group(1)
        return f'<img src="{relative_prefix}../../{path[1:]}" alt="image" />'
    
    new_content = re.sub(html_pattern, replace_html_path, new_content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file_path}')

def main():
    # 遍历所有 Markdown 文件
    for root, _, files in os.walk('docs/blog/posts'):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                fix_image_paths(file_path)

if __name__ == '__main__':
    main() 