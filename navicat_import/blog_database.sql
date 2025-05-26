
-- 文章表
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  content_html TEXT,
  excerpt TEXT,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT 0,
  is_yaml_valid BOOLEAN NOT NULL DEFAULT 1,
  is_manually_edited BOOLEAN NOT NULL DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  source_path TEXT,
  image_url TEXT,
  yuque_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  parent_id INTEGER,
  post_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  post_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 文章-分类关联表
CREATE TABLE IF NOT EXISTS post_categories (
  post_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, category_id)
);

-- 文章-标签关联表
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, tag_id)
);

-- Slug映射表
CREATE TABLE IF NOT EXISTS slug_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  slug TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 同步状态表
CREATE TABLE IF NOT EXISTS sync_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
  source TEXT,
  target TEXT,
  status TEXT,
  items_synced INTEGER DEFAULT 0,
  message TEXT
);

-- 示例数据
INSERT INTO posts (slug, title, content, excerpt, is_published, is_featured, created_at, updated_at)
VALUES ('hello-world', 'Hello World', 'This is a test post', 'Test post excerpt', 1, 1, '2025-05-26 07:06:20', '2025-05-26 07:06:20');

INSERT INTO categories (name, slug, description)
VALUES 
  ('编程', 'programming', '编程相关文章'),
  ('技术', 'tech', '技术相关文章'),
  ('生活', 'life', '生活随笔');

INSERT INTO tags (name, slug)
VALUES ('测试', 'test');

-- 关联文章与分类
INSERT INTO post_categories (post_id, category_id, created_at)
VALUES (1, 2, '2025-05-26 07:06:50');

-- 关联文章与标签
INSERT INTO post_tags (post_id, tag_id, created_at)
VALUES (1, 1, '2025-05-26 07:07:05');

-- 设置Slug映射
INSERT INTO slug_mapping (post_id, slug, is_primary)
VALUES (1, 'hello-world', 1);
