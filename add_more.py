import os
import re

def add_more_separator(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 如果已经有分隔符，跳过
    if '<!-- more -->' in content:
        return
    
    # 查找 front matter
    front_matter_match = re.match(r'^---\n.*?\n---\n', content, re.DOTALL)
    if not front_matter_match:
        return
    
    # 在 front matter 之后的第一段添加分隔符
    front_matter_end = front_matter_match.end()
    first_part = content[:front_matter_end].strip()
    rest_part = content[front_matter_end:].strip()
    
    # 找到第一段
    paragraphs = rest_part.split('\n\n')
    if not paragraphs:
        return
        
    # 在第一段后添加分隔符
    first_para = paragraphs[0]
    other_paras = paragraphs[1:]
    
    new_content = f"{first_part}\n\n{first_para}\n\n<!-- more -->\n\n"
    if other_paras:
        new_content += '\n\n'.join(other_paras)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Added separator to {file_path}")

# 遍历所有 Markdown 文件
for root, dirs, files in os.walk("docs/blog/posts"):
    for file in files:
        if file.endswith(".md"):
            file_path = os.path.join(root, file)
            add_more_separator(file_path) 