"""语雀API客户端"""
import time
import random
import requests
from typing import Dict, List, Optional
from urllib.parse import urljoin
from config import YUQUE_CONFIG, MIGRATION_CONFIG

class YuqueClient:
    def __init__(self):
        self.base_url = YUQUE_CONFIG['base_url']
        self.repo = YUQUE_CONFIG['repo']
        self.session = requests.Session()
        
        # 设置cookies和headers
        for name, value in YUQUE_CONFIG['cookies'].items():
            self.session.cookies.set(name, value)
        self.session.headers.update(YUQUE_CONFIG['headers'])
        
        # 请求限制
        self.rate_limit = MIGRATION_CONFIG['rate_limit']
        self.last_request_time = 0

    def _wait_for_rate_limit(self):
        """控制请求频率"""
        now = time.time()
        elapsed = now - self.last_request_time
        min_interval = 60.0 / self.rate_limit['requests_per_minute']
        
        if elapsed < min_interval:
            delay = random.uniform(
                self.rate_limit['min_delay'],
                self.rate_limit['max_delay']
            )
            time.sleep(delay)
        
        self.last_request_time = time.time()

    def _request(self, method: str, endpoint: str, **kwargs) -> Optional[Dict]:
        """发送请求并处理错误"""
        url = urljoin(self.base_url, endpoint)
        retries = MIGRATION_CONFIG['retry']['max_retries']
        
        for attempt in range(retries):
            try:
                self._wait_for_rate_limit()
                response = self.session.request(method, url, **kwargs)
                response.raise_for_status()
                return response.json() if response.text else None
            
            except requests.exceptions.RequestException as e:
                if attempt == retries - 1:
                    raise Exception(f"请求失败 {url}: {str(e)}")
                delay = min(
                    MIGRATION_CONFIG['retry']['delay'] * (attempt + 1),
                    MIGRATION_CONFIG['retry']['max_delay']
                )
                time.sleep(delay)

    def get_toc(self) -> List[Dict]:
        """获取知识库目录结构"""
        endpoint = f"/api/v2/repos/{self.repo}/toc"
        return self._request('GET', endpoint)

    def get_doc(self, slug: str) -> Dict:
        """获取文档内容"""
        endpoint = f"/api/v2/repos/{self.repo}/docs/{slug}"
        return self._request('GET', endpoint)

    def get_doc_by_url(self, doc_url: str) -> Dict:
        """通过URL获取文档"""
        # 从URL中提取slug
        parts = doc_url.split('/')
        if len(parts) < 2:
            raise ValueError(f"无效的文档URL: {doc_url}")
        slug = parts[-1]
        return self.get_doc(slug)

    def validate_access(self) -> bool:
        """验证访问权限"""
        try:
            self.get_toc()
            return True
        except Exception:
            return False
