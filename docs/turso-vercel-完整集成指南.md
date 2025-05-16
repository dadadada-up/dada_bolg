# Turso与Vercel集成完整方案

## 目录

- [Turso与Vercel集成完整方案](#turso与vercel集成完整方案)
  - [目录](#目录)
  - [1. 解决方案概述](#1-解决方案概述)
  - [2. 系统架构](#2-系统架构)
    - [2.1 适配器模式架构](#21-适配器模式架构)
    - [2.2 环境检测逻辑](#22-环境检测逻辑)
    - [2.3 构建流程](#23-构建流程)
  - [3. 安装与配置](#3-安装与配置)
    - [3.1 安装依赖](#31-安装依赖)
      - [安装Turso CLI](#安装turso-cli)
      - [安装项目依赖](#安装项目依赖)
    - [3.2 设置Turso账户和数据库](#32-设置turso账户和数据库)
    - [3.3 配置环境变量](#33-配置环境变量)
  - [4. 数据迁移](#4-数据迁移)
    - [4.1 迁移步骤概览](#41-迁移步骤概览)
    - [4.2 数据迁移执行](#42-数据迁移执行)
    - [4.3 验证迁移结果](#43-验证迁移结果)
    - [4.4 当前迁移状态](#44-当前迁移状态)
  - [5. Vercel部署指南](#5-vercel部署指南)
    - [5.1 前提条件](#51-前提条件)
    - [5.2 准备部署](#52-准备部署)
    - [5.3 Vercel环境配置](#53-vercel环境配置)
    - [5.4 验证部署](#54-验证部署)
    - [5.5 自定义域名设置（可选）](#55-自定义域名设置可选)
  - [6. 实现细节](#6-实现细节)
    - [6.1 关键文件说明](#61-关键文件说明)
    - [6.2 关键配置说明](#62-关键配置说明)
  - [7. 性能优化](#7-性能优化)
    - [7.1 全球区域复制](#71-全球区域复制)
    - [7.2 查询优化](#72-查询优化)
    - [7.3 增量静态再生成(ISR)](#73-增量静态再生成isr)
  - [8. 故障排除](#8-故障排除)
    - [8.1 常见问题及解决方案](#81-常见问题及解决方案)
    - [8.2 日志与调试](#82-日志与调试)
    - [8.3 回滚计划](#83-回滚计划)
  - [9. 维护与管理](#9-维护与管理)
    - [9.1 备份与恢复](#91-备份与恢复)
    - [9.2 监控与维护](#92-监控与维护)
  - [10. 最佳实践](#10-最佳实践)
    - [10.1 并发与连接管理](#101-并发与连接管理)
    - [10.2 查询优化](#102-查询优化)
    - [10.3 性能监控](#103-性能监控)
  - [11. 常用命令汇总](#11-常用命令汇总)
  - [12. 资源与参考](#12-资源与参考)

## 1. 解决方案概述

本方案解决了Next.js博客在Vercel部署时无法访问本地数据库的问题，通过集成Turso分布式SQLite云数据库，实现以下核心目标：

- **无缝数据迁移**：从本地SQLite迁移到Turso云数据库，保持完全兼容性
- **环境自适应**：系统自动根据环境变量选择合适的数据库连接方式
- **零代码修改**：通过适配器模式，使现有代码无需修改即可支持Turso
- **全球低延迟访问**：利用Turso的全球分布特性提供更好的访问体验
- **可靠的部署流程**：提供完整的部署、验证和故障排除工具

迁移到Turso可以带来以下优势：

- **全球化访问**：数据库在全球范围内实现低延迟访问
- **可靠性提升**：借助Turso的数据复制和备份能力
- **性能优化**：通过内嵌副本实现近乎本地的查询性能
- **扩展性**：随着博客增长可以轻松扩展数据库容量
- **简化部署**：解决Vercel部署中的数据库连接问题

## 2. 系统架构

### 2.1 适配器模式架构

系统采用适配器模式实现数据库连接的透明切换：

```
应用代码 → database.ts(统一接口) → 
  ├── SQLite本地数据库 (开发环境)
  └── turso-adapter.ts → turso-client.ts → Turso云数据库 (生产环境)
```

### 2.2 环境检测逻辑

```javascript
// 从src/lib/db/turso-client.ts
const isTursoEnabled = (): boolean => {
  const enabled = !!process.env.TURSO_DATABASE_URL && !!process.env.TURSO_AUTH_TOKEN;
  return enabled;
};

// 从src/lib/db/database.ts
if (useTurso) {
  console.log('[数据库] 使用Turso云数据库');
  dbInstance = new TursoDatabase();
} else {
  console.log(`[数据库] 使用本地SQLite数据库: ${DB_PATH}`);
  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });
}
```

### 2.3 构建流程

Vercel构建流程已经通过`vercel.json`和`package.json`中的`vercel:build`脚本进行了定制，增加了Turso初始化步骤：

```
npm run vercel:build
↓
node scripts/vercel-turso-setup.js   // 初始化Turso连接与数据库结构
↓
npm run vercel:prepare              // 准备静态文件
↓
next build                          // 执行Next.js构建
```

## 3. 安装与配置

### 3.1 安装依赖

#### 安装Turso CLI

```bash
# 使用Homebrew安装（macOS）
brew install tursodatabase/tap/turso

# 或使用npm安装
npm install -g turso

# 其他系统
curl -sSfL https://get.tur.so/install.sh | bash
```

#### 安装项目依赖

```bash
# 安装Turso客户端
npm install --save @libsql/client

# 安装开发依赖
npm install --save-dev dotenv commander
```

如果安装过程中遇到与native模块相关的编译错误，可能需要先安装编译工具：

```bash
# 在macOS上
xcode-select --install
npm install --save-dev sqlite3 --build-from-source

# 在Linux上
sudo apt-get install python3 make g++
npm install --save-dev sqlite3 --build-from-source
```

### 3.2 设置Turso账户和数据库

登录Turso并创建数据库：

```bash
# 登录Turso
turso auth login

# 创建新数据库
turso db create dada-blog-db

# 查看创建的数据库
turso db list
```

获取连接信息：

```bash
# 获取数据库URL
turso db show dada-blog-db --url

# 创建访问令牌
turso db tokens create dada-blog-db
```

可选：配置全球数据分布

```bash
# 查看可用区域
turso db locations

# 在其他区域创建副本，提高全球访问速度
turso db locations add dada-blog-db sin  # 新加坡
turso db locations add dada-blog-db syd  # 悉尼
```

### 3.3 配置环境变量

创建`.env.local`文件并添加以下内容：

```bash
# Turso数据库连接信息
# 使用Turso CLI获取：turso db show dada-blog-db --url
TURSO_DATABASE_URL=libsql://dada-blog-xxxx.turso.io

# Turso访问令牌
# 使用Turso CLI创建：turso db tokens create dada-blog-db
TURSO_AUTH_TOKEN=your-auth-token-here

# 可选：自定义数据库备份目录（默认为 ./data/backups）
# BACKUP_DIR=./data/backups

# 可选：自定义数据库名称（用于备份和恢复脚本）
# TURSO_DB_NAME=dada-blog-db

# 可选：备份保留天数（默认30天）
# MAX_DAYS=30
```

## 4. 数据迁移

### 4.1 迁移步骤概览

1. **安装依赖**
2. **配置环境变量**
3. **执行数据迁移**
4. **验证迁移结果**
5. **切换应用数据源**
6. **备份管理**

### 4.2 数据迁移执行

测试迁移（不实际写入）：

```bash
npm run migrate-to-turso:dry
```

仅迁移数据库结构：

```bash
npm run migrate-to-turso:schema
```

完整迁移（结构+数据）：

```bash
npm run migrate-to-turso
```

### 4.3 验证迁移结果

执行验证脚本以确保迁移正确：

```bash
npm run validate-migration
```

验证脚本会检查:
- 表结构是否完整迁移
- 数据行数是否一致
- 抽样数据内容是否匹配

### 4.4 当前迁移状态

我们已经完成了Turso数据库集成的以下工作：

1. **迁移脚本准备**
   - ✅ 完成了`scripts/migrate-to-turso.ts`脚本，支持完整迁移、模拟运行和仅结构模式
   - ✅ 完成了`scripts/validate-turso-migration.ts`验证脚本
   - ✅ 两个脚本都支持`--dry-run`模式，可以在无法连接到Turso API的情况下测试功能

2. **环境配置**
   - ✅ 创建了`.env.local`文件
   - ✅ 配置了Turso数据库URL和临时认证令牌
   - ✅ 配置了其他必要参数(本地数据库路径、备份目录等)

3. **基础设施**
   - ✅ 安装了`@libsql/client` Node.js客户端
   - ✅ 安装了Turso CLI

4. **代码适配**
   - ✅ 实现了`TursoDatabase`适配器类，使Turso客户端与SQLite接口兼容
   - ✅ 更新了`turso-client.ts`，使用真实的@libsql/client而非模拟实现
   - ✅ 改进了适配器的run方法，以便正确返回lastID和changes

5. **数据库管理**
   - ✅ 创建了数据库备份脚本`scripts/backup-turso.sh`
   - ✅ 创建了数据库恢复脚本`scripts/restore-turso.sh`

如果遇到网络连接问题，可以采取以下临时措施：

1. 使用模拟运行模式测试迁移脚本功能
2. 更新数据库适配器代码，确保与Turso API兼容
3. 准备完整的环境配置，一旦能够连接就可以立即执行迁移

## 5. Vercel部署指南

### 5.1 前提条件

1. 一个 [GitHub](https://github.com/) 账号
2. 一个 [Vercel](https://vercel.com/) 账号 (可使用 GitHub 账号注册)
3. 一个 [Turso](https://turso.tech/) 账号
4. 本地开发环境中的博客系统已正常运行
5. 已完成Turso数据库迁移，或准备在部署过程中进行迁移

### 5.2 准备部署

1. **将代码推送到 GitHub**

   在 GitHub 上创建一个新仓库，然后推送代码：

   ```bash
   # 在本地项目目录中执行
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/my-dada-blog.git
   git push -u origin main
   ```

2. **在 Vercel 上导入项目**

   - 访问 [Vercel](https://vercel.com/)，使用 GitHub 账号登录
   - 点击 "Add New..."，然后选择 "Project"
   - 选择你刚刚创建的 GitHub 仓库
   - 如果没有看到你的仓库，点击 "Configure GitHub App" 并授权 Vercel 访问
   - **Framework Preset**: 选择 "Next.js"
   - **Root Directory**: 保持默认值 (/)
   - **Build Command**: `npm run vercel:build` (已配置为使用Turso)
   - **Output Directory**: `.next` (Next.js 默认值)

### 5.3 Vercel环境配置

1. **配置Vercel环境变量**：
   在Vercel项目设置中，添加以下环境变量：
   - `TURSO_DATABASE_URL`: Turso数据库URL
   - `TURSO_AUTH_TOKEN`: Turso访问令牌
   - `NEXT_PUBLIC_DATABASE_MODE`: 设置为`turso`
   - `NEXT_PUBLIC_IS_VERCEL`: 设置为`1`
   - `NEXT_PUBLIC_SITE_URL`: 站点URL (使用Vercel提供的域名或自定义域名)

   > **重要提示**：请务必加密敏感环境变量，选择Vercel的"Encrypt"选项

2. **部署项目**：
   ```bash
   npm run vercel:deploy
   ```

   或点击Vercel界面上的"Deploy"按钮，或者通过GitHub集成进行部署。

### 5.4 验证部署

1. 访问部署后的URL确认网站正常加载
2. 检查日志中的数据库连接信息
3. 测试前台页面加载和显示
4. 测试管理后台登录和操作
5. 测试文章创建和编辑功能
6. 确认数据库连接正常

### 5.5 自定义域名设置（可选）

1. **添加自定义域**

   - 在 Vercel 项目设置中，找到 "Domains" 部分
   - 点击 "Add" 并输入您的域名

2. **配置 DNS**

   根据 Vercel 提供的指引，在您的域名注册商处添加相应的 DNS 记录：
   - 对于根域名：添加 A 记录指向 76.76.21.21
   - 对于子域名：添加 CNAME 记录指向 cname.vercel-dns.com

3. **SSL 证书**

   Vercel 会自动为您的域名提供和管理 SSL 证书。

## 6. 实现细节

### 6.1 关键文件说明

| 文件路径 | 说明 |
|---------|------|
| `src/lib/db/database.ts` | 统一数据库访问层，自动选择适合的数据库连接方式 |
| `src/lib/db/turso-adapter.ts` | 适配器实现，将Turso接口转换为SQLite兼容接口 |
| `src/lib/db/turso-client.ts` | Turso客户端封装，处理连接和查询逻辑 |
| `scripts/vercel-turso-setup.js` | Vercel构建时的Turso初始化脚本 |
| `scripts/migrate-to-turso.ts` | 数据迁移工具，将SQLite数据迁移到Turso |
| `scripts/test-turso-connection.js` | Turso连接测试脚本 |
| `vercel.json` | Vercel部署配置，包含环境变量和构建设置 |
| `next.config.js` | Next.js配置，包含Turso相关优化 |
| `.vercelignore` | 忽略规则，确保包含Turso相关文件 |

### 6.2 关键配置说明

**vercel.json 环境变量配置**

```json
{
  "env": {
    "TURSO_DATABASE_URL": "@turso_database_url",
    "TURSO_AUTH_TOKEN": "@turso_auth_token",
    "NEXT_PUBLIC_DATABASE_MODE": "turso",
    "NEXT_PUBLIC_IS_VERCEL": "1"
  }
}
```

**package.json 构建脚本**

```json
{
  "scripts": {
    "vercel:build": "node scripts/vercel-turso-setup.js && npm run vercel:prepare && next build",
    "test-turso": "node scripts/test-turso-connection.js",
    "turso:check": "node scripts/test-turso-connection.js",
    "vercel:test-turso": "node test-vercel-build.js && node scripts/test-turso-connection.js"
  }
}
```

**next.config.js Turso相关配置**

```javascript
{
  env: {
    // 数据库模式配置
    NEXT_PUBLIC_DATABASE_MODE: process.env.TURSO_DATABASE_URL ? 'turso' : 'sqlite',
  },
  
  serverRuntimeConfig: {
    useTurso: !!process.env.TURSO_DATABASE_URL,
    tursoUrl: process.env.TURSO_DATABASE_URL,
  },
  
  publicRuntimeConfig: {
    databaseMode: process.env.TURSO_DATABASE_URL ? 'turso' : 'sqlite',
  },
  
  // Webpack配置
  webpack: (config) => {
    // ...现有配置...
    
    // 优化Turso与Webpack的兼容性
    if (process.env.TURSO_DATABASE_URL) {
      config.externals = {
        ...config.externals,
        // 避免Webpack打包原生模块
        sqlite3: 'commonjs sqlite3',
      };
    }
    
    return config;
  },
  
  // 配置构建输出
  output: process.env.TURSO_DATABASE_URL ? 'standalone' : undefined,
}
```

## 7. 性能优化

### 7.1 全球区域复制

添加区域副本减少访问延迟:

```bash
# 添加亚太区域副本
turso db locations add dada-blog-db sin  # 新加坡
turso db locations add dada-blog-db syd  # 悉尼

# 添加欧洲区域副本
turso db locations add dada-blog-db fra  # 法兰克福
turso db locations add dada-blog-db lhr  # 伦敦

# 添加北美区域副本
turso db locations add dada-blog-db ord  # 芝加哥
turso db locations add dada-blog-db dfw  # 达拉斯
```

### 7.2 查询优化

1. 确保频繁查询的字段都有适当的索引
2. 对于复杂查询，考虑使用视图或预计算结果
3. 实现前端缓存减少API请求

### 7.3 增量静态再生成(ISR)

对于访问频繁但数据变化不频繁的页面，启用ISR减少数据库访问。在Next.js页面中设置revalidate参数：

```javascript
export async function getStaticProps() {
  // 获取数据...
  
  return {
    props: {
      // 你的数据
    },
    // 每小时重新生成一次
    revalidate: 3600,
  }
}
```

## 8. 故障排除

### 8.1 常见问题及解决方案

| 问题 | 可能原因 | 解决方案 |
|-----|---------|---------|
| 部署成功但页面显示"加载中..." | 数据库连接失败 | 检查Vercel环境变量是否正确设置 |
| 构建时报错"数据库连接失败" | Turso凭证错误 | 重新创建令牌并更新环境变量 |
| 生产环境数据不完整 | 迁移可能不完整 | 执行`npm run validate-migration`检查 |
| 特定API返回500错误 | 查询或表结构问题 | 检查Vercel日志并测试特定查询 |
| 构建失败 | 依赖问题或配置错误 | 查看构建日志了解具体错误 |
| API路由返回404错误 | 路由配置问题 | 确保API路由位于正确目录 |
| 静态资源加载失败 | 路径或配置问题 | 检查资源路径和Next.js配置 |

### 8.2 日志与调试

1. **Vercel日志**：通过Vercel面板查看完整构建和运行日志
2. **Turso日志**：在Turso控制台查看数据库日志和性能指标
3. **本地测试**：使用`npm run vercel:test-turso`在本地模拟Vercel环境

### 8.3 回滚计划

如果需要回滚：

1. 禁用Turso环境变量：在Vercel中删除或禁用Turso相关环境变量
2. 触发重新部署：手动触发新的部署
3. 验证回滚：确认系统已恢复到之前的静态部署方式

如果迁移过程中或迁移后发现重大问题，可以按照以下步骤回滚：

1. **立即回滚**：更改环境变量，重新指向本地SQLite数据库
2. **分析问题**：确定问题原因并记录
3. **制定新方案**：解决问题并重新计划迁移
4. **重新测试**：在测试环境中确认问题已解决
5. **再次迁移**：执行修正后的迁移计划

## 9. 维护与管理

### 9.1 备份与恢复

创建备份：

```bash
npm run backup-turso
```

查看可用备份：

```bash
npm run list-backups
```

从备份恢复：

```bash
# 从最新备份恢复
npm run restore-turso

# 从特定备份恢复
npm run restore-turso -- -f 备份文件名

# 恢复到新数据库
npm run restore-turso -- -n 新数据库名
```

设置定期备份任务：

```bash
# 设置cron作业自动备份
0 2 * * * cd /path/to/project && npm run backup-turso
```

### 9.2 监控与维护

1. 定期检查Turso控制台的性能指标
2. 监控慢查询并优化数据库结构
3. 随着数据增长调整访问策略
4. **Turso云控制台**：通过 https://app.turso.io 监控数据库性能和使用情况
5. **定期备份**：配置cron作业自动备份数据库

## 10. 最佳实践

### 10.1 并发与连接管理

1. **连接复用**：使用连接池或单例模式管理数据库连接
2. **超时设置**：配置适当的查询超时时间
3. **重试机制**：实现网络错误自动重试

### 10.2 查询优化

1. **使用正确的索引**：确保常用查询都有索引支持
2. **限制结果集大小**：避免返回过多数据
3. **批量操作**：合并小操作为批量事务

### 10.3 性能监控

1. **查询性能**：监控慢查询并优化
2. **吞吐量**：监控系统整体性能
3. **错误率**：跟踪并分析错误模式

## 11. 常用命令汇总

```bash
# 数据迁移
npm run migrate-to-turso        # 完整迁移
npm run migrate-to-turso:dry    # 模拟迁移
npm run migrate-to-turso:schema # 仅迁移结构
npm run validate-migration      # 验证迁移结果

# 测试与连接
npm run test-turso              # 测试Turso连接
npm run turso:check             # 检查连接状态
npm run vercel:test-turso       # 模拟Vercel环境测试

# 备份与恢复
npm run backup-turso            # 创建备份
npm run list-backups            # 列出备份
npm run restore-turso           # 从最新备份恢复
npm run restore-turso -- -f <file>  # 从指定备份恢复

# 部署
npm run vercel:build            # 执行Vercel构建
npm run vercel:deploy           # 部署到Vercel

# Turso CLI命令
turso auth login                # 登录Turso
turso db create <db-name>       # 创建数据库
turso db list                   # 列出数据库
turso db show <db-name> --url   # 获取数据库URL
turso db tokens create <db-name> # 创建访问令牌
turso db locations              # 查看可用区域
turso db locations add <db-name> <location> # 添加区域分布
turso db dump <db-name>         # 导出数据库
```

## 12. 资源与参考

- [Turso官方文档](https://docs.turso.tech)
- [Next.js Vercel部署文档](https://nextjs.org/docs/deployment)
- [SQLite到Turso迁移指南](https://docs.turso.tech/tutorials/migrate-from-sqlite)
- [Vercel环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables) 