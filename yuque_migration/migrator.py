"""主迁移逻辑"""
import os
import json
from pathlib import Path
from typing import Dict, List
from tqdm import tqdm

from config import MIGRATION_CONFIG
from yuque_client import YuqueClient
from image_handler import ImageHandler
from markdown_conv import MarkdownConverter

class Migrator:
    def __init__(self, output_dir: str = MIGRATION_CONFIG['output_dir']):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.client = YuqueClient()
        self.image_handler = ImageHandler(output_dir)
        self.converter = MarkdownConverter()
        
        self.migration_report = {
            'success': [],
            'failed': [],
            'stats': {
                'total': 0,
                'success': 0,
                'failed': 0,
                'images': {
                    'total': 0,
                    'success': 0,
                    'failed': 0
                }
            }
        }

    def _save_markdown(self, content: str, filepath: Path) -> None:
        """保存Markdown文件"""
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    def _save_report(self) -> None:
        """保存迁移报告"""
        report_path = self.output_dir / 'migration_report.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.migration_report, f, ensure_ascii=False, indent=2)

    def process_document(self, doc: Dict) -> bool:
        """处理单个文档"""
        try:
            # 转换为MkDocs格式
            content = self.converter.convert_to_mkdocs(doc)
            
            # 处理图片
            content, image_results = self.image_handler.process_article_images(
                content, 
                doc['slug']
            )
            
            # 保存文件
            filepath = self.output_dir / f"{doc['slug']}.md"
            self._save_markdown(content, filepath)
            
            # 更新报告
            self.migration_report['success'].append({
                'title': doc['title'],
                'path': str(filepath),
                'images': image_results
            })
            
            # 更新统计
            self.migration_report['stats']['success'] += 1
            self.migration_report['stats']['images']['total'] += len(image_results['success']) + len(image_results['failed'])
            self.migration_report['stats']['images']['success'] += len(image_results['success'])
            self.migration_report['stats']['images']['failed'] += len(image_results['failed'])
            
            return True
            
        except Exception as e:
            self.migration_report['failed'].append({
                'title': doc.get('title', '未知'),
                'error': str(e)
            })
            self.migration_report['stats']['failed'] += 1
            return False

    def migrate(self):
        """执行迁移"""
        print("开始迁移...")
        
        # 验证访问权限
        if not self.client.validate_access():
            raise Exception("无法访问语雀知识库，请检查配置")
        
        # 获取文档列表
        toc = self.client.get_toc()
        if not toc:
            raise Exception("获取目录失败")
            
        self.migration_report['stats']['total'] = len(toc)
        print(f"找到 {len(toc)} 篇文档")
        
        # 处理所有文档
        for doc_info in tqdm(toc, desc="迁移进度"):
            doc = self.client.get_doc(doc_info['slug'])
            if doc:
                self.process_document(doc)
                
        # 生成索引
        index_content = self.converter.generate_index([
            doc for doc in toc 
            if doc['slug'] in [s['path'].stem for s in self.migration_report['success']]
        ])
        self._save_markdown(index_content, self.output_dir / 'index.md')
        
        # 保存报告
        self._save_report()
        
        print("\n迁移完成！")
        print(f"成功: {self.migration_report['stats']['success']}")
        print(f"失败: {self.migration_report['stats']['failed']}")
        print(f"图片成功: {self.migration_report['stats']['images']['success']}")
        print(f"图片失败: {self.migration_report['stats']['images']['failed']}")
        print(f"\n详细报告已保存至: {self.output_dir}/migration_report.json")
