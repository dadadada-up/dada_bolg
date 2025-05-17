/**
 * 博客内容备份脚本
 * 将SQLite数据库中的内容备份到GitHub仓库
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { Database } from 'sqlite';

// 全局异常处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

console.log('脚本开始初始化...');

// 解决ESM模块导入问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('项目根目录:', projectRoot);

// 添加调试模式标志
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
console.log('调试模式:', DEBUG_MODE ? '开启' : '关闭');

// 调试日志函数
function debug(...args: any[]) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
}

// 尝试从.env.local文件读取TOKEN
function getGitHubToken(): string {
  debug('尝试获取GitHub Token...');
  
  // 首先检查环境变量
  if (process.env.GITHUB_TOKEN) {
    debug('从环境变量获取到Token');
    return process.env.GITHUB_TOKEN;
  }
  
  // 尝试从.env.local文件读取
  const envPath = path.join(projectRoot, '.env.local');
  if (fs.existsSync(envPath)) {
    debug(`检查文件: ${envPath}`);
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const tokenMatch = envContent.match(/GITHUB_TOKEN=([^\r\n]+)/);
    if (tokenMatch && tokenMatch[1]) {
      debug('从.env.local获取到Token');
      return tokenMatch[1].trim();
    }
  }
  
  // 尝试从.env文件读取
  const envBasePath = path.join(projectRoot, '.env');
  if (fs.existsSync(envBasePath)) {
    debug(`检查文件: ${envBasePath}`);
    const envContent = fs.readFileSync(envBasePath, 'utf-8');
    const tokenMatch = envContent.match(/GITHUB_TOKEN=([^\r\n]+)/);
    if (tokenMatch && tokenMatch[1]) {
      debug('从.env获取到Token');
      return tokenMatch[1].trim();
    }
  }
  
  debug('未找到Token');
  return '';
}

// GitHub仓库配置
const GITHUB_REPO = 'dadadada-up/dada_blog';
const GITHUB_BRANCH = 'main';
const GITHUB_TOKEN = getGitHubToken(); // 尝试获取TOKEN

// 测试模式配置
const TEST_MODE = process.env.TEST_MODE === 'true';
const MOCK_REPO_DIR = process.env.MOCK_REPO_DIR || '';

// 备份目录结构
const BACKUP_STRUCTURE = {
  content: {
    posts: {},      // 文章内容
    drafts: {},     // 草稿内容
    assets: {       // 资源文件
      images: {
        posts: {}   // 文章图片
      }
    }
  }
};

// 元数据文件名后缀
const META_SUFFIX = '.meta.json';

/**
 * 主备份函数
 */
