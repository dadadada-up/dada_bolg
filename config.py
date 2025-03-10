"""迁移工具配置文件"""

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
        'receive-cookie-deprecation': '1'
    },
    'headers': {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.yuque.com/dadadada_up/pm',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"'
    }
}

MIGRATION_CONFIG = {
    'output_dir': 'docs',
    'assets_dir': 'assets/images',
    'retry': {
        'max_retries': 3,
        'delay': 1,
        'max_delay': 5
    },
    'rate_limit': {
        'requests_per_minute': 30,
        'min_delay': 0.5,
        'max_delay': 2
    }
} 