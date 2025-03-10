"""WordPress 到 MkDocs 迁移工具"""
import os
import json
import logging
from pathlib import Path
from typing import Dict, List
from datetime import datetime

from .config import MIGRATION_CONFIG
from .wordpress_parser import WordPressParser
from .html2md import HTML2Markdown
from .image_handler import ImageHandler

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('migration.log')
    ]
)

logger = logging.getLogger(__name__)

class Migrator:
    def __init__(self):
        self.config = MIGRATION_CONFIG
        self.output_dir = Path(self.config['output_dir'])
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.parser = WordPressParser(self.config['wordpress_xml'])
        self.html2md = HTML2Markdown()
        self.image_handler = ImageHandler(self.config['assets_dir'])
        
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
        
    def _get_category_dir(self, categories: List[Dict]) -> str:
        """获取文章分类目录"""
        if not categories:
            return ''
            
        # 使用第一个分类作为主分类
        category = categories[0]['name']
        return self.config['category_mapping'].get(category, '')
        
    def _format_front_matter(self, post: Dict) -> str:
        """生成文章 front matter"""
        front_matter = [
            '---',
            f"title: {post['title']}",
            f"date: {post['date']}",
        ]
        
        if post['modified'] != post['date']:
            front_matter.append(f"updated: {post['modified']}")
            
        if post['categories']:
            categories = [cat['name'] for cat in post['categories']]
            front_matter.append(f"categories: [{', '.join(categories)}]")
            
        if post['tags']:
            tags = [tag['name'] for tag in post['tags']]
            front_matter.append(f"tags: [{', '.join(tags)}]")
            
        front_matter.append('---\n')
        return '\n'.join(front_matter)
        
    def _generate_filename(self, post: Dict) -> str:
        """生成文章文件名"""
        date = datetime.strptime(post['date'], '%Y-%m-%d %H:%M:%S')
        if post['slug']:
            return f"{date.strftime('%Y%m%d')}-{post['slug']}.md"
        return f"{date.strftime('%Y%m%d')}-post-{post['id']}.md"
        
    def _process_post(self, post: Dict) -> bool:
        """处理单篇文章"""
        try:
            # 获取分类目录
            category_dir = self._get_category_dir(post['categories'])
            target_dir = self.output_dir / category_dir
            target_dir.mkdir(parents=True, exist_ok=True)
            
            # 处理图片
            content, image_results = self.image_handler.process_article_images(
                post['content'],
                post['slug'] or f"post-{post['id']}"
            )
            
            # 更新图片统计
            self.migration_report['stats']['images']['total'] += len(image_results['success']) + len(image_results['failed'])
            self.migration_report['stats']['images']['success'] += len(image_results['success'])
            self.migration_report['stats']['images']['failed'] += len(image_results['failed'])
            
            # 转换为 Markdown
            self.html2md.set_image_map(dict(zip(image_results['success'], image_results['success'])))
            markdown_content = self.html2md.convert(content)
            
            # 生成完整文章内容
            full_content = (
                self._format_front_matter(post) +
                markdown_content
            )
            
            # 保存文件
            filename = self._generate_filename(post)
            filepath = target_dir / filename
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(full_content)
                
            # 更新报告
            self.migration_report['success'].append({
                'title': post['title'],
                'source': post['id'],
                'target': str(filepath),
                'images': image_results
            })
            
            self.migration_report['stats']['success'] += 1
            logger.info(f"已迁移文章: {post['title']} -> {filepath}")
            return True
            
        except Exception as e:
            self.migration_report['failed'].append({
                'title': post['title'],
                'source': post['id'],
                'error': str(e)
            })
            self.migration_report['stats']['failed'] += 1
            logger.error(f"处理文章失败 {post['title']}: {e}")
            return False
            
    def _save_report(self):
        """保存迁移报告"""
        report_file = self.output_dir.parent / 'migration_report.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.migration_report, f, ensure_ascii=False, indent=2)
            
        # 生成 Markdown 格式的报告
        md_report = [
            '# WordPress 迁移报告\n',
            f"## 统计信息\n",
            f"- 总文章数: {self.migration_report['stats']['total']}",
            f"- 成功: {self.migration_report['stats']['success']}",
            f"- 失败: {self.migration_report['stats']['failed']}",
            f"- 图片总数: {self.migration_report['stats']['images']['total']}",
            f"- 图片成功: {self.migration_report['stats']['images']['success']}",
            f"- 图片失败: {self.migration_report['stats']['images']['failed']}\n",
            f"## 失败列表\n"
        ]
        
        for failed in self.migration_report['failed']:
            md_report.append(f"- {failed['title']}: {failed['error']}")
            
        md_report_file = self.output_dir.parent / 'migration_report.md'
        with open(md_report_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(md_report))
            
    def migrate(self):
        """执行迁移"""
        logger.info("开始迁移 WordPress 内容...")
        
        # 解析 WordPress XML
        if not self.parser.parse():
            raise Exception("解析 WordPress XML 文件失败")
            
        # 获取所有文章
        posts = self.parser.get_posts()
        self.migration_report['stats']['total'] = len(posts)
        logger.info(f"找到 {len(posts)} 篇文章")
        
        # 处理所有文章
        for post in posts:
            self._process_post(post)
            
        # 保存报告
        self._save_report()
        
        logger.info("\n迁移完成！")
        logger.info(f"成功: {self.migration_report['stats']['success']}")
        logger.info(f"失败: {self.migration_report['stats']['failed']}")
        logger.info(f"图片成功: {self.migration_report['stats']['images']['success']}")
        logger.info(f"图片失败: {self.migration_report['stats']['images']['failed']}")
        logger.info(f"\n详细报告已保存至: {self.output_dir.parent}/migration_report.md")

def run():
    """运行迁移工具"""
    # 执行迁移
    migrator = Migrator()
    migrator.migrate() 