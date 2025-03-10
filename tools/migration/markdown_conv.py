"""Markdown转换器"""
import re
import yaml
from typing import Dict, List, Optional, Tuple
from datetime import datetime

class MarkdownConverter:
    def __init__(self):
        self.default_category = '默认'
        self.front_matter_pattern = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
        
    def _clean_title(self, title: str) -> str:
        """清理标题中的特殊字符"""
        title = title.strip().replace('\n', ' ')
        title = re.sub(r'\s+', ' ', title)  # 合并多个空格
        return title
    
    def _format_date(self, date_str: str) -> str:
        """格式化日期"""
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.strftime('%Y-%m-%d')
        except:
            return datetime.now().strftime('%Y-%m-%d')
    
    def _extract_front_matter(self, content: str) -> Tuple[Dict, str]:
        """从内容中提取front matter"""
        front_matter = {}
        body = content
        
        # 检查是否有front matter
        if content.startswith('---\n'):
            try:
                # 分割front matter和正文
                parts = content.split('---\n', 2)
                if len(parts) >= 3:
                    front_matter = yaml.safe_load(parts[1])
                    body = parts[2]
            except Exception:
                pass
                
        return front_matter, body
        
    def _generate_front_matter(self, metadata: Dict) -> str:
        """生成front matter"""
        front_matter = ['---']
        
        # 必需字段
        front_matter.append(f"title: {metadata.get('title', '未命名')}")
        front_matter.append(f"date: {metadata.get('date', datetime.now().strftime('%Y-%m-%d'))}")
        
        # 可选字段
        if 'updated' in metadata:
            front_matter.append(f"updated: {metadata['updated']}")
            
        if 'category' in metadata:
            front_matter.append(f"category: {metadata['category']}")
            
        if 'tags' in metadata and metadata['tags']:
            front_matter.append('tags:')
            for tag in metadata['tags']:
                front_matter.append(f'  - {tag}')
                
        front_matter.append('---\n')
        return '\n'.join(front_matter)
        
    def _process_content(self, content: str) -> str:
        """处理Markdown内容"""
        # 修复标题格式
        content = re.sub(r'^#{1,6}(?!\s)', r'\g<0> ', content, flags=re.MULTILINE)
        
        # 修复列表格式
        content = re.sub(r'^[-*+](?!\s)', r'\g<0> ', content, flags=re.MULTILINE)
        
        # 修复代码块格式
        content = re.sub(r'```(\w+)$', r'```\1\n', content, flags=re.MULTILINE)
        
        # 修复链接格式
        content = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', lambda m: f'[{m.group(1).strip()}]({m.group(2).strip()})', content)
        
        return content.strip()
        
    def convert_to_mkdocs(self, doc: Dict) -> str:
        """转换为MkDocs格式"""
        # 提取原有的front matter
        original_content = doc.get('body', '').strip()
        front_matter, content = self._extract_front_matter(original_content)
        
        # 准备metadata
        metadata = {
            'title': self._clean_title(doc.get('title', front_matter.get('title', '未命名'))),
            'date': self._format_date(doc.get('created_at', front_matter.get('date', ''))),
            'updated': self._format_date(doc.get('updated_at', front_matter.get('updated', ''))),
            'category': doc.get('category', front_matter.get('category', self.default_category)),
            'tags': doc.get('tags', front_matter.get('tags', []))
        }
        
        # 生成新的front matter
        new_front_matter = self._generate_front_matter(metadata)
        
        # 处理正文内容
        processed_content = self._process_content(content)
        
        # 组合文档
        return new_front_matter + processed_content 