import os
import re
import yaml

def fix_categories(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 查找 front matter
    front_matter_match = re.search(r"^---\n(.*?)\n---", content, re.DOTALL)
    if front_matter_match:
        try:
            # 解析 front matter
            front_matter = yaml.safe_load(front_matter_match.group(1))
            
            # 获取当前分类
            categories = front_matter.get("categories", [])
            if isinstance(categories, str):
                categories = [categories]
            elif not isinstance(categories, list):
                categories = []
            
            # 根据目录路径判断分类
            if "work/" in file_path or "blog/" in file_path:
                categories = ["产品"]
            elif "reading/" in file_path:
                categories = ["产品"]
            elif "product/" in file_path:
                categories = ["产品"]
            elif "ai/" in file_path:
                categories = ["AI"]
            elif "python/" in file_path:
                categories = ["Python"]
            elif "tools/" in file_path:
                categories = ["工具"]
            else:
                categories = ["产品"]  # 默认分类
            
            # 更新 front matter
            front_matter["categories"] = categories
            
            # 生成新的 front matter
            new_front_matter = yaml.dump(front_matter, allow_unicode=True, sort_keys=False)
            
            # 替换原有的 front matter
            new_content = re.sub(
                r"^---\n.*?\n---",
                f"---\n{new_front_matter}---",
                content,
                flags=re.DOTALL
            )
            
            # 写回文件
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
                
            print(f"Updated categories in {file_path}")
            
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

# 遍历所有 Markdown 文件
for root, dirs, files in os.walk("docs/blog/posts"):
    for file in files:
        if file.endswith(".md"):
            file_path = os.path.join(root, file)
            fix_categories(file_path) 