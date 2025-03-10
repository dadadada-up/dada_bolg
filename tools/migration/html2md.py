"""HTML 到 Markdown 的转换器"""
import re
from bs4 import BeautifulSoup
from typing import Dict, List, Optional

class HTML2Markdown:
    def __init__(self):
        self.image_map = {}  # 用于存储图片URL映射
        
    def convert(self, html: str) -> str:
        """将 HTML 转换为 Markdown"""
        if not html:
            return ''
            
        soup = BeautifulSoup(html, 'html.parser')
        
        # 移除空节点
        for element in soup(text=lambda text: isinstance(text, str) and not text.strip()):
            element.extract()
            
        # 转换内容
        content = []
        for element in soup.children:
            if element.name:
                content.append(self._convert_element(element))
            elif element.string and element.string.strip():
                content.append(element.string.strip())
                
        return '\n\n'.join(filter(None, content))
        
    def _convert_element(self, element) -> str:
        """转换单个 HTML 元素"""
        if element.name in ['p', 'div']:
            return self._convert_paragraph(element)
        elif element.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            return self._convert_heading(element)
        elif element.name == 'a':
            return self._convert_link(element)
        elif element.name == 'img':
            return self._convert_image(element)
        elif element.name in ['ul', 'ol']:
            return self._convert_list(element)
        elif element.name == 'blockquote':
            return self._convert_quote(element)
        elif element.name in ['pre', 'code']:
            return self._convert_code(element)
        elif element.name == 'hr':
            return '---'
        elif element.name in ['strong', 'b']:
            return f"**{element.get_text().strip()}**"
        elif element.name in ['em', 'i']:
            return f"*{element.get_text().strip()}*"
        else:
            return element.get_text().strip()
            
    def _convert_paragraph(self, element) -> str:
        """转换段落"""
        text = []
        for child in element.children:
            if child.name:
                text.append(self._convert_element(child))
            elif child.string and child.string.strip():
                text.append(child.string.strip())
        return ' '.join(text)
        
    def _convert_heading(self, element) -> str:
        """转换标题"""
        level = int(element.name[1])
        return f"{'#' * level} {element.get_text().strip()}"
        
    def _convert_link(self, element) -> str:
        """转换链接"""
        text = element.get_text().strip()
        href = element.get('href', '')
        if href and text:
            return f"[{text}]({href})"
        return text
        
    def _convert_image(self, element) -> str:
        """转换图片"""
        alt = element.get('alt', '')
        src = element.get('src', '')
        if src:
            # 如果有图片映射，使用映射后的URL
            src = self.image_map.get(src, src)
            return f"![{alt}]({src})"
        return ''
        
    def _convert_list(self, element, level: int = 0) -> str:
        """转换列表"""
        items = []
        for i, item in enumerate(element.find_all('li', recursive=False)):
            prefix = '  ' * level
            if element.name == 'ol':
                prefix += f"{i+1}. "
            else:
                prefix += '- '
                
            # 处理子列表
            subitems = []
            for child in item.children:
                if child.name in ['ul', 'ol']:
                    subitems.append(self._convert_list(child, level + 1))
                elif child.string and child.string.strip():
                    subitems.append(child.string.strip())
                elif child.name:
                    subitems.append(self._convert_element(child))
                    
            items.append(f"{prefix}{' '.join(filter(None, subitems))}")
            
        return '\n'.join(items)
        
    def _convert_quote(self, element) -> str:
        """转换引用"""
        lines = []
        for line in element.get_text().strip().split('\n'):
            lines.append(f"> {line.strip()}")
        return '\n'.join(lines)
        
    def _convert_code(self, element) -> str:
        """转换代码块"""
        code = element.get_text().strip()
        if element.name == 'pre':
            lang = ''
            if 'class' in element.attrs:
                classes = element['class']
                for cls in classes:
                    if cls.startswith('language-'):
                        lang = cls[9:]
                        break
            return f"```{lang}\n{code}\n```"
        return f"`{code}`"
        
    def set_image_map(self, image_map: Dict[str, str]):
        """设置图片URL映射"""
        self.image_map = image_map 