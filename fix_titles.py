import os
import re

def fix_title(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 查找标题行
    title_match = re.search(r"^title: ([^\n\"]+)$", content, re.MULTILINE)
    if title_match:
        # 如果标题没有引号，添加引号
        title = title_match.group(1)
        new_content = content.replace(f"title: {title}", f"title: \"{title}\"")
        
        # 写回文件
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)

# 遍历所有 Markdown 文件
for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".md"):
            file_path = os.path.join(root, file)
            try:
                fix_title(file_path)
            except Exception as e:
                print(f"Error processing {file_path}: {e}") 