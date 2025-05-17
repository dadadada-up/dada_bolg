#!/usr/bin/env node

/**
 * 手动备份脚本
 * 简化版本，直接访问数据库并备份到GitHub
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

// 加载环境变量
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

// GitHub配置
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'dadadada-up/dada_blog';
const GITHUB_BRANCH = 'main';
// 使用SSH方式连接GitHub
const USE_SSH = true;

// 备份和临时目录
const tempDir = path.join(projectRoot, 'temp-manual-backup');
const cloneDir = path.join(projectRoot, 'temp-manual-clone');

// 主函数
async function manualBackup() {
  console.log('开始执行手动备份...');
  
  // 检查GitHub Token
  if (!GITHUB_TOKEN) {
    console.error('错误: GitHub Token未设置');
    process.exit(1);
  }
  
  console.log('正在准备临时目录...');
  
  // 创建临时目录
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  if (fs.existsSync(cloneDir)) {
    fs.rmSync(cloneDir, { recursive: true });
  }
  fs.mkdirSync(cloneDir, { recursive: true });
  
  try {
    // 1. 连接数据库
    console.log('连接数据库...');
    const dbPath = path.join(projectRoot, 'data', 'blog.db');
    
    if (!fs.existsSync(dbPath)) {
      console.error(`数据库文件不存在: ${dbPath}`);
      process.exit(1);
    }
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('数据库连接成功');
    
    // 2. 导出数据
    console.log('导出数据...');
    
    // 导出分类
    console.log('导出分类数据...');
    const categories = await db.all('SELECT * FROM categories');
    fs.writeFileSync(
      path.join(tempDir, 'categories.json'),
      JSON.stringify(categories, null, 2)
    );
    
    // 为每个分类创建目录
    for (const category of categories) {
      const categoryDir = path.join(tempDir, 'content', 'posts', category.slug);
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    // 导出文章
    console.log('导出文章数据...');
    const posts = await db.all(`
      SELECT 
        p.*, 
        GROUP_CONCAT(DISTINCT c.slug) as categories,
        GROUP_CONCAT(DISTINCT t.slug) as tags
      FROM posts p
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      GROUP BY p.id
    `);
    
    // 保存文章列表概览
    const postsOverview = posts.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      published: p.published,
      featured: p.featured,
      created_at: p.created_at,
      updated_at: p.updated_at,
      categories: p.categories ? p.categories.split(',') : [],
      tags: p.tags ? p.tags.split(',') : []
    }));
    
    fs.writeFileSync(
      path.join(tempDir, 'posts-overview.json'),
      JSON.stringify(postsOverview, null, 2)
    );
    
    // 导出每篇文章
    for (const post of posts) {
      // 确定文章分类目录
      const postCategories = post.categories ? post.categories.split(',') : ['uncategorized'];
      const primaryCategory = postCategories[0];
      const categoryDir = path.join(tempDir, 'content', 'posts', primaryCategory);
      
      // 确保分类目录存在
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
      
      // 文章内容文件路径
      const contentFilePath = path.join(categoryDir, `${post.slug}.md`);
      
      // 写入文章内容
      fs.writeFileSync(contentFilePath, post.content || '');
      
      // 准备元数据（排除内容字段以减小文件大小）
      const metadata = { ...post };
      delete metadata.content; // 移除大文本字段
      
      // 将标签和分类从字符串转换为数组
      const metadataWithArrays = {
        ...metadata,
        categories: metadata.categories ? metadata.categories.split(',') : [],
        tags: metadata.tags ? metadata.tags.split(',') : []
      };
      
      // 写入元数据文件
      fs.writeFileSync(
        path.join(categoryDir, `${post.slug}.meta.json`),
        JSON.stringify(metadataWithArrays, null, 2)
      );
    }
    
    // 创建README文件
    console.log('创建README文件...');
    const readmeContent = `# Dada的博客内容备份

这个仓库包含了我的个人博客内容的备份，主要用于版本控制和数据安全。

## 目录结构

\`\`\`
/
├── content/           # 博客内容目录
│   ├── posts/         # 已发布的博客文章
│   │   ├── tech/      # 技术分类的文章
│   │   ├── life/      # 生活分类的文章
│   │   └── ...        # 其他分类
│   └── assets/        # 媒体资源文件
│       └── images/    # 图片资源
├── categories.json    # 分类信息
└── posts-overview.json # 文章概览信息
\`\`\`

## 上次更新

${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`;
    
    fs.writeFileSync(path.join(tempDir, 'README.md'), readmeContent);
    
    // 3. 推送到GitHub
    console.log('推送到GitHub...');
    
    // 克隆仓库
    console.log('克隆仓库...');
    // 根据USE_SSH决定使用SSH还是HTTPS连接
    const remoteUrl = USE_SSH 
      ? `git@github.com:${GITHUB_REPO}.git`
      : `https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`;
    
    console.log(`使用${USE_SSH ? 'SSH' : 'HTTPS'}方式连接GitHub...`);
    
    try {
      execSync(`git clone --depth 1 ${remoteUrl} .`, { 
        cwd: cloneDir,
        stdio: 'pipe' // 避免在控制台显示token
      });
      console.log('成功克隆仓库');
      
      // 如果成功克隆，更新内容
      console.log('更新仓库内容...');
      
      // 删除现有内容目录
      if (fs.existsSync(path.join(cloneDir, 'content'))) {
        fs.rmSync(path.join(cloneDir, 'content'), { recursive: true });
      }
      
      // 删除元数据文件
      if (fs.existsSync(path.join(cloneDir, 'categories.json'))) {
        fs.unlinkSync(path.join(cloneDir, 'categories.json'));
      }
      if (fs.existsSync(path.join(cloneDir, 'posts-overview.json'))) {
        fs.unlinkSync(path.join(cloneDir, 'posts-overview.json'));
      }
      
      // 复制新内容
      console.log('复制新内容...');
      
      // 复制content目录
      if (fs.existsSync(path.join(tempDir, 'content'))) {
        copyDirectory(path.join(tempDir, 'content'), path.join(cloneDir, 'content'));
      }
      
      // 复制元数据文件
      if (fs.existsSync(path.join(tempDir, 'categories.json'))) {
        fs.copyFileSync(path.join(tempDir, 'categories.json'), path.join(cloneDir, 'categories.json'));
      }
      if (fs.existsSync(path.join(tempDir, 'posts-overview.json'))) {
        fs.copyFileSync(path.join(tempDir, 'posts-overview.json'), path.join(cloneDir, 'posts-overview.json'));
      }
      
      // 复制README
      if (fs.existsSync(path.join(tempDir, 'README.md'))) {
        // 如果目标已有README，则保留
        if (!fs.existsSync(path.join(cloneDir, 'README.md'))) {
          fs.copyFileSync(path.join(tempDir, 'README.md'), path.join(cloneDir, 'README.md'));
        }
      }
      
      // 提交更改
      console.log('提交更改...');
      execSync('git add .', { cwd: cloneDir });
      
      // 检查是否有更改
      const gitStatus = execSync('git status --porcelain', { cwd: cloneDir }).toString();
      if (gitStatus.trim().length > 0) {
        console.log('检测到更改，提交中...');
        console.log('更改详情:', gitStatus);
        
        const commitMessage = `手动备份: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
        execSync(`git commit -m "${commitMessage}"`, { cwd: cloneDir });
        
        // 推送更改
        console.log('推送更改到GitHub...');
        execSync(`git push origin ${GITHUB_BRANCH}`, { cwd: cloneDir });
        console.log('成功推送更改到GitHub');
      } else {
        console.log('没有检测到更改，跳过提交');
      }
    } catch (error) {
      console.error('仓库操作失败:', error.message);
      
      // 如果克隆失败，直接创建新仓库
      console.log('尝试创建新仓库...');
      execSync('git init', { cwd: tempDir });
      execSync('git config --local user.name "Backup Bot"', { cwd: tempDir });
      execSync('git config --local user.email "backup@example.com"', { cwd: tempDir });
      execSync('git add .', { cwd: tempDir });
      
      const commitMessage = `初始备份: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
      execSync(`git commit -m "${commitMessage}"`, { cwd: tempDir });
      // 使用相同的远程URL方式
      execSync(`git remote add origin ${remoteUrl}`, { cwd: tempDir });
      execSync(`git push -f origin HEAD:${GITHUB_BRANCH}`, { cwd: tempDir });
      console.log('成功创建并推送到新仓库');
    }
    
    console.log('备份完成！');
  } catch (error) {
    console.error('备份过程中发生错误:', error);
    process.exit(1);
  } finally {
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    if (fs.existsSync(cloneDir)) {
      fs.rmSync(cloneDir, { recursive: true });
    }
  }
}

// 辅助函数：复制目录
function copyDirectory(source, destination) {
  // 创建目标目录
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  // 读取源目录内容
  const files = fs.readdirSync(source);
  
  // 复制每个文件/目录
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      // 递归复制子目录
      copyDirectory(sourcePath, destPath);
    } else {
      // 复制文件
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

// 执行备份
manualBackup().catch(error => {
  console.error('备份失败:', error);
  process.exit(1);
}); 