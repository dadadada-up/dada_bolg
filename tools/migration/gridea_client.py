"""Gridea API 客户端"""
import requests
from typing import Dict, List, Optional
from .config import GRIDEA_CONFIG

class GrideaClient:
    def __init__(self):
        self.api_token = GRIDEA_CONFIG['API_TOKEN']
        self.base_url = GRIDEA_CONFIG['API_BASE_URL']
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        })

    def get_posts(self, page: int = 1, per_page: int = 10) -> Dict:
        """获取文章列表"""
        response = self.session.get(
            f"{self.base_url}/posts",
            params={'page': page, 'per_page': per_page}
        )
        response.raise_for_status()
        return response.json()

    def get_post(self, post_id: str) -> Dict:
        """获取单篇文章详情"""
        response = self.session.get(f"{self.base_url}/posts/{post_id}")
        response.raise_for_status()
        return response.json()

    def get_categories(self) -> List[Dict]:
        """获取分类列表"""
        response = self.session.get(f"{self.base_url}/categories")
        response.raise_for_status()
        return response.json()

    def get_tags(self) -> List[Dict]:
        """获取标签列表"""
        response = self.session.get(f"{self.base_url}/tags")
        response.raise_for_status()
        return response.json() 