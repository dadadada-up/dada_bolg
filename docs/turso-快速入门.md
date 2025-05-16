# Turso快速入门指南

## 简介

Turso是一个分布式SQLite云数据库服务，为Next.js博客提供全球低延迟数据访问能力。本指南将帮助你快速设置和使用Turso。

## 前提条件

- 已安装Node.js和npm
- 一个Next.js应用项目
- 基本的终端/命令行知识

## 安装步骤

### 1. 安装Turso CLI

```bash
# 使用Homebrew安装（macOS）
brew install tursodatabase/tap/turso

# 或使用npm安装
npm install -g turso

# 其他系统
curl -sSfL https://get.tur.so/install.sh | bash
```

### 2. 安装项目依赖

```bash
# 安装Turso客户端
npm install --save @libsql/client

# 安装开发依赖
npm install --save-dev dotenv
```

### 3. 设置Turso账户和数据库

```bash
# 登录Turso
turso auth login

# 检查登录状态
turso auth whoami

# 创建新数据库
turso db create <数据库名称>  # 例如：turso db create dada-blog-db

# 查看创建的数据库
turso db list
```

### 4. 获取连接信息

```bash
# 获取数据库URL
turso db show <数据库名称> --url  # 例如：turso db show dada-blog-db --url

# 创建访问令牌
turso db tokens create <数据库名称>  # 例如：turso db tokens create dada-blog-db
```

### 5. 配置环境变量

创建`.env.local`文件并添加以下内容：

```
# Turso数据库连接信息
TURSO_DATABASE_URL=<你的数据库URL>  # 例如：libsql://dada-blog-db-xxxx.turso.io
TURSO_AUTH_TOKEN=<你的访问令牌>
```

## 基本使用

### 连接到数据库

```javascript
// 使用ES模块
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// 使用CommonJS
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});
```

### 执行基本查询

```javascript
// 简单查询
const result = await client.execute('SELECT * FROM users');

// 参数化查询
const userData = await client.execute({
  sql: 'SELECT * FROM users WHERE id = ?',
  args: [userId]
});

// 插入数据
const insertResult = await client.execute({
  sql: 'INSERT INTO posts (title, content) VALUES (?, ?)',
  args: ['标题', '内容']
});
```

## 测试连接

创建一个测试脚本（例如，`test-turso-connection.cjs`）：

```javascript
const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 获取连接信息
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

console.log('数据库URL:', url);
console.log('令牌:', token ? '已设置' : '未设置');

// 基本查询测试
async function queryTest() {
  try {
    console.log('连接到Turso数据库...');
    const client = createClient({
      url,
      authToken: token
    });
    
    console.log('执行基本查询...');
    const result = await client.execute('SELECT 1 as test');
    
    console.log('查询结果:', result);
    console.log('测试成功!');
  } catch (err) {
    console.error('错误:', err);
  }
}

queryTest();
```

运行测试脚本：

```bash
node test-turso-connection.cjs
```

## 全球分布设置（可选）

提高全球访问速度：

```bash
# 查看可用区域
turso db locations

# 添加区域副本
turso db locations add <数据库名称> <区域代码>

# 例如：添加新加坡区域
turso db locations add dada-blog-db sin
```

## 常见问题

1. **连接错误**：确保数据库URL和令牌正确设置在环境变量中
2. **"Cannot convert undefined or null to object"错误**：通常是因为环境变量未正确加载，检查dotenv配置
3. **访问缓慢**：考虑添加更多区域副本，或检查应用所在区域

## 下一步

- 参考[Turso-Vercel完整集成指南](./turso-vercel-完整集成指南.md)了解详细信息
- 查看[Turso官方文档](https://docs.turso.tech)获取更多功能
- 参考[数据迁移指南](./turso-数据迁移指南.md)将现有SQLite数据迁移到Turso 