import os
import re
import requests
from pathlib import Path
from typing import Dict, List, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageDownloader:
    def __init__(self, docs_dir: str = "docs", image_dir: str = "assets/images"):
        self.docs_dir = Path(docs_dir)
        self.image_dir = Path(image_dir)
        self.image_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.downloaded_images: Dict[str, str] = {}
        self.placeholder_image = "/assets/images/placeholder.png"

    def download_image(self, url: str) -> str:
        """下载图片并返回新的相对路径"""
        if url in self.downloaded_images:
            return self.downloaded_images[url]

        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # 生成一个唯一的文件名
            image_name = f"image_{len(self.downloaded_images) + 1}.png"
            image_path = self.image_dir / image_name
            
            with open(image_path, "wb") as f:
                f.write(response.content)
            
            relative_path = f"/{self.image_dir}/{image_name}"
            self.downloaded_images[url] = relative_path
            logger.info(f"Downloaded image: {url} -> {relative_path}")
            return relative_path
        except Exception as e:
            logger.error(f"Failed to download image {url}: {e}")
            return url

    def process_markdown_file(self, file_path: Path) -> None:
        """处理单个 Markdown 文件中的图片链接"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 匹配Markdown格式的飞书图片链接
            md_pattern = r"!\[(.*?)\]\((\.\.)?https://k0e3zvw6gix\.feishu\.cn/[^)]+\)"
            
            # 匹配HTML格式的飞书图片链接
            html_pattern = r'<img[^>]*src="(https://k0e3zvw6gix\.feishu\.cn/[^"]+)"[^>]*>'
            
            # 添加警告并替换为占位图片
            warning = "<!-- 警告：此图片链接已过期，显示为占位图片 -->"
            
            def replace_md_with_warning(match):
                alt_text = match.group(1) or "图片已过期"
                return f"{warning}\n![{alt_text}]({self.placeholder_image})"
            
            def replace_html_with_warning(match):
                return f'{warning}\n<img src="{self.placeholder_image}" alt="图片已过期" />'
            
            # 替换Markdown格式的链接
            new_content = re.sub(md_pattern, replace_md_with_warning, content)
            
            # 替换HTML格式的链接
            new_content = re.sub(html_pattern, replace_html_with_warning, new_content)
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                logger.info(f"Updated file: {file_path}")
            
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")

    def process_all_files(self) -> None:
        """处理所有 Markdown 文件"""
        for file_path in self.docs_dir.rglob("*.md"):
            logger.info(f"Processing file: {file_path}")
            self.process_markdown_file(file_path)

def main():
    downloader = ImageDownloader()
    downloader.process_all_files()

if __name__ == "__main__":
    main() 