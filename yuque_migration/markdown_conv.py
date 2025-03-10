"""Markdown转换器"""
import re
from typing import Dict
from datetime import datetime

class MarkdownConverter:
    def __init__(self):
        pass
        
    def _clean_title(self, title: str) -> str:
        """清理标题中的特殊字符"""
        return title.strip().replace('\n', ' ')
    
    def _format_date(self, date_str: str) -> str:
        """格式化日期"""
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.strftime('%Y-%m-%d')
        except:
            return datetime.now().strftime('%Y-%m-%d')
    
    def convert_to_mkdocs(self, doc: Dict) -> str:
        """转换为MkDocs格式"""
        # 提取元数据
        title = self._clean_title(doc.get('title', ''))
        created_at = self._format_date(doc.get('created_at', ''))
        updated_at = self._format_date(doc.get('updated_at', ''))
        
        # 生成front matter
        front_matter = [
            '---',
            f'title: {title}',
            f'date: {created_at}',
        ]
        
        if updated_at != created_at:
            front_matter.append(f'updated: {updated_at}')
            
        if doc.get('category'):
            front_matter.append(f"category: {doc['category']}")
            
        if doc.get('tags'):
            front_matter.append('tags:')
            for tag in doc['tags']:
                front_matter.append(f'  - {tag}')
                
        front_matter.append('---')
        
        # 处理正文内容
        content = doc.get('body', '').strip()
        
        # 组合文档
        return '\n'.join(front_matter) + '\n\n' + content
    
    def generate_index(self, docs: list) -> str:
        """生成索引页面"""
        lines = [
            '# 文档索引',
            '',
            '## 最近更新',
            ''
        ]
        
        # 按更新时间排序
        sorted_docs = sorted(
            docs, 
            key=lambda x: x.get('updated_at', ''), 
            reverse=True
        )
        
        # 生成文档列表
        for doc in sorted_docs[:10]:  # 只显示最近10篇
            title = self._clean_title(doc.get('title', ''))
            date = self._format_date(doc.get('updated_at', ''))
            lines.append(f"- [{title}]({doc['slug']}) - {date}")
            
        return '\n'.join(lines)
