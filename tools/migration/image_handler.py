"""图片处理模块"""
import os
import re
import time
import hashlib
import requests
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from urllib.parse import urlparse, unquote

logger = logging.getLogger(__name__)

class ImageHandler:
    def __init__(self, output_dir: str):
        self.output_dir = Path(output_dir)
        self.assets_dir = self.output_dir / 'assets/images'
        self.assets_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.downloaded_images = {}
        self.failed_downloads = set()
        
    def _get_image_hash(self, url: str) -> str:
        """生成图片URL的哈希值"""
        return hashlib.md5(url.encode()).hexdigest()[:8]
        
    def _get_image_extension(self, url: str, content_type: Optional[str] = None) -> str:
        """获取图片扩展名"""
        # 从URL中获取
        parsed = urlparse(unquote(url))
        ext = os.path.splitext(parsed.path)[1]
        if ext and ext.startswith('.'):
            return ext.lower()
            
        # 从Content-Type获取
        if content_type:
            if 'jpeg' in content_type or 'jpg' in content_type:
                return '.jpg'
            elif 'png' in content_type:
                return '.png'
            elif 'gif' in content_type:
                return '.gif'
            elif 'webp' in content_type:
                return '.webp'
                
        # 默认返回.png
        return '.png'
        
    def _extract_images(self, content: str) -> List[str]:
        """从Markdown内容中提取图片URL"""
        # Markdown图片语法
        md_pattern = r'!\[.*?\]\((.*?)\)'
        # HTML图片标签
        html_pattern = r'<img[^>]*src=[\'"]([^\'"]*)[\'"][^>]*>'
        
        urls = []
        urls.extend(re.findall(md_pattern, content))
        urls.extend(re.findall(html_pattern, content))
        
        # 清理URL
        cleaned_urls = []
        for url in urls:
            url = url.strip()
            if url and not url.startswith('data:'):  # 排除base64图片
                cleaned_urls.append(url)
                
        return list(set(cleaned_urls))  # 去重
        
    def _download_image(self, url: str, article_slug: str, retries: int = 3) -> Tuple[str, str]:
        """下载图片并返回新路径"""
        if url in self.downloaded_images:
            return url, self.downloaded_images[url]
            
        if url in self.failed_downloads:
            return url, url
            
        for attempt in range(retries):
            try:
                # 下载图片
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                
                # 获取Content-Type
                content_type = response.headers.get('Content-Type', '')
                
                # 生成文件名
                image_hash = self._get_image_hash(url)
                extension = self._get_image_extension(url, content_type)
                filename = f"{image_hash}{extension}"
                
                # 创建文章图片目录
                image_dir = self.assets_dir / article_slug
                image_dir.mkdir(exist_ok=True)
                
                # 保存图片
                image_path = image_dir / filename
                with open(image_path, 'wb') as f:
                    f.write(response.content)
                
                # 生成相对路径
                relative_path = f"/assets/images/{article_slug}/{filename}"
                self.downloaded_images[url] = relative_path
                
                logger.info(f"已下载图片: {url} -> {relative_path}")
                return url, relative_path
                
            except Exception as e:
                if attempt < retries - 1:
                    delay = (attempt + 1) * 2
                    logger.warning(f"下载图片失败 {url}, 重试 ({attempt + 1}/{retries}): {str(e)}")
                    time.sleep(delay)
                else:
                    logger.error(f"下载图片失败 {url}: {str(e)}")
                    self.failed_downloads.add(url)
                    return url, url
                    
    def process_article_images(self, content: str, article_slug: str) -> Tuple[str, Dict[str, List[str]]]:
        """处理文章中的所有图片"""
        image_urls = self._extract_images(content)
        results = {
            'success': [],
            'failed': []
        }
        
        for url in image_urls:
            old_url, new_path = self._download_image(url, article_slug)
            if old_url == new_path:  # 下载失败
                results['failed'].append(old_url)
                continue
                
            results['success'].append(old_url)
            # 替换内容中的图片URL
            content = content.replace(old_url, new_path)
            
        return content, results 