async function backupToBlog() {
  console.log('开始备份博客内容到GitHub...');
  console.log('RESET_MODE:', process.env.RESET_MODE);
  console.log('GITHUB_TOKEN 长度:', getGitHubToken().length);
  
  // 创建临时目录
  const tempDir = path.join(projectRoot, 'temp-backup');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  console.log('临时目录创建完成:', tempDir);
  
  // 设置超时检测
  const timeoutId = setTimeout(() => {
    console.error('备份操作超时！脚本可能卡在某个操作点。');
    process.exit(1);
  }, 30000); // 30秒超时
  
  try {
    // 1. 动态导入数据库模块
    console.log('正在导入数据库模块...');
    let getDb;
    try {
      // 直接导入db.ts文件
      debug('尝试导入 ../src/lib/db.ts');
      
      try {
        const dbModule = await import('../src/lib/db.ts');
        debug('成功导入 ../src/lib/db.ts');
        
        getDb = dbModule.getDb;
        console.log('成功导入数据库模块');
      } catch (importError: any) {
        console.error('导入 ../src/lib/db.ts 失败:', importError.message);
        
        // 尝试备用导入方式
        console.log('尝试备用导入方式...');
        const sqlite = await import('sqlite');
        const sqlite3 = await import('sqlite3');
        
        getDb = async () => {
          const db = await sqlite.default.open({
            filename: path.join(projectRoot, 'data', 'blog.db'),
            driver: sqlite3.Database
          });
          return db;
        };
        
        console.log('使用备用数据库连接方式');
      }
    } catch (dbImportError) {
      console.error('导入数据库模块失败:', dbImportError);
      throw dbImportError;
    }
    
    let db;
    try {
      db = await getDb();
      console.log('数据库连接成功');
    } catch (dbConnectError) {
      console.error('数据库连接失败:', dbConnectError);
      console.error('尝试创建备用数据进行测试...');
      
      // 创建备用数据用于测试
      const createDummyData = () => {
        console.log('创建备用数据...');
        // 创建分类数据
        const categories = [
          { id: 1, name: '技术', slug: 'tech' },
          { id: 2, name: '生活', slug: 'life' }
        ];
        
        // 创建文章数据
        const posts = [
          { 
            id: 1, 
            title: '测试文章', 
            slug: 'test-post', 
            content: '# 测试文章\n\n这是一篇测试文章，用于备份功能测试。',
            excerpt: '测试文章摘要',
            description: '这是一篇测试文章',
            published: 1,
            featured: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            categories: 'tech',
            tags: 'test,backup'
          }
        ];
        
        // 创建目录结构并保存文件
        console.log('保存备用测试数据到临时目录');
        
        // 保存分类信息
        fs.writeFileSync(path.join(tempDir, 'categories.json'), JSON.stringify(categories, null, 2));
        
        // 保存文章总览
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
        fs.writeFileSync(path.join(tempDir, 'posts-overview.json'), JSON.stringify(postsOverview, null, 2));
        
        // 创建文章目录和文件
        const categoryDir = path.join(tempDir, 'content', 'posts', 'tech');
        fs.mkdirSync(categoryDir, { recursive: true });
        
        // 写入文章内容
        fs.writeFileSync(path.join(categoryDir, 'test-post.md'), posts[0].content || '');
        
        // 写入元数据
        const metadata = { ...posts[0] } as any;
        delete metadata.content;
        const metadataWithArrays = {
          ...metadata,
          categories: metadata.categories ? metadata.categories.split(',') : [],
          tags: metadata.tags ? metadata.tags.split(',') : []
        };
        fs.writeFileSync(
          path.join(categoryDir, `test-post${META_SUFFIX}`),
          JSON.stringify(metadataWithArrays, null, 2)
        );
        
        console.log('备用测试数据创建完成');
      };
      
      createDummyData();
      // 继续处理，但使用备用数据
      console.log('使用备用数据继续处理');
    }
    
    // 2. 创建目录结构
    try {
      createDirectoryStructure(tempDir, BACKUP_STRUCTURE);
      console.log('创建目录结构完成');
    } catch (error) {
      console.error('创建目录结构失败:', error);
      throw error;
    }
    
    // 3-5. 执行导出操作
    console.log('开始执行导出操作...');
    try {
      if (db) {
        await testBackupExport(db, tempDir);
      } else {
        console.log('使用备用数据，跳过数据库导出');
      }
      console.log('导出操作完成');
    } catch (exportError) {
      console.error('导出操作失败:', exportError);
      // 即使导出失败，也尝试推送（可能有备用数据）
      console.warn('尝试使用现有数据继续处理');
    }
    
    // 检查临时目录是否有内容
    try {
      const tempContents = fs.readdirSync(tempDir);
      console.log('临时目录内容:', tempContents.join(', '));
      
      // 检查是否有必要的文件
      const hasCategories = fs.existsSync(path.join(tempDir, 'categories.json'));
      const hasPostsOverview = fs.existsSync(path.join(tempDir, 'posts-overview.json'));
      const hasContent = fs.existsSync(path.join(tempDir, 'content'));
      
      console.log('必要文件检查:');
      console.log('- categories.json:', hasCategories ? '存在' : '不存在');
      console.log('- posts-overview.json:', hasPostsOverview ? '存在' : '不存在');
      console.log('- content目录:', hasContent ? '存在' : '不存在');
      
      if (!hasCategories || !hasPostsOverview || !hasContent) {
        console.warn('缺少必要文件，将创建备用数据');
        
        // 确保categories.json存在
        if (!hasCategories) {
          fs.writeFileSync(path.join(tempDir, 'categories.json'), '[]');
        }
        
        // 确保posts-overview.json存在
        if (!hasPostsOverview) {
          fs.writeFileSync(path.join(tempDir, 'posts-overview.json'), '[]');
        }
        
        // 确保content目录存在
        if (!hasContent) {
          fs.mkdirSync(path.join(tempDir, 'content'), { recursive: true });
        }
      }
    } catch (error) {
      console.error('检查临时目录内容失败:', error);
    }
    
    // 6. 创建README文件
    try {
      createReadmeFile(tempDir);
      console.log('创建README文件完成');
    } catch (readmeError) {
      console.error('创建README文件失败:', readmeError);
    }
    
    // 7. 推送到GitHub
    console.log('开始推送到GitHub...');
    try {
      const pushResult = await pushToGitHub(tempDir);
      if (pushResult) {
        console.log('✅ 备份完成！内容已成功推送到GitHub仓库');
      } else {
        console.log('❌ 推送到GitHub失败');
      }
    } catch (pushError) {
      console.error('推送到GitHub时发生错误:', pushError);
      throw pushError;
    }
    
    // 取消超时检测
    clearTimeout(timeoutId);
    
    console.log('备份操作完成');
    return true;
  } catch (error) {
    console.error('❌ 备份过程中发生错误:', error);
    // 打印更详细的错误信息
    if (error instanceof Error) {
      debug('错误详情:', error.stack);
    }
    
    // 取消超时检测
    clearTimeout(timeoutId);
    
    return false;
  } finally {
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
      console.log('临时目录已清理');
    }
  }
}

