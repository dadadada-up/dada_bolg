# 数据库设计文档

## 数据库选择

- 生产环境：Turso 云数据库
- 开发环境：本地 SQLite

## 数据库架构

### 核心表结构

1. 文章表 (posts)
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  description TEXT,
  is_published INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  image_url TEXT,
  reading_time INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

2. 分类表 (categories)
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
)
```

3. 标签表 (tags)
```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

4. 文章-分类关联表 (post_categories)
```sql
CREATE TABLE post_categories (
  post_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, category_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
)
```

5. 文章-标签关联表 (post_tags)
```sql
CREATE TABLE post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
)
```

6. URL映射表 (slug_mapping)
```sql
CREATE TABLE slug_mapping (
  slug TEXT PRIMARY KEY,
  post_id INTEGER NOT NULL,
  is_primary INTEGER DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
)
```

### 索引设计

```sql
CREATE INDEX idx_posts_is_published ON posts(is_published);
CREATE INDEX idx_posts_is_featured ON posts(is_featured);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_updated_at ON posts(updated_at);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_tags_slug ON tags(slug);
```

## 数据库适配器

项目使用适配器模式支持多种数据库：

1. TursoDatabase - Turso 云数据库适配器
2. SQLiteDatabase - 本地 SQLite 数据库适配器

## 环境配置

### 生产环境 (Vercel)

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

### 开发环境

```env
DB_PATH=./data/blog.db
```

## 数据迁移

1. 本地开发到 Turso：
   - 使用 Turso CLI 导出本地数据
   - 导入到 Turso 数据库

2. Turso 到本地：
   - 使用 Turso CLI 导出数据
   - 导入到本地 SQLite 数据库

## 注意事项

1. 在 Vercel 环境中强制使用 Turso
2. 本地开发优先使用 SQLite
3. 保持数据库结构的一致性
4. 定期备份重要数据 