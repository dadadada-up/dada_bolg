#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

// 模拟分类和标签数据
const categories = [
  { slug: 'technology', name: '技术' },
  { slug: 'programming', name: '编程' },
  { slug: 'web-development', name: 'Web开发' },
  { slug: 'javascript', name: 'JavaScript' },
  { slug: 'react', name: 'React' },
  { slug: 'nextjs', name: 'Next.js' },
  { slug: 'database', name: '数据库' },
  { slug: 'backend', name: '后端' },
  { slug: 'frontend', name: '前端' },
];

const tags = [
  { slug: 'javascript', name: 'JavaScript' },
  { slug: 'react', name: 'React' },
  { slug: 'nextjs', name: 'Next.js' },
  { slug: 'nodejs', name: 'Node.js' },
  { slug: 'css', name: 'CSS' },
  { slug: 'html', name: 'HTML' },
  { slug: 'typescript', name: 'TypeScript' },
  { slug: 'database', name: '数据库' },
  { slug: 'sqlite', name: 'SQLite' },
];

// 生成分类页面模板
function generateCategoryPage(category) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${category.name} - 分类 - Dada Blog</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      margin-bottom: 1rem;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: #0070f3;
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="/categories/" class="back-link">← 返回所有分类</a>
    <h1>${category.name} 分类</h1>
    <p>这是一个静态分类页面，用于确保构建过程不会失败。</p>
    <p>在实际开发中，这个页面会显示属于 ${category.name} 分类的所有文章。</p>
  </div>
</body>
</html>`;
}

// 生成标签页面模板
function generateTagPage(tag) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tag.name} - 标签 - Dada Blog</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      margin-bottom: 1rem;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: #0070f3;
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="/tags/" class="back-link">← 返回所有标签</a>
    <h1>${tag.name} 标签</h1>
    <p>这是一个静态标签页面，用于确保构建过程不会失败。</p>
    <p>在实际开发中，这个页面会显示带有 ${tag.name} 标签的所有文章。</p>
  </div>
</body>
</html>`;
}

// 生成分类索引页面
function generateCategoriesIndexPage(categories) {
  const categoryLinks = categories.map(category => 
    `<a href="/categories/${category.slug}/" 
        style="display: inline-block; margin: 0.5rem; padding: 0.5rem 1rem; 
               border: 1px solid #ccc; border-radius: 4px; 
               color: #0070f3; text-decoration: none;">
      ${category.name}
     </a>`
  ).join('\n      ');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>所有分类 - Dada Blog</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      margin-bottom: 1rem;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: #0070f3;
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    .categories {
      display: flex;
      flex-wrap: wrap;
      margin: 1rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-link">← 返回首页</a>
    <h1>所有分类</h1>
    <p>共 ${categories.length} 个分类</p>
    
    <div class="categories">
      ${categoryLinks}
    </div>
  </div>
</body>
</html>`;
}

// 生成标签索引页面
function generateTagsIndexPage(tags) {
  const tagLinks = tags.map(tag => 
    `<a href="/tags/${tag.slug}/" 
        style="display: inline-block; margin: 0.5rem; padding: 0.5rem 1rem; 
               border: 1px solid #ccc; border-radius: 4px; 
               color: #0070f3; text-decoration: none;">
      ${tag.name}
     </a>`
  ).join('\n      ');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>所有标签 - Dada Blog</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      margin-bottom: 1rem;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: #0070f3;
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      margin: 1rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-link">← 返回首页</a>
    <h1>所有标签</h1>
    <p>共 ${tags.length} 个标签</p>
    
    <div class="tags">
      ${tagLinks}
    </div>
  </div>
</body>
</html>`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`已生成: ${filePath}`);
  } catch (error) {
    console.error(`生成文件失败 ${filePath}: ${error.message}`);
  }
}

async function main() {
  console.log('开始生成静态页面...');
  
  // 确保目录存在
  const categoriesDir = path.join(publicDir, 'categories');
  const tagsDir = path.join(publicDir, 'tags');
  
  await ensureDir(categoriesDir);
  await ensureDir(tagsDir);
  
  // 生成分类索引页面
  await writeFile(
    path.join(categoriesDir, 'index.html'),
    generateCategoriesIndexPage(categories)
  );
  
  // 生成标签索引页面
  await writeFile(
    path.join(tagsDir, 'index.html'),
    generateTagsIndexPage(tags)
  );
  
  // 生成各个分类页面
  for (const category of categories) {
    const categoryDir = path.join(categoriesDir, category.slug);
    await ensureDir(categoryDir);
    
    await writeFile(
      path.join(categoryDir, 'index.html'),
      generateCategoryPage(category)
    );
  }
  
  // 生成各个标签页面
  for (const tag of tags) {
    const tagDir = path.join(tagsDir, tag.slug);
    await ensureDir(tagDir);
    
    await writeFile(
      path.join(tagDir, 'index.html'),
      generateTagPage(tag)
    );
  }
  
  console.log('静态页面生成完成!');
}

main().catch(err => {
  console.error('生成静态页面时出错:', err);
  process.exit(1);
}); 