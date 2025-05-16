# Turso与Vercel完整集成指南

本文档提供了将Next.js应用与Turso数据库集成并部署到Vercel的完整指南。

## 目录

1. [前提条件](#前提条件)
2. [Turso数据库设置](#turso数据库设置)
3. [本地环境配置](#本地环境配置)
4. [Vercel部署配置](#vercel部署配置)
5. [验证与测试](#验证与测试)
6. [常见问题与解决方案](#常见问题与解决方案)
7. [进阶配置](#进阶配置)

## 前提条件

- 安装Turso CLI: `brew install tursodatabase/tap/turso`
- 注册Turso账户并登录: `turso auth login`
- Next.js项目已设置好
- Vercel账户已创建

## Turso数据库设置

### 1. 创建Turso数据库

```bash
# 登录Turso
turso auth login

# 查看登录状态
turso auth whoami

# 创建数据库
turso db create dada-blog-db

# 查看数据库列表
turso db list
```

### 2. 获取数据库连接信息

```bash
# 获取数据库URL
turso db show dada-blog-db

# 创建访问令牌
turso db tokens create dada-blog-db
```

### 3. 准备数据库架构

可以使用以下方式创建数据库架构：

1. 使用迁移脚本：`npm run migrate-to-turso`
2. 直接导入SQL文件：`turso db shell dada-blog-db < turso_schema_fixed.sql`

## 本地环境配置

### 1. 创建.env.local文件

```
TURSO_DATABASE_URL=libsql://dada-blog-db-yourusername.turso.io
TURSO_AUTH_TOKEN=your-auth-token
NEXT_PUBLIC_DATABASE_MODE=turso
NEXT_PUBLIC_IS_VERCEL=1
```

### 2. 安装必要依赖

确保项目已安装`@libsql/client`：

```bash
npm install @libsql/client
```

### 3. 配置Next.js

修改`next.config.js`：

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...其他配置
  
  env: {
    // ...其他环境变量
    NEXT_PUBLIC_DATABASE_MODE: process.env.TURSO_DATABASE_URL ? 'turso' : 'sqlite',
  },
  
  serverRuntimeConfig: {
    // ...其他配置
    useTurso: !!process.env.TURSO_DATABASE_URL,
    tursoUrl: process.env.TURSO_DATABASE_URL,
  },
  
  // 优化Turso与Webpack的兼容性
  webpack: (config) => {
    // ...其他配置
    if (process.env.TURSO_DATABASE_URL) {
      config.externals = {
        ...config.externals,
        // 避免Webpack打包原生模块
        sqlite3: 'commonjs sqlite3',
      };
    }
    return config;
  },
  
  // 输出为standalone模式以优化Vercel部署
  output: process.env.TURSO_DATABASE_URL ? 'standalone' : undefined,
}
```

## Vercel部署配置

### 1. 创建vercel.json

```json
{
  "version": 2,
  "buildCommand": "npm run vercel:build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "public": true,
  "github": {
    "silent": true
  },
  "env": {
    "TURSO_DATABASE_URL": "libsql://your-db-url.turso.io",
    "TURSO_AUTH_TOKEN": "your-auth-token",
    "NEXT_PUBLIC_DATABASE_MODE": "turso",
    "NEXT_PUBLIC_IS_VERCEL": "1"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

> **注意**：Vercel免费计划只能使用一个区域，请确保`regions`数组只包含一个值。

### 2. 创建数据库初始化脚本

创建`scripts/vercel-turso-setup.js`脚本，用于在Vercel构建过程中初始化数据库：

```js
/**
 * Vercel部署Turso数据库初始化脚本
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前脚本路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 加载SQL架构文件
const schemaPath = path.join(rootDir, 'turso_schema_fixed.sql');

// 判断是否在Vercel环境中运行
const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_VERCEL === '1';

// 获取Turso数据库连接配置
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

// 日志函数
function log(message) {
  console.log(`[Vercel-Turso] ${message}`);
}

/**
 * 检查Turso数据库连接并初始化
 */
async function setupTursoDatabase() {
  // 创建Turso客户端并测试连接
  const client = createClient({
    url: tursoUrl,
    authToken: tursoToken
  });
  
  // 检查表结构是否存在，如不存在则创建
  const tablesResult = await client.execute({ 
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  });
  
  if (tablesResult.rows.length === 0) {
    // 读取并执行SQL架构
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => ({ sql: s + ';' }));
    
    for (const stmt of statements) {
      await client.execute(stmt);
    }
  }
}

// 只在Vercel环境中执行
if (isVercel) {
  setupTursoDatabase();
}
```

### 3. 更新package.json的构建命令

```json
{
  "scripts": {
    "vercel:build": "node scripts/vercel-turso-setup.js && npm run vercel:prepare && next build"
  }
}
```

## 验证与测试

### 1. 测试Turso连接

创建验证脚本`scripts/verify-vercel-turso.js`：

```js
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 获取Turso连接信息
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

async function verifyTursoConnection() {
  // 创建Turso客户端
  const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });
  
  // 测试基本查询
  const testResult = await client.execute({ 
    sql: 'SELECT 1 as test' 
  });
  
  console.log('测试结果:', testResult);
  
  // 测试表结构
  const tablesResult = await client.execute({ 
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'" 
  });
  
  console.log('数据库表:', tablesResult.rows.map(row => row.name));
}

verifyTursoConnection();
```

运行测试：`node scripts/verify-vercel-turso.js`

### 2. 验证Vercel构建环境

创建验证脚本`scripts/verify-vercel-build.js`来检查所有配置是否正确。

### 3. 部署到Vercel

使用Vercel CLI部署：

```bash
# 安装Vercel CLI
npm install -g vercel

# 部署
vercel --prod
```

或通过GitHub集成自动部署。

## 常见问题与解决方案

### 1. Vercel部署失败

- **问题**：部署时报错`Cannot find module '@libsql/client'`
- **解决方案**：确保依赖已正确安装，且Vercel的构建命令正确。

### 2. 无法连接到Turso数据库

- **问题**：部署成功但应用无法连接到数据库
- **解决方案**：
  - 检查Vercel环境变量是否正确配置
  - 验证Turso令牌是否有效
  - 确保数据库URL格式正确

### 3. 数据库架构问题

- **问题**：应用启动但报表结构错误
- **解决方案**：确保`vercel-turso-setup.js`脚本正确执行并创建了必要的表结构

### 4. Vercel构建使用缓存

- **问题**：更新后Vercel使用缓存版本而不运行完整构建
- **解决方案**：在Vercel项目设置中禁用缓存，或使用`force-rebuild.txt`文件触发完整构建

## 进阶配置

### 1. 多区域部署

在Vercel团队计划中可以使用多区域部署：

```json
{
  "regions": ["iad1", "sfo1", "hnd1"]
}
```

### 2. 自动数据库备份

创建定时备份Turso数据库的GitHub Action：

```yaml
name: Backup Turso Database

on:
  schedule:
    - cron: '0 0 * * *'  # 每天凌晨运行
  workflow_dispatch:  # 允许手动触发

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Turso CLI
        run: curl -sSfL https://get.tur.so/install.sh | bash
      
      - name: Login to Turso
        run: turso auth login --token ${{ secrets.TURSO_TOKEN }}
      
      - name: Backup Database
        run: turso db dump dada-blog-db > backup-$(date +%Y%m%d).sql
      
      - name: Upload Backup
        uses: actions/upload-artifact@v3
        with:
          name: db-backup
          path: backup-*.sql
```

### 3. 开发与生产环境分离

为开发和生产环境使用不同的Turso数据库：

```js
// next.config.js
const nextConfig = {
  env: {
    TURSO_DATABASE_URL: process.env.NODE_ENV === 'production' 
      ? process.env.TURSO_PROD_DATABASE_URL 
      : process.env.TURSO_DEV_DATABASE_URL,
  }
}
```

---

本指南提供了将Next.js应用与Turso数据库集成并部署到Vercel的完整解决方案。通过遵循这些步骤，您可以确保应用在Vercel上正常运行，并能够连接到Turso数据库。 