import os
import re
from urllib.parse import unquote

def fix_markdown_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. 移除 Word 风格的目录链接
    content = re.sub(r'\[([^\]]+)\]\(#_Toc\d+\)', r'\1', content)
    
    # 2. 修复图片路径
    def fix_image_path(match):
        path = match.group(2)  # 获取图片路径
        # URL 解码
        decoded_path = unquote(path)
        # 如果路径为空或只有斜杠，使用占位图片
        if not decoded_path or decoded_path == '/' or decoded_path == 'assets/images/':
            return f'![{match.group(1)}](/assets/images/placeholder.png)'
        # 如果路径不以 /assets/images 开头，修改路径
        if not decoded_path.startswith('/assets/images'):
            # 提取文件名
            filename = os.path.basename(decoded_path)
            if filename and filename != '/':
                return f'![{match.group(1)}](/assets/images/{filename})'
            else:
                return f'![{match.group(1)}](/assets/images/placeholder.png)'
        return f'![{match.group(1)}]{decoded_path}'
    
    # 处理 Markdown 图片语法
    content = re.sub(r'!\[(.*?)\]\((.*?)\)', fix_image_path, content)
    
    # 处理 HTML 图片标签
    def fix_html_image(match):
        path = match.group(1)
        decoded_path = unquote(path)
        if not decoded_path or decoded_path == '/' or decoded_path == 'assets/images/':
            return f'<img src="/assets/images/placeholder.png" alt="placeholder" />'
        if not decoded_path.startswith('/assets/images'):
            filename = os.path.basename(decoded_path)
            if filename and filename != '/':
                return f'<img src="/assets/images/{filename}" alt="{filename}" />'
            else:
                return f'<img src="/assets/images/placeholder.png" alt="placeholder" />'
        return f'<img src="{decoded_path}" alt="image" />'
    
    content = re.sub(r'<img[^>]*src="([^"]*)"[^>]*>', fix_html_image, content)
    
    # 3. 移除空的标题
    content = re.sub(r'###\s*$', '', content)
    
    # 4. 移除 WordPress 短代码
    content = re.sub(r'/wp:.*?\n', '', content)
    content = re.sub(r'wp:.*?\n', '', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# 修复特定文件
target_file = 'docs/blog/posts/work/20180202-交互设计-控件设计.md'
if os.path.exists(target_file):
    fix_markdown_file(target_file)
    print(f"Fixed {target_file}")

# 修复所有文件
for root, dirs, files in os.walk("docs/blog/posts"):
    for file in files:
        if file.endswith(".md"):
            file_path = os.path.join(root, file)
            fix_markdown_file(file_path)
            print(f"Fixed {file_path}") 