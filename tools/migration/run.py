"""运行 WordPress 迁移工具"""
import os
import sys
import logging
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = str(Path(__file__).parent.parent.parent)
sys.path.insert(0, project_root)

from tools.migration.migrator import Migrator

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('migration.log')
    ]
)

logger = logging.getLogger(__name__)

def main():
    try:
        print("\n=== WordPress 迁移工具 ===\n")
        
        # 初始化迁移器
        migrator = Migrator()
        
        # 执行迁移
        migrator.migrate()
        
        print("\n迁移完成！请查看 migration_report.md 获取详细信息。")
        
    except KeyboardInterrupt:
        print("\n迁移已被用户中断")
        sys.exit(1)
    except Exception as e:
        logger.error(f"迁移失败: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 