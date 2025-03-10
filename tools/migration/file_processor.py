"""Markdown 文件处理器"""
import os
import yaml
from datetime import datetime
from typing import Dict, List, Optional

class FileProcessor:
    def __init__(self, posts_dir: str):
        self.posts_dir = posts_dir

    def get_all_posts(self) -> List[Dict]:
        """获取所有文章"""
        posts = []
        for filename in os.listdir(self.posts_dir):
            if filename.endswith('.md'):
                post = self.read_post(filename)
                if post:
                    posts.append(post)
        return posts

    def read_post(self, filename: str) -> Optional[Dict]:
        """读取单个文章"""
        try:
            filepath = os.path.join(self.posts_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # 分离 front matter 和正文
            if content.startswith('---'):
                parts = content.split('---', 2)[1:]
                if len(parts) >= 2:
                    front_matter = yaml.safe_load(parts[0])
                    body = parts[1].strip()
                    
                    # 构建文章数据
                    post = {
                        'filename': filename,
                        'title': front_matter.get('title', ''),
                        'date': front_matter.get('date', ''),
                        'content': body,
                        'published': front_matter.get('published', True),
                        'feature': front_matter.get('feature', ''),
                        # 可以添加更多字段
                    }
                    return post
            return None
        except Exception as e:
            print(f"处理文件 {filename} 时出错: {str(e)}")
            return None 