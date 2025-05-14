# Vercel静态部署指南

本项目配置为在Vercel上以纯静态模式部署，完全绕过Next.js构建过程。这种方式能够避免在Vercel构建时尝试连接到本地数据库或API的问题。

## 部署架构

这个静态部署解决方案的工作原理：

1. 使用自定义的`vercel.json`配置文件覆盖默认的Next.js构建过程
2. 使用自定义的构建脚本生成静态HTML文件
3. 将预构建的静态文件直接部署到Vercel的输出目录

## 关键文件

- `vercel.json` - 配置Vercel使用自定义构建过程
- `scripts/vercel-build.js` - 主构建脚本，协调整个构建过程
- `scripts/vercel-prebuild.js` - 预构建脚本，设置环境和检查系统
- `scripts/generate-static-pages.js` - 生成静态HTML页面
- `scripts/static-build.js` - 将静态文件复制到输出目录
- `.vercelignore` - 确保Next.js相关文件不会被上传

## 静态网站内容

所有静态内容位于`public`目录：

- `/public/index.html` - 网站首页
- `/public/categories/` - 分类页面目录
- `/public/tags/` - 标签页面目录
- `/public/api/` - 静态API响应
- `/public/404.html` - 404错误页

## 如何更新静态内容

1. 修改`public`目录中的HTML文件
2. 或者更新`scripts/generate-static-pages.js`中的页面生成逻辑
3. 提交并推送到Git仓库，Vercel将自动部署更新

## 恢复到动态Next.js构建（将来）

当你解决了数据库连接问题后，可以恢复到使用完整的Next.js构建过程：

1. 删除`vercel.json`文件，或将其修改为:
```json
{
  "version": 2
}
```

2. 确保`package.json`中的构建脚本使用Next.js:
```json
"build": "next build"
```

## 故障排除

如果部署出现问题：

1. 检查Vercel部署日志，确认构建流程
2. 确保`vercel.json`文件中的`buildCommand`设置为`node scripts/vercel-build.js`
3. 确保所有构建脚本(`vercel-build.js`, `vercel-prebuild.js`, `static-build.js`)都存在
4. 检查生成的静态文件是否正确（首页、分类页面、标签页面等）

## 本地测试

你可以在本地测试完整的静态构建流程：

```bash
# 清除旧的输出
rm -rf .vercel/output/static out

# 设置环境
export VERCEL=1

# 运行构建脚本
node scripts/vercel-build.js

# 检查输出
ls -la .vercel/output/static
```

注意：本地测试可以帮助验证构建脚本的行为，但可能无法完全模拟Vercel的环境。 