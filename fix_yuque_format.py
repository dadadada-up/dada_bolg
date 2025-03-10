import os
import re
from datetime import datetime

def fix_front_matter(content, file_path):
    """修复 front matter 格式"""
    # 提取原有的 front matter
    match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if not match:
        return content
        
    front_matter_text = match.group(1)
    
    # 提取标题
    title_match = re.search(r'title:\s*(.*?)(?:\n|$)', front_matter_text)
    title = title_match.group(1) if title_match else "未命名"
    
    # 提取日期
    date_match = re.search(r'\d{2}-\d{2}\s+\d{2}:\d{2}', front_matter_text)
    if date_match:
        date_str = f"2024-{date_match.group(0)[:5]}"
    else:
        date_str = datetime.now().strftime('%Y-%m-%d')
    
    # 根据文件路径确定分类
    def get_category(file_path):
        if '/ai/' in file_path:
            return 'AI'
        elif '/product/' in file_path:
            return '产品'
        elif '/tech/' in file_path:
            return '工具'
        elif '/investment/' in file_path or 'finance' in file_path:
            return 'Finance'
        else:
            return '产品'
    
    # 生成新的 front matter
    new_front_matter = f"""---
title: "{title}"
date: {date_str}
categories:
  - {get_category(file_path)}
---

"""
    
    # 替换原有的 front matter
    new_content = content[match.end():]
    # 移除"返回文档"
    new_content = new_content.replace('返回文档\n', '')
    
    return new_front_matter + new_content

def process_file(file_path):
    """处理单个文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = fix_front_matter(content, file_path)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        print(f"已修复: {file_path}")
        
    except Exception as e:
        print(f"处理 {file_path} 时出错: {e}")

def main():
    """处理所有文章"""
    # 处理所有 markdown 文件
    for root, _, files in os.walk('docs'):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                process_file(file_path)

if __name__ == '__main__':
    main() 