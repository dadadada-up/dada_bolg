"""图片处理模块"""
import os
import re
import requests
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.parse import urlparse
from config import MIGRATION_CONFIG

class ImageHandler:
    def __init__(self, output_dir: str):
        self.output_dir = Path(output_dir)
        self.assets_dir = self.output_dir / MIGRATION_CONFIG['assets_dir']
        self.assets_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        
    def extract_images(self, content: str) -> List[str]:
        """从Markdown内容中提取图片URL"""
        # Markdown图片语法
        md_pattern = r'!\[.*?\]\((.*?)\)'
        # HTML图片标签
        html_pattern = r'<img[^>]*src=[\'"]([^\'"]*)[\'"][^>]*>'
        
        urls = []
        urls.extend(re.findall(md_pattern, content))
        urls.extend(re.findall(html_pattern, content))
        return list(set(urls))  # 去重

    def download_image(self, url: str, article_slug: str) -> Tuple[str, str]:
        """下载图片并返回新路径"""
        try:
            # 解析URL获取文件名
            parsed = urlparse(url)
            filename = os.path.basename(parsed.path)
            if not filename:
                filename = f"image_{hash(url)}.png"
            
            # 创建文章图片目录
            image_dir = self.assets_dir / article_slug
            image_dir.mkdir(exist_ok=True)
            
            # 下载图片
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # 保存图片
            image_path = image_dir / filename
            with open(image_path, 'wb') as f:
                f.write(response.content)
            
            # 返回相对路径
            relative_path = f"/assets/images/{article_slug}/{filename}"
            return url, relative_path
            
        except Exception as e:
            print(f"下载图片失败 {url}: {str(e)}")
            return url, url  # 失败时返回原URL

    def process_article_images(self, content: str, article_slug: str) -> Tuple[str, Dict[str, List[str]]]:
        """处理文章中的所有图片"""
        image_urls = self.extract_images(content)
        results = {
            'success': [],
            'failed': []
        }
        
        for url in image_urls:
            old_url, new_path = self.download_image(url, article_slug)
            if old_url == new_path:  # 下载失败
                results['failed'].append(old_url)
                continue
                
            results['success'].append(old_url)
            # 替换内容中的图片URL
            content = content.replace(old_url, new_path)
            
        return content, results
