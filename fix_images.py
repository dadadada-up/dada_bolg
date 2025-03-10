import os
import re
from pathlib import Path

def convert_image_paths(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 计算相对路径深度
    depth = len(Path(file_path).relative_to('docs/blog/posts').parts) - 1
    relative_prefix = '../' * depth
    
    # 替换绝对路径为相对路径
    def replace_path(match):
        path = match.group(1)
        if path.startswith('/assets/'):
            return f'![{match.group(1)}]({relative_prefix}../../assets{path[7:]})'
        return match.group(0)
    
    # 匹配 Markdown 图片语法
    pattern = r'!\[(.*?)\]\(/assets/.*?\)'
    new_content = re.sub(pattern, replace_path, content)
    
    # 替换已过期或找不到的图片为 placeholder
    new_content = re.sub(r'!\[(.*?)\]\(/assets/images/图片已过期.*?\)', r'![\1](../../assets/images/placeholder.png)', new_content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file_path}')

def main():
    # 确保 assets/images 目录存在
    os.makedirs('docs/assets/images', exist_ok=True)
    
    # 复制 placeholder 图片如果不存在
    placeholder_path = 'docs/assets/images/placeholder.png'
    if not os.path.exists(placeholder_path):
        # 创建一个简单的占位图提示
        print(f'Warning: {placeholder_path} does not exist')
    
    # 遍历所有 Markdown 文件
    for root, _, files in os.walk('docs/blog/posts'):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                convert_image_paths(file_path)

if __name__ == '__main__':
    main() 