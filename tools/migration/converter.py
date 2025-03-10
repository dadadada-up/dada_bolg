"""内容转换器"""
import os
from typing import Dict, List
from datetime import datetime
from .config import MKDOCS_CONFIG

class ContentConverter:
    def __init__(self):
        self.category_mapping = MKDOCS_CONFIG['CATEGORY_MAPPING']
        self.docs_dir = MKDOCS_CONFIG['DOCS_DIR']

    def convert_post(self, post: Dict) -> Dict:
        """转换文章格式"""
        # 默认分类
        target_dir = os.path.join(self.docs_dir, self.category_mapping['默认'])
        
        # 生成文件名：使用原始文件名，移除 .md 后缀
        filename = post['filename']
        if filename.endswith('.md'):
            filename = filename[:-3]
        filename = f"{filename}.md"
        
        # 构建 front matter
        front_matter = [
            '---',
            f"title: {post['title']}",
            f"date: {post['date']}",
        ]
        
        if post.get('feature'):
            front_matter.append(f"feature: {post['feature']}")
            
        front_matter.append('---\n')
        
        # 组合内容
        content = '\n'.join(front_matter) + post['content']
        
        return {
            'target_dir': target_dir,
            'filename': filename,
            'content': content
        }

    def ensure_directory(self, directory: str) -> None:
        """确保目录存在"""
        os.makedirs(directory, exist_ok=True) 