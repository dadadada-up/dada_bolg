# Vercel 部署指南

本指南将帮助你将博客系统部署到 Vercel 平台，并配置 Turso 分布式数据库，实现全球访问。

## 目录

- [前提条件](#前提条件)
- [步骤一：准备 Turso 数据库](#步骤一准备-turso-数据库)
- [步骤二：将代码推送到 GitHub](#步骤二将代码推送到-github)
- [步骤三：在 Vercel 上导入项目](#步骤三在-vercel-上导入项目)
- [步骤四：配置环境变量](#步骤四配置环境变量)
- [步骤五：部署与验证](#步骤五部署与验证)
- [步骤六：自定义域名设置](#步骤六自定义域名设置可选)
- [排错与常见问题](#排错与常见问题)

## 前提条件

1. 一个 [GitHub](https://github.com/) 账号
2. 一个 [Vercel](https://vercel.com/) 账号 (可使用 GitHub 账号注册)
3. 一个 [Turso](https://turso.tech/) 账号
4. 本地开发环境中的博客系统已正常运行

## 步骤一：准备 Turso 数据库

1. **安装 Turso CLI**

   ```bash
   # macOS
   brew install tursodatabase/tap/turso

   # 其他系统
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. **登录 Turso**

   ```bash
   turso auth login
   ```

3. **创建数据库**

   ```bash
   turso db create dada-blog-db
   ```

4. **获取连接信息**

   ```bash
   # 获取数据库 URL
   turso db show dada-blog-db --url

   # 创建访问令牌
   turso db tokens create dada-blog-db
   ```

   保存输出的 URL 和令牌，后续将用于 Vercel 环境变量配置。

5. **迁移数据**

   如果你已有本地数据，需要将其迁移到 Turso：

   ```bash
   # 在本地项目目录中执行
   export TURSO_DATABASE_URL="你的数据库URL"
   export TURSO_AUTH_TOKEN="你的访问令牌"

   # 执行迁移
   npm run migrate-to-turso
   ```

   验证迁移结果：

   ```bash
   npm run validate-migration
   ```

## 步骤二：将代码推送到 GitHub

1. **创建 GitHub 仓库**

   在 GitHub 上创建一个新仓库，例如 `my-dada-blog`。

2. **初始化 Git 并推送代码**

   ```bash
   # 在本地项目目录中执行
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/my-dada-blog.git
   git push -u origin main
   ```

## 步骤三：在 Vercel 上导入项目

1. **登录 Vercel**

   访问 [Vercel](https://vercel.com/)，使用 GitHub 账号登录。

2. **导入项目**

   - 点击 "Add New..."，然后选择 "Project"
   - 选择你刚刚创建的 GitHub 仓库
   - 如果没有看到你的仓库，点击 "Configure GitHub App" 并授权 Vercel 访问

3. **基本配置**

   - **Framework Preset**: 选择 "Next.js"
   - **Root Directory**: 保持默认值 (/)
   - **Build Command**: `npm run build` (已在 package.json 中配置)
   - **Output Directory**: `.next` (Next.js 默认值)

## 步骤四：配置环境变量

点击项目设置中的 "Environment Variables"，添加以下变量：

| 变量名 | 值 | 描述 |
|-------|-----|------|
| `TURSO_DATABASE_URL` | libsql://your-db-url.turso.io | Turso 数据库 URL |
| `TURSO_AUTH_TOKEN` | your-token-here | Turso 数据库访问令牌 |
| `NEXT_PUBLIC_SITE_URL` | https://your-site.vercel.app | 站点 URL (使用 Vercel 提供的域名或自定义域名) |

确保选中所有环境（Production、Preview 和 Development）。

## 步骤五：部署与验证

1. **触发部署**

   点击 "Deploy" 按钮开始部署流程。

2. **观察构建日志**

   在构建过程中，您可以实时查看日志，检查是否有错误。

3. **测试站点功能**

   部署完成后：
   - 测试前台页面加载和显示
   - 测试管理后台登录和操作
   - 测试文章创建和编辑功能
   - 确认数据库连接正常

## 步骤六：自定义域名设置（可选）

1. **添加自定义域**

   - 在 Vercel 项目设置中，找到 "Domains" 部分
   - 点击 "Add" 并输入您的域名

2. **配置 DNS**

   根据 Vercel 提供的指引，在您的域名注册商处添加相应的 DNS 记录：
   - 对于根域名：添加 A 记录指向 76.76.21.21
   - 对于子域名：添加 CNAME 记录指向 cname.vercel-dns.com

3. **SSL 证书**

   Vercel 会自动为您的域名提供和管理 SSL 证书。

## 排错与常见问题

### 数据库连接问题

**症状**: 部署成功但无法连接数据库，页面显示错误。

**解决方案**:
- 检查环境变量是否正确设置
- 确认 Turso 令牌未过期（默认有效期为 1 年）
- 检查 Turso 数据库是否正常运行
- 查看 Vercel 日志以获取详细错误信息

### 构建失败

**症状**: Vercel 构建过程失败，显示错误信息。

**解决方案**:
- 查看构建日志了解具体错误
- 常见原因包括依赖安装失败、类型错误或环境变量问题
- 尝试在本地执行 `npm run build` 检查是否可以成功构建

### API 路由返回 404 错误

**症状**: 前端页面加载正常，但 API 请求返回 404。

**解决方案**:
- 确保你的 API 路由位于正确的目录（`pages/api/` 或 `app/api/`）
- 检查 API 路由中的数据库连接代码
- 临时添加日志帮助调试

### 静态资源加载失败

**症状**: 图片或其他静态资源无法加载。

**解决方案**:
- 确保资源路径正确
- 检查 `next.config.js` 中的图像配置
- 确认资源已包含在部署中

## 更多帮助

如果你遇到其他问题，可以：
- 查看 [Vercel 文档](https://vercel.com/docs)
- 查看 [Turso 文档](https://docs.turso.tech)
- 在 GitHub 项目中提交 issue 