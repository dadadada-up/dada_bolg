# 部署指南

本文档提供了将博客系统部署到各种环境的详细步骤。

## 目录

- [Vercel部署（推荐）](#vercel部署推荐)
- [自托管服务器部署](#自托管服务器部署)
- [静态网站导出部署](#静态网站导出部署)
- [Docker容器部署](#docker容器部署)

## Vercel部署（推荐）

Vercel是一个现代化的云平台，专为前端应用和Jamstack网站设计，提供出色的开发体验和全球CDN分发。部署到Vercel是最简单、最推荐的方式。

### 前提条件

1. 拥有GitHub/GitLab/Bitbucket账号并托管项目代码
2. 创建[Vercel账号](https://vercel.com/signup)
3. 创建[Turso账号](https://turso.tech/sign-up)并配置数据库

### 部署步骤

#### 1. 准备Turso数据库

```bash
# 安装Turso CLI
brew install tursodatabase/tap/turso

# 登录Turso
turso auth login

# 创建数据库
turso db create dada-blog

# 获取数据库URL和认证令牌
turso db tokens create dada-blog
```

记录下数据库URL和认证令牌，后续步骤需要使用。

#### 2. 导入GitHub仓库到Vercel

1. 登录[Vercel控制台](https://vercel.com/)
2. 点击"Add New..." > "Project"
3. 选择包含博客代码的Git仓库
4. 配置项目设置:
   - 构建命令: `npm run build`（默认）
   - 输出目录: `.next`（默认）
   - 根目录: 保持默认

#### 3. 配置环境变量

在部署配置页面添加以下环境变量:

| 变量名 | 值 | 说明 |
|--------|-----|-----|
| `TURSO_DATABASE_URL` | libsql://your-db-url.turso.io | Turso数据库URL |
| `TURSO_AUTH_TOKEN` | your-token-here | Turso认证令牌 |
| `USE_TURSO` | true | 启用Turso数据库连接 |
| `NEXT_PUBLIC_SITE_URL` | https://your-site.vercel.app | 你的网站URL |
| `GITHUB_TOKEN` | your-github-token | GitHub个人访问令牌（如需备份功能） |

#### 4. 部署项目

点击"Deploy"按钮开始部署。Vercel会自动构建和部署项目。

#### 5. 自定义域名（可选）

1. 在项目控制台中点击"Settings" > "Domains"
2. 添加你的自定义域名
3. 按照指示配置DNS记录
4. Vercel会自动为你的域名提供SSL证书

### 持续部署

配置完成后，每次推送到主分支（通常是`main`或`master`）时，Vercel会自动重新部署站点。

### 预览部署

Vercel还会为每个拉取请求创建预览部署，便于在合并前测试更改。

## 自托管服务器部署

如果你希望在自己的服务器上部署博客系统，可以使用Node.js环境和Nginx反向代理。

### 前提条件

1. 一台Linux服务器（如Ubuntu、CentOS等）
2. 已安装Node.js（v18.17.0+）和npm
3. 已安装Nginx
4. 已安装PM2（用于进程管理）

### 部署步骤

#### 1. 服务器环境准备

```bash
# 安装Node.js和npm (如果尚未安装)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装PM2
npm install -g pm2

# 安装Nginx
sudo apt install -y nginx

# 允许HTTP和HTTPS流量
sudo ufw allow 'Nginx Full'
```

#### 2. 部署应用代码

```bash
# 创建部署目录
mkdir -p /var/www/dada-blog
cd /var/www/dada-blog

# 从仓库克隆代码
git clone https://github.com/your-username/dada_blog.git .

# 安装依赖
npm install --production

# 创建环境配置文件
cp config/env/.env.example .env.local
```

编辑`.env.local`文件，配置必要的环境变量：

```
# 基础设置
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Turso数据库设置
USE_TURSO=true
TURSO_DATABASE_URL=libsql://your-db-url.turso.io
TURSO_AUTH_TOKEN=your-token-here
```

#### 3. 构建应用

```bash
# 构建应用
npm run build
```

#### 4. 使用PM2管理应用进程

创建PM2配置文件`ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'dada-blog',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster'
  }]
};
```

启动应用：

```bash
pm2 start ecosystem.config.js
pm2 save
```

设置PM2开机自启：

```bash
pm2 startup
```

执行提示的命令。

#### 5. 配置Nginx反向代理

创建Nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/dada-blog
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点配置：

```bash
sudo ln -s /etc/nginx/sites-available/dada-blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. 配置SSL证书（使用Let's Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

按照提示完成配置。

#### 7. 设置自动部署（可选）

可以使用简单的脚本实现自动部署：

```bash
#!/bin/bash
# /var/www/dada-blog/deploy.sh

cd /var/www/dada-blog
git pull
npm install
npm run build
pm2 restart dada-blog
```

设置执行权限：

```bash
chmod +x /var/www/dada-blog/deploy.sh
```

可以结合GitHub Webhooks或定时任务使用这个脚本。

## 静态网站导出部署

对于内容更新频率较低的博客，可以考虑将网站导出为静态HTML文件，部署到任何静态托管服务上。

### 前提条件

1. 本地开发环境
2. 静态托管服务（GitHub Pages、Netlify、Vercel等）

### 导出步骤

#### 1. 准备环境

```bash
# 克隆仓库
git clone https://github.com/your-username/dada_blog.git
cd dada_blog

# 安装依赖
npm install
```

#### 2. 配置静态导出

在`next.config.mjs`中确保有以下配置（已默认配置）：

```javascript
// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 启用静态导出功能
  images: {
    unoptimized: true // 静态导出需要禁用图片优化
  },
  // ... 其他配置
};

export default nextConfig;
```

#### 3. 生成静态文件

```bash
# 构建并导出静态文件
npm run build
```

静态文件将生成在`out`目录。

#### 4. 部署到静态托管服务

**GitHub Pages部署**:

```bash
# 将out目录推送到gh-pages分支
git checkout -b gh-pages
cp -r out/* .
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

在GitHub仓库设置中启用GitHub Pages，选择`gh-pages`分支作为源。

**Netlify部署**:

1. 登录[Netlify](https://www.netlify.com/)
2. 从控制台中选择"New site from Git"
3. 选择你的GitHub仓库
4. 构建设置：
   - 构建命令: `npm run build`
   - 发布目录: `out`
5. 点击"Deploy site"

**Vercel静态部署**:

创建`vercel.json`文件：

```json
{
  "version": 2,
  "public": true,
  "framework": null,
  "buildCommand": false,
  "installCommand": false,
  "outputDirectory": "out"
}
```

然后正常部署到Vercel。

## Docker容器部署

使用Docker可以简化部署过程，确保在不同环境中一致的运行结果。

### 前提条件

1. 安装Docker和Docker Compose
2. 对Docker基本概念的了解

### 部署步骤

#### 1. 创建Dockerfile

在项目根目录创建`Dockerfile`：

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### 2. 创建docker-compose.yml

创建`docker-compose.yml`文件：

```yaml
version: '3'

services:
  blog:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - USE_TURSO=true
      - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
      - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
      - NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
    restart: always
```

#### 3. 创建.env文件

创建`.env`文件（与docker-compose.yml同目录）：

```
TURSO_DATABASE_URL=libsql://your-db-url.turso.io
TURSO_AUTH_TOKEN=your-token-here
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

#### 4. 构建和启动容器

```bash
docker-compose up -d --build
```

#### 5. 配置Nginx反向代理（可选）

参考[自托管服务器部署](#自托管服务器部署)中的Nginx配置。

## 部署后检查清单

无论采用哪种部署方式，都建议完成以下检查：

1. 访问网站，确认页面加载正常
2. 验证数据库连接正常
3. 检查图片和静态资源是否加载正常
4. 测试后台管理功能是否可用
5. 检查SEO标签（标题、描述等）
6. 测试页面响应速度
7. 验证移动端显示效果

## 常见问题排解

### Vercel部署问题

- **构建失败**：检查构建日志，确保所有依赖都正确安装
- **API路由404**：检查是否使用了不支持的Node.js特性
- **环境变量问题**：确认所有必需的环境变量都已正确设置

### 自托管部署问题

- **端口冲突**：确保3000端口未被其他应用占用
- **权限问题**：检查文件和目录权限
- **Nginx配置**：验证Nginx配置语法和路径设置

### 数据库连接问题

- **连接超时**：检查防火墙设置和网络连接
- **认证失败**：验证Turso令牌和URL是否正确
- **数据不同步**：确认是否完成了数据迁移

### 静态导出问题

- **导出失败**：检查是否使用了不支持静态导出的功能
- **图片不显示**：确认`unoptimized: true`设置已启用
- **页面路由问题**：确认托管服务的路由配置正确 