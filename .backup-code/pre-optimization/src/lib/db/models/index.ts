// 定义数据库模型类型

// 文章表结构
export interface PostModel {
  id?: number;
  slug: string;
  title: string;
  content?: string;
  content_html?: string;
  excerpt?: string;
  description?: string;
  is_published: boolean;
  is_featured: boolean;
  is_yaml_valid: boolean;
  is_manually_edited: boolean;
  reading_time?: number;
  source_path?: string;
  image_url?: string;
  yuque_url?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
}

// 图片表结构
export interface ImageModel {
  id?: number;
  filename: string;         // 存储的文件名（含扩展名）
  original_filename: string; // 原始文件名
  path: string;             // 存储路径
  url: string;              // 访问URL
  size: number;             // 文件大小(字节)
  width?: number;           // 图片宽度(像素)
  height?: number;          // 图片高度(像素)
  mime_type: string;        // MIME类型
  storage_type: string;     // 存储类型(local/oss/cos/s3)
  post_id?: number;         // 关联文章ID
  created_at?: string;
  updated_at?: string;
}

// 分类表结构
export interface CategoryModel {
  id?: number;
  name: string; // 分类中文名称
  slug: string; // 分类英文标识
  description?: string;
  parent_id?: number; // 父分类ID
  post_count: number; // 文章数量
  created_at?: string;
  updated_at?: string;
}

// 标签表结构
export interface TagModel {
  id?: number;
  name: string; // 标签名称
  slug: string; // 标签英文标识
  post_count: number; // 文章数量
  created_at?: string;
  updated_at?: string;
}

// 文章-分类关联表
export interface PostCategoryModel {
  post_id: number;
  category_id: number;
  created_at?: string;
}

// 文章-标签关联表
export interface PostTagModel {
  post_id: number;
  tag_id: number;
  created_at?: string;
}

// URL映射表
export interface SlugMappingModel {
  slug: string;
  post_id: number;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

// 同步状态表
export interface SyncStatusModel {
  id: number;
  last_sync_time?: string;
  is_sync_in_progress: boolean;
  updated_at?: string;
}

// 数据库初始化SQL语句
export const dbSchema = `
-- 文章表
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,          -- 存储Markdown内容
  content_html TEXT,     -- 存储渲染后的HTML
  excerpt TEXT,
  description TEXT,      -- 文章描述/摘要
  is_published BOOLEAN NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT 0,
  is_yaml_valid BOOLEAN NOT NULL DEFAULT 1,
  is_manually_edited BOOLEAN NOT NULL DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  source_path TEXT CHECK(length(source_path) <= 512),
  image_url TEXT CHECK(length(image_url) <= 512),
  yuque_url TEXT CHECK(length(yuque_url) <= 512),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME
);

-- 图片表
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,           -- 存储的文件名（含扩展名）
  original_filename TEXT NOT NULL,  -- 原始文件名
  path TEXT NOT NULL,               -- 存储路径
  url TEXT NOT NULL,                -- 访问URL
  size INTEGER NOT NULL,            -- 文件大小(字节)
  width INTEGER,                    -- 图片宽度(像素)
  height INTEGER,                   -- 图片高度(像素)
  mime_type TEXT NOT NULL,          -- MIME类型
  storage_type TEXT NOT NULL DEFAULT 'local', -- 存储类型(local/oss/cos/s3)
  post_id INTEGER,                  -- 关联文章ID
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 文章-分类关联表
CREATE TABLE IF NOT EXISTS post_categories (
  post_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, category_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 文章-标签关联表
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- URL映射表
CREATE TABLE IF NOT EXISTS slug_mapping (
  slug TEXT PRIMARY KEY,
  post_id INTEGER NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 同步状态表
CREATE TABLE IF NOT EXISTS sync_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_sync_time DATETIME,
  is_sync_in_progress BOOLEAN NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_is_published ON posts(is_published);
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_images_post_id ON images(post_id);
CREATE INDEX IF NOT EXISTS idx_images_storage_type ON images(storage_type);
`; 