"""WordPress XML 解析器"""
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
import html
import re

class WordPressParser:
    def __init__(self, xml_file: str):
        self.xml_file = Path(xml_file)
        self.ns = {
            'content': 'http://purl.org/rss/1.0/modules/content/',
            'wp': 'http://wordpress.org/export/1.2/',
            'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
            'dc': 'http://purl.org/dc/elements/1.1/'
        }
        self.tree = None
        self.channel = None
        
    def parse(self):
        """解析 WordPress XML 文件"""
        try:
            self.tree = ET.parse(self.xml_file)
            self.channel = self.tree.getroot().find('channel')
            return True
        except Exception as e:
            print(f"解析 XML 文件失败: {e}")
            return False
            
    def get_categories(self) -> List[Dict]:
        """获取所有分类"""
        categories = []
        for cat in self.channel.findall('wp:category', self.ns):
            categories.append({
                'id': cat.find('wp:term_id', self.ns).text,
                'name': cat.find('wp:cat_name', self.ns).text,
                'slug': cat.find('wp:category_nicename', self.ns).text,
                'parent': cat.find('wp:category_parent', self.ns).text
            })
        return categories
        
    def get_posts(self) -> List[Dict]:
        """获取所有文章"""
        posts = []
        for item in self.channel.findall('item'):
            post_type = item.find('wp:post_type', self.ns).text
            status = item.find('wp:status', self.ns).text
            
            # 只处理已发布的文章
            if post_type == 'post' and status == 'publish':
                post = {
                    'id': item.find('wp:post_id', self.ns).text,
                    'title': item.find('title').text,
                    'content': item.find('content:encoded', self.ns).text,
                    'excerpt': item.find('excerpt:encoded', self.ns).text,
                    'date': item.find('wp:post_date', self.ns).text,
                    'modified': item.find('wp:post_modified', self.ns).text,
                    'slug': item.find('wp:post_name', self.ns).text,
                    'categories': [],
                    'tags': []
                }
                
                # 获取分类
                for cat in item.findall('category'):
                    if cat.get('domain') == 'category':
                        post['categories'].append({
                            'name': cat.text,
                            'slug': cat.get('nicename')
                        })
                        
                # 获取标签
                for tag in item.findall('category'):
                    if tag.get('domain') == 'post_tag':
                        post['tags'].append({
                            'name': tag.text,
                            'slug': tag.get('nicename')
                        })
                        
                posts.append(post)
                
        return posts
        
    def get_attachments(self) -> List[Dict]:
        """获取所有附件（图片等）"""
        attachments = []
        for item in self.channel.findall('item'):
            if item.find('wp:post_type', self.ns).text == 'attachment':
                attachment = {
                    'id': item.find('wp:post_id', self.ns).text,
                    'title': item.find('title').text,
                    'url': item.find('wp:attachment_url', self.ns).text,
                    'date': item.find('wp:post_date', self.ns).text,
                    'parent_id': item.find('wp:post_parent', self.ns).text
                }
                attachments.append(attachment)
                
        return attachments
        
    def clean_content(self, content: str) -> str:
        """清理文章内容"""
        if not content:
            return ''
            
        # 解码 HTML 实体
        content = html.unescape(content)
        
        # 移除 WordPress 短代码
        content = re.sub(r'\[.*?\]', '', content)
        
        # 清理多余的空行
        content = re.sub(r'\n\s*\n', '\n\n', content)
        
        return content.strip() 