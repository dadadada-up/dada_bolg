
  -- 示例数据
  INSERT INTO posts (slug, title, content, excerpt, is_published, is_featured, created_at, updated_at, published_at)
  VALUES ('hello-world', 'Hello World', 'This is a test post', 'Test post excerpt', 1, 1, '2023-05-26 07:06:20', '2023-05-26 07:06:20', '2023-05-26 07:06:20');
  
  INSERT INTO categories (name, slug, description)
  VALUES 
    ('编程', 'programming', '编程相关文章'),
    ('技术', 'tech', '技术相关文章'),
    ('生活', 'life', '生活随笔');
  
  INSERT INTO tags (name, slug)
  VALUES ('测试', 'test');
  
  -- 关联文章与分类
  INSERT INTO post_categories (post_id, category_id, created_at)
  VALUES (1, 2, '2023-05-26 07:06:50');
  
  -- 关联文章与标签
  INSERT INTO post_tags (post_id, tag_id, created_at)
  VALUES (1, 1, '2023-05-26 07:07:05');
  
  -- 设置Slug映射
  INSERT INTO slug_mapping (post_id, slug, is_primary)
  VALUES (1, 'hello-world', 1);