import os
import sqlite3
import frontmatter
import yaml
from pathlib import Path
import re

def clean_yaml_content(content):
    """清理 YAML 内容，修复常见格式问题"""
    # 修复缩进问题
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        # 修复错误的缩进
        if line.startswith('- ') and not line.startswith('  - '):
            line = '  ' + line
        cleaned_lines.append(line)
    return '\n'.join(cleaned_lines)

def get_unique_slug(title, date, existing_slugs):
    """生成唯一的 slug"""
    # 从标题生成基础 slug
    base_slug = re.sub(r'[^\w\s-]', '', title.lower())
    base_slug = re.sub(r'[-\s]+', '-', base_slug).strip('-')
    
    # 如果 slug 已存在，添加日期和随机字符串
    if base_slug in existing_slugs:
        return f"{date}-{base_slug}"
    return base_slug

def import_posts():
    # 连接到数据库
    conn = sqlite3.connect('data/blog.db')
    cursor = conn.cursor()

    # 获取所有 markdown 文件
    content_dir = Path('content')
    md_files = list(content_dir.rglob('*.md'))
    
    # 获取已存在的 slugs
    cursor.execute('SELECT slug FROM posts')
    existing_slugs = {row[0] for row in cursor.fetchall()}
    
    # 用于跟踪已处理的文章
    processed_content = set()
    imported_count = 0
    error_count = 0
    duplicate_count = 0

    for md_file in md_files:
        try:
            # 读取文件内容
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 提取 frontmatter
            try:
                # 尝试直接解析
                post = frontmatter.loads(content)
            except Exception as e:
                # 如果解析失败，尝试清理 YAML
                cleaned_content = clean_yaml_content(content)
                try:
                    post = frontmatter.loads(cleaned_content)
                except Exception as e2:
                    print(f'Error parsing YAML in {md_file}: {str(e2)}')
                    error_count += 1
                    continue

            # 获取文章信息
            title = post.get('title', md_file.stem)
            date = post.get('date', '')
            categories = post.get('categories', [])
            tags = post.get('tags', [])
            description = post.get('description', '')
            content = post.content
            image = post.get('image', '')
            yuque_url = post.get('yuque_url', '')
            published = post.get('published', True)
            
            # 生成唯一的 slug
            slug = get_unique_slug(title, date, existing_slugs)
            existing_slugs.add(slug)
            
            # 检查内容是否重复
            content_hash = hash(content)
            if content_hash in processed_content:
                print(f'Duplicate content found: {md_file}')
                duplicate_count += 1
                continue
            processed_content.add(content_hash)

            # 检查文章是否已存在
            cursor.execute('SELECT id FROM posts WHERE slug = ?', (slug,))
            existing_post = cursor.fetchone()

            if existing_post:
                # 更新现有文章
                cursor.execute('''
                    UPDATE posts 
                    SET title = ?, date = ?, categories = ?, tags = ?, description = ?, 
                        content = ?, image = ?, yuque_url = ?, published = ?
                    WHERE slug = ?
                ''', (title, date, str(categories), str(tags), description, content, 
                      image, yuque_url, published, slug))
            else:
                # 插入新文章
                cursor.execute('''
                    INSERT INTO posts (title, date, categories, tags, description, 
                                     content, slug, image, yuque_url, published)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (title, date, str(categories), str(tags), description, content, 
                      slug, image, yuque_url, published))

            print(f'Imported: {md_file}')
            imported_count += 1

        except Exception as e:
            print(f'Error importing {md_file}: {str(e)}')
            error_count += 1

    # 提交更改并关闭连接
    conn.commit()
    conn.close()
    
    print(f'\nImport Summary:')
    print(f'Total files: {len(md_files)}')
    print(f'Successfully imported: {imported_count}')
    print(f'Errors: {error_count}')
    print(f'Duplicates skipped: {duplicate_count}')

if __name__ == '__main__':
    import_posts() 