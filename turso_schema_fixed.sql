CREATE TABLE IF NOT EXISTS "posts" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
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
      source_path TEXT CHECK(length(source_path) <= 512),
      image_url TEXT CHECK(length(image_url) <= 512),
      yuque_url TEXT CHECK(length(yuque_url) <= 512),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME
    );
CREATE TABLE IF NOT EXISTS "categories" (
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
CREATE TABLE IF NOT EXISTS "tags" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
      post_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE IF NOT EXISTS "post_categories" (
      post_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, category_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
CREATE TABLE IF NOT EXISTS "post_tags" (
      post_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, tag_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
CREATE TABLE IF NOT EXISTS "slug_mapping" (
      slug TEXT PRIMARY KEY,
      post_id INTEGER NOT NULL,
      is_primary BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
CREATE TABLE IF NOT EXISTS "sync_status" (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_sync_time DATETIME,
      is_sync_in_progress BOOLEAN NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
CREATE INDEX idx_posts_is_published ON posts(is_published);
CREATE INDEX idx_posts_is_featured ON posts(is_featured);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_updated_at ON posts(updated_at);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_tags_slug ON tags(slug);
