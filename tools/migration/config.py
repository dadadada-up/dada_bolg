"""迁移工具配置文件"""

import os
from pathlib import Path

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent.parent

# 源文件配置
SOURCE_DIR = ROOT_DIR / "source"
SOURCE_POSTS_DIR = SOURCE_DIR / "_posts"
SOURCE_DRAFTS_DIR = SOURCE_DIR / "_drafts"
SOURCE_IMAGES_DIR = SOURCE_DIR / "images"

# 源文件配置
SOURCE_CONFIG = {
    'POSTS_DIR': '/Users/dada/Downloads/067d4af9-0f06-43f5-a1da-432fef49c9e4-posts',
    'root_dir': 'source',
    'extensions': ['.md']
}

# 语雀配置
YUQUE_CONFIG = {
    'base_url': 'https://www.yuque.com',
    'repo': 'dadadada_up/pm',
    'cookies': {
        'lang': 'zh-cn',
        '_yuque_session': 'GjmDSBKgdOqFpJrwqFMTeUqA-q09C6jZiUTOgmw0D-nNTSJGGYKuOhyMvWfnNz95Y7tZl-ln0MsLF_HtL-FdHQ==',
        'yuque_ctoken': 'HD7lkeudxUnvSbrnZEfWp4z7',
        'current_theme': 'default',
        'aliyungf_tc': 'a97b430c046a4c23047dbba429e96e9dbd8299ae713137205370066b096a0839',
        'acw_tc': 'ac11000117411913895606950ef77047b4f6ee8c300342582724aba2113fc0',
        'receive-cookie-deprecation': '1',
        '_m_h5_tk': '2f8f1f1f1f1f1f1f1f1f1f1f1f1f1f1f_1741191389560',
        '_m_h5_tk_enc': '2f8f1f1f1f1f1f1f1f1f1f1f1f1f1f1f',
        'TSID': '2f8f1f1f1f1f1f1f1f1f1f1f1f1f1f1f',
        'ctoken': 'HD7lkeudxUnvSbrnZEfWp4z7',
        'SSID': '2f8f1f1f1f1f1f1f1f1f1f1f1f1f1f1f',
        'USERID': 'dadadada_up'
    },
    'headers': {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
        'Referer': 'https://www.yuque.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="122", "Chromium";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': 'HD7lkeudxUnvSbrnZEfWp4z7'
    }
}

# MkDocs配置
MKDOCS_CONFIG = {
    "site_name": "dada's Journey",
    "site_description": "产品经理的打怪升级",
    "site_author": "dada",
    "repo_url": "https://github.com/yourusername/yourrepo",
    "theme": "material",
    'DOCS_DIR': 'docs',
    'CATEGORY_MAPPING': {
        'AI': 'ai/learning',
        'Python': 'tech/python',
        '工具': 'tech/tools',
        '产品': 'product/methodology',
        '默认': 'blog/posts'
    }
}

# 迁移配置
MIGRATION_CONFIG = {
    'output_dir': 'docs/blog/posts',  # 文章输出目录
    'assets_dir': 'docs/blog/assets/images',  # 图片等资源文件目录
    'wordpress_xml': 'site.wordpress.2025-03-09.000.xml',  # WordPress 导出的 XML 文件
    'category_mapping': {  # WordPress 分类映射到 MkDocs 目录
        '目录': 'index',
        '随笔': 'blog',
        '读书笔记': 'reading',
        '博客': 'blog',
        '工作感悟': 'work',
        '个人': 'personal',
        '产品分析方法论': 'product/methodology'
    },
    'retry': {
        'max_retries': 3,
        'delay': 1,
        'max_delay': 5
    },
    'rate_limit': {  # 下载图片时的速率限制
        'requests_per_minute': 30,
        'min_delay': 0.5,
        'max_delay': 2
    }
}

# 导出配置
CONFIG = {
    "source": {
        "posts_dir": str(SOURCE_POSTS_DIR),
        "drafts_dir": str(SOURCE_DRAFTS_DIR),
        "images_dir": str(SOURCE_IMAGES_DIR)
    },
    "yuque": YUQUE_CONFIG,
    "mkdocs": MKDOCS_CONFIG,
    "migration": MIGRATION_CONFIG,
    "output": {
        "docs_dir": "docs",
        "blog_dir": "blog/posts",
        "assets_dir": "assets/images",
        "default_category": "默认"
    }
}

# 工作目录
WORKSPACE = Path(os.getcwd())

# 完整路径
PATHS = {
    'output': WORKSPACE / MIGRATION_CONFIG['output_dir'],
    'assets': WORKSPACE / MIGRATION_CONFIG['assets_dir']
}

# 确保目录存在
for path in PATHS.values():
    path.mkdir(parents=True, exist_ok=True) 