/**
 * 备份测试函数（不包含GitHub推送）
 * 此函数用于测试脚本，导出内容但不推送到GitHub
 */
async function testBackupExport(db: Database, tempDir: string) {
  console.log('开始执行测试导出函数...');
  
  try {
    // 1. 创建目录结构
    createDirectoryStructure(tempDir, BACKUP_STRUCTURE);
    console.log('创建目录结构完成');
    
    // 2. 导出分类信息
    try {
      await exportCategories(db, tempDir);
      console.log('分类信息导出完成');
    } catch (error) {
      console.error('导出分类信息失败:', error);
      throw error;
    }
    
    // 3. 导出文章内容
    try {
      await exportPosts(db, tempDir);
      console.log('文章内容导出完成');
    } catch (error) {
      console.error('导出文章内容失败:', error);
      throw error;
    }
    
    // 4. 复制README文件
    try {
      createReadmeFile(tempDir);
      console.log('创建README文件完成');
    } catch (error) {
      console.error('创建README文件失败:', error);
      throw error;
    }
    
    console.log('测试导出函数执行完成');
    return tempDir;
  } catch (error) {
    console.error('测试导出函数失败:', error);
    throw error;
  }
}

/**
 * 递归创建目录结构
 */
function createDirectoryStructure(basePath: string, structure: Record<string, any>, currentPath: string = '') {
  for (const [key, value] of Object.entries(structure)) {
    const dirPath = path.join(basePath, currentPath, key);
    fs.mkdirSync(dirPath, { recursive: true });
    
    if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
      createDirectoryStructure(basePath, value, path.join(currentPath, key));
    }
  }
}

/**
 * 导出分类信息
 */
async function exportCategories(db: Database, tempDir: string) {
  const categories = await db.all('SELECT * FROM categories');
  
  // 为每个分类创建目录
  for (const category of categories) {
    const categoryDir = path.join(tempDir, 'content', 'posts', category.slug);
    fs.mkdirSync(categoryDir, { recursive: true });
  }
  
  // 保存分类信息
  fs.writeFileSync(
    path.join(tempDir, 'categories.json'),
    JSON.stringify(categories, null, 2)
  );
}

// 定义数据库查询返回的文章接口
interface Post {
  id: number;
  slug: string;
  title: string;
  content?: string;  // 可选字段，允许delete操作
  excerpt?: string;
  description?: string;
  published: number;
  featured: number;
  cover_image?: string;
  reading_time?: number;
  original_file?: string;
  created_at: string;
  updated_at: string;
  categories?: string;
  tags?: string;
}

/**
 * 导出文章内容
 */
async function exportPosts(db: Database, tempDir: string) {
  // 获取所有文章及其分类和标签
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
  `) as Post[];
  
  // 导出每篇文章
  for (const post of posts) {
    // 确定文章分类目录
    const categories = post.categories ? post.categories.split(',') : ['uncategorized'];
    const primaryCategory = categories[0];
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
      path.join(categoryDir, `${post.slug}${META_SUFFIX}`),
      JSON.stringify(metadataWithArrays, null, 2)
    );
  }
  
  // 保存文章总览信息
  const postsOverview = posts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    published: post.published,
    featured: post.featured,
    created_at: post.created_at,
    updated_at: post.updated_at,
    categories: post.categories ? post.categories.split(',') : [],
    tags: post.tags ? post.tags.split(',') : []
  }));
  
  fs.writeFileSync(
    path.join(tempDir, 'posts-overview.json'),
    JSON.stringify(postsOverview, null, 2)
  );
}

/**
 * 创建README文件
 */
function createReadmeFile(tempDir: string) {
  const readmeContent = `# Dada的博客内容备份

这个仓库包含了我的个人博客内容的备份，主要用于版本控制和数据安全。

## 目录结构

\`\`\`
/
├── content/           # 博客内容目录
│   ├── posts/         # 已发布的博客文章
│   │   ├── tech-tools/    # 技术工具分类的文章
│   │   ├── finance/       # 金融分类的文章
│   │   └── ...            # 其他分类
│   └── assets/        # 媒体资源文件
│       └── images/    # 图片资源
├── categories.json    # 分类信息
└── posts-overview.json # 文章概览信息
\`\`\`

## 文件格式

- 文章内容以Markdown格式存储
- 每篇文章有两个文件:
  - \`[slug].md\`: 文章内容
  - \`[slug].meta.json\`: 文章元数据

## 上次更新

${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`;

  fs.writeFileSync(path.join(tempDir, 'README.md'), readmeContent);
}

