# API文档

本文档概述了博客系统提供的API端点及其用法。

## 目录

- [认证](#认证)
- [文章API](#文章api)
- [分类API](#分类api)
- [标签API](#标签api)
- [系统API](#系统api)

## 认证

大部分管理API需要认证才能访问。认证采用基于JWT的身份验证机制。

### 获取令牌

```
POST /api/admin/login
```

**请求体**:

```json
{
  "username": "admin",
  "password": "yourpassword"
}
```

**响应**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1640995200000
}
```

### 使用令牌

在所有需要认证的请求中，将令牌添加到请求头:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 文章API

### 获取文章列表

```
GET /api/posts
```

**查询参数**:

| 参数 | 类型 | 描述 | 默认值 |
|------|------|------|--------|
| page | 数字 | 页码 | 1 |
| limit | 数字 | 每页数量 | 10 |
| status | 字符串 | 筛选状态 (published/draft) | 所有 |
| category | 字符串 | 按分类筛选 | 所有 |
| tag | 字符串 | 按标签筛选 | 所有 |
| search | 字符串 | 搜索关键词 | 无 |
| sort | 字符串 | 排序字段 | created_at |
| order | 字符串 | 排序方向 (asc/desc) | desc |

**示例**:

```
GET /api/posts?page=1&limit=10&status=published&category=tech&sort=published_at&order=desc
```

**响应**:

```json
{
  "posts": [
    {
      "id": 1,
      "title": "Hello World",
      "slug": "hello-world",
      "excerpt": "This is my first post",
      "is_published": true,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "published_at": "2023-01-01T00:00:00.000Z",
      "categories": [
        {
          "id": 1,
          "name": "Tech",
          "slug": "tech"
        }
      ],
      "tags": [
        {
          "id": 1,
          "name": "JavaScript",
          "slug": "javascript"
        }
      ]
    }
    // 更多文章...
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### 获取单篇文章

```
GET /api/posts/{slug}
```

**参数**:

| 参数 | 描述 |
|------|------|
| slug | 文章的URL友好标识符 |

**响应**:

```json
{
  "id": 1,
  "title": "Hello World",
  "slug": "hello-world",
  "content": "# Hello World\n\nThis is my first post...",
  "content_html": "<h1>Hello World</h1><p>This is my first post...</p>",
  "excerpt": "This is my first post",
  "is_published": true,
  "created_at": "2023-01-01T00:00:00.000Z",
  "updated_at": "2023-01-01T00:00:00.000Z",
  "published_at": "2023-01-01T00:00:00.000Z",
  "categories": [
    {
      "id": 1,
      "name": "Tech",
      "slug": "tech"
    }
  ],
  "tags": [
    {
      "id": 1,
      "name": "JavaScript",
      "slug": "javascript"
    }
  ]
}
```

### 创建文章

```
POST /api/posts
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**请求体**:

```json
{
  "title": "New Post",
  "content": "# New Post\n\nThis is a new post...",
  "excerpt": "This is a new post",
  "is_published": true,
  "categories": [1],
  "tags": [1, 2]
}
```

**响应**:

```json
{
  "id": 2,
  "title": "New Post",
  "slug": "new-post",
  "content": "# New Post\n\nThis is a new post...",
  "content_html": "<h1>New Post</h1><p>This is a new post...</p>",
  "excerpt": "This is a new post",
  "is_published": true,
  "created_at": "2023-01-02T00:00:00.000Z",
  "updated_at": "2023-01-02T00:00:00.000Z",
  "published_at": "2023-01-02T00:00:00.000Z",
  "categories": [
    {
      "id": 1,
      "name": "Tech",
      "slug": "tech"
    }
  ],
  "tags": [
    {
      "id": 1,
      "name": "JavaScript",
      "slug": "javascript"
    },
    {
      "id": 2,
      "name": "React",
      "slug": "react"
    }
  ]
}
```

### 更新文章

```
PUT /api/posts/{slug}
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**请求体**:

```json
{
  "title": "Updated Post",
  "content": "# Updated Post\n\nThis post has been updated...",
  "excerpt": "This post has been updated",
  "is_published": true,
  "categories": [1],
  "tags": [1, 2, 3]
}
```

**响应**:

```json
{
  "id": 2,
  "title": "Updated Post",
  "slug": "new-post",
  "content": "# Updated Post\n\nThis post has been updated...",
  "content_html": "<h1>Updated Post</h1><p>This post has been updated...</p>",
  "excerpt": "This post has been updated",
  "is_published": true,
  "created_at": "2023-01-02T00:00:00.000Z",
  "updated_at": "2023-01-03T00:00:00.000Z",
  "published_at": "2023-01-02T00:00:00.000Z",
  "categories": [
    {
      "id": 1,
      "name": "Tech",
      "slug": "tech"
    }
  ],
  "tags": [
    {
      "id": 1,
      "name": "JavaScript",
      "slug": "javascript"
    },
    {
      "id": 2,
      "name": "React",
      "slug": "react"
    },
    {
      "id": 3,
      "name": "Next.js",
      "slug": "nextjs"
    }
  ]
}
```

### 删除文章

```
DELETE /api/posts/{slug}
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**响应**:

```json
{
  "success": true,
  "message": "文章已删除"
}
```

## 分类API

### 获取分类列表

```
GET /api/categories
```

**响应**:

```json
[
  {
    "id": 1,
    "name": "Tech",
    "slug": "tech",
    "description": "Technology related posts",
    "post_count": 15
  },
  {
    "id": 2,
    "name": "Life",
    "slug": "life",
    "description": "Life style posts",
    "post_count": 8
  }
]
```

### 获取分类详情

```
GET /api/categories/{slug}
```

**响应**:

```json
{
  "id": 1,
  "name": "Tech",
  "slug": "tech",
  "description": "Technology related posts",
  "post_count": 15,
  "posts": [
    {
      "id": 1,
      "title": "Hello World",
      "slug": "hello-world",
      "excerpt": "This is my first post",
      "created_at": "2023-01-01T00:00:00.000Z"
    }
    // 更多文章...
  ]
}
```

### 创建分类

```
POST /api/categories
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**请求体**:

```json
{
  "name": "News",
  "description": "Latest news"
}
```

**响应**:

```json
{
  "id": 3,
  "name": "News",
  "slug": "news",
  "description": "Latest news",
  "post_count": 0
}
```

### 更新分类

```
PUT /api/categories/{slug}
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**请求体**:

```json
{
  "name": "Updated News",
  "description": "Updated description"
}
```

**响应**:

```json
{
  "id": 3,
  "name": "Updated News",
  "slug": "news",
  "description": "Updated description",
  "post_count": 0
}
```

### 删除分类

```
DELETE /api/categories/{slug}
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**响应**:

```json
{
  "success": true,
  "message": "分类已删除"
}
```

## 标签API

### 获取标签列表

```
GET /api/tags
```

**响应**:

```json
[
  {
    "id": 1,
    "name": "JavaScript",
    "slug": "javascript",
    "post_count": 10
  },
  {
    "id": 2,
    "name": "React",
    "slug": "react",
    "post_count": 5
  }
]
```

### 获取标签详情

```
GET /api/tags/{slug}
```

**响应**:

```json
{
  "id": 1,
  "name": "JavaScript",
  "slug": "javascript",
  "post_count": 10,
  "posts": [
    {
      "id": 1,
      "title": "Hello World",
      "slug": "hello-world",
      "excerpt": "This is my first post",
      "created_at": "2023-01-01T00:00:00.000Z"
    }
    // 更多文章...
  ]
}
```

### 创建标签

```
POST /api/tags
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**请求体**:

```json
{
  "name": "Next.js"
}
```

**响应**:

```json
{
  "id": 3,
  "name": "Next.js",
  "slug": "nextjs",
  "post_count": 0
}
```

### 更新标签

```
PUT /api/tags/{slug}
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**请求体**:

```json
{
  "name": "Next.js Framework"
}
```

**响应**:

```json
{
  "id": 3,
  "name": "Next.js Framework",
  "slug": "nextjs",
  "post_count": 0
}
```

### 删除标签

```
DELETE /api/tags/{slug}
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**响应**:

```json
{
  "success": true,
  "message": "标签已删除"
}
```

## 系统API

### 获取系统信息

```
GET /api/system
```

**响应**:

```json
{
  "version": "1.0.0",
  "stats": {
    "posts": 42,
    "categories": 5,
    "tags": 12
  },
  "lastSync": "2023-01-01T00:00:00.000Z"
}
```

### 触发同步

```
POST /api/system/sync
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**响应**:

```json
{
  "success": true,
  "message": "同步已开始",
  "syncId": "sync-123456"
}
```

### 获取同步状态

```
GET /api/system/sync/{syncId}
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**响应**:

```json
{
  "id": "sync-123456",
  "status": "completed",
  "startedAt": "2023-01-01T00:00:00.000Z",
  "completedAt": "2023-01-01T00:01:00.000Z",
  "stats": {
    "added": 5,
    "updated": 2,
    "deleted": 0
  }
}
```

### 清除缓存

```
POST /api/system/cache/clear
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**请求体**:

```json
{
  "type": "all" // 可选: all, api, pages
}
```

**响应**:

```json
{
  "success": true,
  "message": "缓存已清除"
}
```

### 系统初始化

```
POST /api/system/init
```

**请求头**:

```
Authorization: Bearer your-token-here
```

**响应**:

```json
{
  "success": true,
  "message": "系统已初始化"
}
``` 