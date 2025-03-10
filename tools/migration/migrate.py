"""主迁移脚本"""
import os
import logging
from typing import List, Dict
from .file_processor import FileProcessor
from .converter import ContentConverter
from .config import SOURCE_CONFIG, MIGRATION_CONFIG

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Migrator:
    def __init__(self):
        self.processor = FileProcessor(SOURCE_CONFIG['POSTS_DIR'])
        self.converter = ContentConverter()
        self.batch_size = MIGRATION_CONFIG['BATCH_SIZE']

    def migrate_all(self):
        """迁移所有内容"""
        try:
            # 获取所有文章
            logger.info("开始读取文章...")
            posts = self.processor.get_all_posts()
            logger.info(f"找到 {len(posts)} 篇文章")

            # 批量处理文章
            for i in range(0, len(posts), self.batch_size):
                batch = posts[i:i + self.batch_size]
                self._process_posts(batch)

            logger.info("迁移完成！")
            
        except Exception as e:
            logger.error(f"迁移过程中出错: {str(e)}")
            raise

    def _process_posts(self, posts: List[Dict]):
        """处理一批文章"""
        for post in posts:
            try:
                # 转换文章
                converted = self.converter.convert_post(post)
                
                # 确保目标目录存在
                self.converter.ensure_directory(converted['target_dir'])
                
                # 写入文件
                target_path = os.path.join(converted['target_dir'], converted['filename'])
                with open(target_path, 'w', encoding='utf-8') as f:
                    f.write(converted['content'])
                    
                logger.info(f"已迁移文章: {post.get('title')} -> {target_path}")
                
            except Exception as e:
                logger.error(f"处理文章 {post.get('title')} 时出错: {str(e)}")

if __name__ == '__main__':
    migrator = Migrator()
    migrator.migrate_all() 