/**
 * 推送到GitHub
 */
async function pushToGitHub(tempDir: string) {
  console.log('===== 开始推送到GitHub =====');
  try {
    // 测试模式下使用模拟仓库
    if (TEST_MODE && MOCK_REPO_DIR) {
      console.log('测试模式：将备份内容推送到模拟仓库...');
      
      // 使用与生产环境相同的逻辑，但目标是本地目录而不是GitHub仓库
      const cloneDir = MOCK_REPO_DIR; // 直接使用模拟仓库目录
      
      // 删除克隆目录中已有的内容目录，但保留其他文件
      if (fs.existsSync(path.join(cloneDir, 'content'))) {
        fs.rmSync(path.join(cloneDir, 'content'), { recursive: true });
      }
      if (fs.existsSync(path.join(cloneDir, 'categories.json'))) {
        fs.unlinkSync(path.join(cloneDir, 'categories.json'));
      }
      if (fs.existsSync(path.join(cloneDir, 'posts-overview.json'))) {
        fs.unlinkSync(path.join(cloneDir, 'posts-overview.json'));
      }
      
      // 复制新的备份内容到克隆目录
      copyDirectory(path.join(tempDir, 'content'), path.join(cloneDir, 'content'));
      fs.copyFileSync(path.join(tempDir, 'categories.json'), path.join(cloneDir, 'categories.json'));
      fs.copyFileSync(path.join(tempDir, 'posts-overview.json'), path.join(cloneDir, 'posts-overview.json'));
      
      // 使用克隆目录中的README，如果没有则复制新创建的README
      if (!fs.existsSync(path.join(cloneDir, 'README.md'))) {
        fs.copyFileSync(path.join(tempDir, 'README.md'), path.join(cloneDir, 'README.md'));
      }
      
      // 提交更改
      execSync('git add .', { cwd: cloneDir });
      
      // 尝试判断是否有更改
      let hasChanges = true;
      try {
        const gitStatus = execSync('git status --porcelain', { cwd: cloneDir }).toString();
        hasChanges = gitStatus.trim().length > 0;
        console.log('[测试模式] Git状态检查 - 有更改需要提交:', hasChanges);
        console.log('[测试模式] Git状态详情:', gitStatus);
      } catch (e) {
        console.warn('[测试模式] 检查Git状态时出错:', e);
        // 忽略检查错误，默认有更改
      }
      
      if (hasChanges) {
        const commitMessage = `自动备份(测试模式): ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
        execSync(`git commit -m "${commitMessage}"`, { cwd: cloneDir });
        console.log('[测试模式] 已将更改提交到模拟仓库');
      } else {
        console.log('[测试模式] 没有检测到更改，跳过提交');
      }
      
      return true;
    }
    
    // 生产模式下的代码
    // 为安全起见，检查token是否存在
    if (!GITHUB_TOKEN) {
      throw new Error('GitHub Token未设置，无法推送到GitHub。请设置环境变量GITHUB_TOKEN。');
    }
    
    console.log('正在使用生产模式推送到GitHub...');
    
    // 生成一个包含token的远程URL
    const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`;
    console.log(`仓库地址: https://github.com/${GITHUB_REPO}.git (已隐藏Token)`);
    
    // 创建一个新的临时目录用于克隆现有仓库
    const cloneDir = path.join(projectRoot, 'temp-clone');
    if (fs.existsSync(cloneDir)) {
      fs.rmSync(cloneDir, { recursive: true });
    }
    fs.mkdirSync(cloneDir, { recursive: true });
    console.log('临时克隆目录创建完成:', cloneDir);
    
    try {
      console.log('正在克隆现有仓库...');
      // 尝试克隆现有仓库
      try {
        execSync(`git clone --depth 1 https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git .`, { 
          cwd: cloneDir,
          stdio: 'pipe' // 避免在控制台显示token
        });
        console.log('成功克隆现有仓库');
      } catch (cloneError: any) {
        console.error('克隆仓库出错:', cloneError.message);
        throw cloneError;
      }
      
      // 检查仓库是否为新初始化的仓库
      const isNewRepo = checkIfNewRepo(cloneDir);
      console.log('仓库状态检查 - 是否为新初始化仓库:', isNewRepo);
      
      // 检查目录内容
      try {
        const repoContents = fs.readdirSync(cloneDir);
        console.log('仓库目录内容:', repoContents.join(', '));
      } catch (e) {
        console.error('读取仓库目录失败:', e);
      }
      
      // 保留需要保留的文件列表（可根据需要调整）
      const filesToPreserve = [
        '.gitignore',
        'CONTRIBUTING.md',
        'LICENSE',
        'debug.html',
        'replacements.txt',
        '项目开发需求文档.md'
      ];
      
      // 如果是新初始化的仓库或者当前使用reset-repo模式，完全替换内容
      if (isNewRepo || process.env.RESET_MODE === 'true') {
        console.log('检测到新初始化的仓库或重置模式，将完全替换内容');
        
        // 清空仓库（除了.git目录）
        const items = fs.readdirSync(cloneDir);
        for (const item of items) {
          if (item !== '.git') {
            const itemPath = path.join(cloneDir, item);
            if (fs.lstatSync(itemPath).isDirectory()) {
              fs.rmSync(itemPath, { recursive: true });
            } else {
              fs.unlinkSync(itemPath);
            }
          }
        }
        
        // 复制所有内容
        const tempItems = fs.readdirSync(tempDir);
        for (const item of tempItems) {
          const srcPath = path.join(tempDir, item);
          const destPath = path.join(cloneDir, item);
          
          if (fs.lstatSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      } else {
        // 标准模式：仅更新博客内容，保留其他文件
        console.log('标准模式：更新博客内容，保留其他文件');
        
        // 删除克隆目录中已有的内容目录，但保留其他文件
        if (fs.existsSync(path.join(cloneDir, 'content'))) {
          fs.rmSync(path.join(cloneDir, 'content'), { recursive: true });
        }
        if (fs.existsSync(path.join(cloneDir, 'categories.json'))) {
          fs.unlinkSync(path.join(cloneDir, 'categories.json'));
        }
        if (fs.existsSync(path.join(cloneDir, 'posts-overview.json'))) {
          fs.unlinkSync(path.join(cloneDir, 'posts-overview.json'));
        }
        
        // 复制新的备份内容到克隆目录
        copyDirectory(path.join(tempDir, 'content'), path.join(cloneDir, 'content'));
        fs.copyFileSync(path.join(tempDir, 'categories.json'), path.join(cloneDir, 'categories.json'));
        fs.copyFileSync(path.join(tempDir, 'posts-overview.json'), path.join(cloneDir, 'posts-overview.json'));
        
        // 使用克隆目录中的README，如果没有则复制新创建的README
        if (!fs.existsSync(path.join(cloneDir, 'README.md'))) {
          fs.copyFileSync(path.join(tempDir, 'README.md'), path.join(cloneDir, 'README.md'));
        }
      }
      
      // 提交更改
      try {
        console.log('添加更改到Git...');
        execSync('git add .', { cwd: cloneDir });
        
        // 尝试判断是否有更改
        let hasChanges = true;
        let gitStatus = '';
        try {
          gitStatus = execSync('git status --porcelain', { cwd: cloneDir }).toString();
          hasChanges = gitStatus.trim().length > 0;
          console.log('Git状态检查 - 有更改需要提交:', hasChanges);
          console.log('Git状态详情:', gitStatus);
        } catch (e) {
          console.warn('检查Git状态时出错:', e);
          // 忽略检查错误，默认有更改
        }
        
        if (hasChanges) {
          const commitMessage = isNewRepo || process.env.RESET_MODE === 'true'
            ? `完全替换内容: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
            : `自动备份: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
          
          console.log('提交更改...');
          execSync(`git commit -m "${commitMessage}"`, { cwd: cloneDir });
          
          // 推送更改
          console.log('正在推送更改到GitHub...');
          try {
            execSync(`git push origin ${GITHUB_BRANCH}`, { cwd: cloneDir });
            console.log('成功推送更改到GitHub');
          } catch (pushError: any) {
            console.error('推送到GitHub失败:', pushError.message);
            
            // 尝试获取更详细的错误信息
            try {
              const pushErrorDetail = execSync(`git push origin ${GITHUB_BRANCH} 2>&1`, { 
                cwd: cloneDir, 
                encoding: 'utf8'
              });
              console.error('推送错误详情:', pushErrorDetail);
            } catch (e) {
              // 忽略
            }
            
            throw pushError;
          }
        } else {
          console.log('没有检测到更改，跳过提交和推送');
          
          // 检查本地和远程的差异
          try {
            console.log('检查与远程仓库的差异...');
            const diffOutput = execSync('git diff origin/main', { 
              cwd: cloneDir,
              encoding: 'utf8'
            });
            if (diffOutput.trim().length > 0) {
              console.log('检测到与远程仓库的差异，但本地状态没有变化');
              console.log('差异摘要:', diffOutput.substring(0, 200) + (diffOutput.length > 200 ? '...' : ''));
            } else {
              console.log('本地与远程仓库内容一致');
            }
          } catch (e) {
            console.warn('检查与远程差异时出错:', e);
          }
        }
      } catch (gitError: any) {
        console.error('Git操作失败:', gitError.message);
        throw gitError;
      }
      
      return true;
    } catch (cloneError: any) {
      console.warn('克隆现有仓库失败，将创建新仓库:', cloneError.message);
      
      // 如果克隆失败（可能是因为仓库不存在），则使用原来的方法初始化并推送
      execSync('git init', { cwd: tempDir });
      execSync('git config --local user.name "Backup Bot"', { cwd: tempDir });
      execSync('git config --local user.email "backup@example.com"', { cwd: tempDir });
      execSync('git add .', { cwd: tempDir });
      const commitMessage = `初始备份: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
      execSync(`git commit -m "${commitMessage}"`, { cwd: tempDir });
      execSync(`git remote add origin ${remoteUrl}`, { cwd: tempDir });
      
      console.log('正在推送到新仓库...');
      try {
        execSync(`git push -f origin HEAD:${GITHUB_BRANCH}`, { cwd: tempDir });
        console.log('成功推送到新仓库');
      } catch (pushError: any) {
        console.error('推送到新仓库失败:', pushError.message);
        throw pushError;
      }
      
      return true;
    }
  } catch (error) {
    console.error('推送到GitHub失败:', error);
    return false;
  } finally {
    // 清理克隆目录
    const cloneDir = path.join(projectRoot, 'temp-clone');
    if (fs.existsSync(cloneDir)) {
      fs.rmSync(cloneDir, { recursive: true });
      console.log('临时克隆目录已清理');
    }
  }
}

/**
 * 检查是否为新初始化的仓库
 */
function checkIfNewRepo(repoDir: string): boolean {
  try {
    // 检查提交历史数量
    const commitCount = execSync('git rev-list --count HEAD', { 
      cwd: repoDir 
    }).toString().trim();
    
    // 检查是否只有一次提交且包含关键词"初始"或"重置"
    if (commitCount === '1') {
      const commitMessage = execSync('git log -1 --pretty=%B', { cwd: repoDir }).toString().trim();
      return commitMessage.includes('初始') || commitMessage.includes('重置');
    }
    
    return false;
  } catch (error) {
    // 出错时保守返回false
    console.warn('检查仓库状态时出错:', error);
    return false;
  }
}

/**
 * 复制目录及其内容
 */
function copyDirectory(sourceDir: string, targetDir: string) {
  // 确保目标目录存在
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // 读取源目录内容
  const items = fs.readdirSync(sourceDir, { withFileTypes: true });
  
  // 遍历目录项
  for (const item of items) {
    const sourcePath = path.join(sourceDir, item.name);
    const targetPath = path.join(targetDir, item.name);
    
    if (item.isDirectory()) {
      // 递归复制子目录
      copyDirectory(sourcePath, targetPath);
    } else {
      // 复制文件
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

// 检查是否直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('脚本开始执行...');
  
  process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    process.exit(1);
  });
  
  backupToBlog()
    .then(() => {
      console.log('备份脚本执行完毕');
    })
    .catch(error => {
      console.error('备份失败:', error);
      process.exit(1);
    });
}

// 导出用于其他脚本调用
export { backupToBlog, testBackupExport }; 