"""测试配置和API访问"""
import os
import sys
import json
import logging
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = str(Path(__file__).parent.parent.parent)
sys.path.insert(0, project_root)

from tools.migration.yuque_client import YuqueClient
from tools.migration.config import CONFIG

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_yuque_access():
    """测试语雀API访问"""
    print("\n=== 测试语雀API访问 ===")
    
    try:
        print("\n1. 初始化客户端...")
        client = YuqueClient(CONFIG)
        
        print("\n2. 测试页面访问...")
        url = f"{client.base_url}/{client.namespace}/{client.repo}"
        response = client._request(url)
        
        if response.status_code != 200:
            print(f"❌ 页面访问失败: {response.status_code}")
            return False
            
        print("✅ 页面访问成功")
        
        print("\n3. 测试数据提取...")
        data = client._extract_json_data(response.text)
        
        if not data:
            print("❌ 数据提取失败")
            # 保存响应内容以供分析
            with open('test_response.html', 'w', encoding='utf-8') as f:
                f.write(response.text)
            print("已保存响应内容到 test_response.html")
            return False
            
        print("✅ 数据提取成功")
        print(f"找到数据: {json.dumps(data, ensure_ascii=False, indent=2)[:500]}...")
        
        print("\n4. 测试API访问...")
        api_url = f"{client.base_url}/api/v2/repos/{client.namespace}/{client.repo}"
        api_data = client._get_api_data(api_url)
        
        if not api_data:
            print("⚠️ API访问失败，但不影响主要功能")
        else:
            print("✅ API访问成功")
            
        print("\n5. 测试获取目录...")
        try:
            toc = client.get_toc()
            if toc:
                print(f"✅ 成功获取目录，共 {len(toc)} 项")
                # 尝试获取第一篇文档
                if len(toc) > 0:
                    first_doc = toc[0]
                    print(f"\n6. 测试获取文档: {first_doc.get('title', '未命名')}...")
                    doc = client.get_doc(first_doc["slug"])
                    if doc:
                        print("✅ 文档获取成功")
                        return True
            else:
                print("❌ 目录为空")
                return False
        except Exception as e:
            print(f"❌ 获取目录失败: {str(e)}")
            return False
            
    except Exception as e:
        logger.error(f"测试失败: {str(e)}")
        print(f"❌ 测试失败: {str(e)}")
        return False

if __name__ == "__main__":
    test_yuque_access() 