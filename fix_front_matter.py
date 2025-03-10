import os
import re
import yaml
from datetime import datetime

def fix_front_matter(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 查找 front matter
    match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if not match:
        print(f"No front matter found in {file_path}")
        return

    # 解析 front matter
    try:
        front_matter = yaml.safe_load(match.group(1))
    except yaml.YAMLError:
        print(f"Error parsing front matter in {file_path}")
        return

    # 修复标题中的多余引号
    if 'title' in front_matter:
        title = front_matter['title']
        if isinstance(title, str):
            # 移除多余的引号
            title = title.strip('"\'')
            front_matter['title'] = title

    # 修复日期格式
    if 'date' in front_matter:
        date_str = str(front_matter['date'])
        try:
            # 尝试解析日期
            if ' ' in date_str:
                date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
            else:
                date = datetime.strptime(date_str.strip("'\""), '%Y-%m-%d')
            # 直接使用 datetime 对象，不转换为字符串
            front_matter['date'] = date
        except ValueError:
            print(f"Error parsing date in {file_path}")
            # 使用文件修改时间作为默认日期
            front_matter['date'] = datetime.fromtimestamp(os.path.getmtime(file_path))

    # 确保 categories 是列表
    if 'categories' in front_matter:
        if isinstance(front_matter['categories'], str):
            front_matter['categories'] = [front_matter['categories']]
        elif not isinstance(front_matter['categories'], list):
            front_matter['categories'] = []

    # 确保 tags 是列表
    if 'tags' in front_matter:
        if isinstance(front_matter['tags'], str):
            front_matter['tags'] = [front_matter['tags']]
        elif not isinstance(front_matter['tags'], list):
            front_matter['tags'] = []

    # 生成新的 front matter
    new_front_matter = yaml.dump(front_matter, allow_unicode=True, sort_keys=False)
    new_content = f"---\n{new_front_matter}---\n{content[match.end():]}"

    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

# 修复所有文件
for root, dirs, files in os.walk("docs/blog/posts"):
    for file in files:
        if file.endswith(".md"):
            file_path = os.path.join(root, file)
            fix_front_matter(file_path)
            print(f"Fixed {file_path}") 