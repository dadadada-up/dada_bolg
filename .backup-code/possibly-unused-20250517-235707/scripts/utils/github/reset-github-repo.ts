/**
 * 重置GitHub仓库脚本
 * 此脚本用于清空GitHub仓库并重新推送初始内容
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 解决ESM模块导入问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 尝试从.env.local文件读取TOKEN
function getGitHubToken(): string {
  // 首先检查环境变量
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  
  // 尝试从.env.local文件读取
  const envPath = path.join(projectRoot, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const tokenMatch = envContent.match(/GITHUB_TOKEN=([^\r\n]+)/);
    if (tokenMatch && tokenMatch[1]) {
      return tokenMatch[1].trim();
    }
  }
  
  // 尝试从.env文件读取
  const envBasePath = path.join(projectRoot, '.env');
  if (fs.existsSync(envBasePath)) {
    const envContent = fs.readFileSync(envBasePath, 'utf-8');
    const tokenMatch = envContent.match(/GITHUB_TOKEN=([^\r\n]+)/);
    if (tokenMatch && tokenMatch[1]) {
      return tokenMatch[1].trim();
    }
  }
  
  return '';
}

// GitHub仓库配置
const GITHUB_REPO = 'dadadada-up/dada_blog';
const GITHUB_BRANCH = 'main';
const GITHUB_TOKEN = getGitHubToken(); // 尝试获取TOKEN

/**
 * 主函数：重置GitHub仓库
 */
async function resetGithubRepo() {
  console.log('开始重置GitHub仓库...');
  
  // 检查token是否存在
  if (!GITHUB_TOKEN) {
    console.error('❌ GitHub Token未设置，无法重置仓库。请设置环境变量GITHUB_TOKEN。');
    process.exit(1);
  }
  
  // 创建临时目录
  const tempDir = path.join(projectRoot, 'temp-reset-repo');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  try {
    // 初始化Git仓库
    console.log('初始化新的Git仓库...');
    execSync('git init', { cwd: tempDir });
    execSync('git config --local user.name "Reset Bot"', { cwd: tempDir });
    execSync('git config --local user.email "reset@example.com"', { cwd: tempDir });
    
    // 创建初始文件
    createInitialFiles(tempDir);
    
    // 提交初始文件
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit: 重置仓库"', { cwd: tempDir });
    
    // 推送到GitHub（强制覆盖）
    console.log('正在推送到GitHub（将覆盖所有现有内容）...');
    const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`;
    execSync(`git remote add origin ${remoteUrl}`, { cwd: tempDir });
    execSync(`git push -f origin HEAD:${GITHUB_BRANCH}`, { 
      cwd: tempDir,
      stdio: 'pipe' // 避免在控制台显示token
    });
    
    console.log('✅ GitHub仓库已成功重置！');
    
  } catch (error) {
    console.error('❌ 重置GitHub仓库时发生错误:', error);
  } finally {
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
      console.log('临时目录已清理');
    }
  }
}

/**
 * 创建初始文件
 */
function createInitialFiles(tempDir: string) {
  console.log('创建初始文件...');
  
  // 创建README.md
  const readmeContent = `# dada_blog - 个人博客内容仓库

这个仓库存储了我的个人博客文章和相关内容，采用 Markdown 格式。该仓库与我的博客平台集成，当内容更新时，博客网站会自动获取并展示最新内容。

## 仓库结构

\`\`\`
/
├── content/           # 博客内容目录
│   ├── posts/        # 已发布的博客文章
│   ├── drafts/       # 草稿文章
│   └── assets/       # 图片和其他媒体资源
├── categories.json    # 分类信息
└── posts-overview.json # 文章概览信息
\`\`\`

## 上次更新

${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`;
  fs.writeFileSync(path.join(tempDir, 'README.md'), readmeContent);
  
  // 创建.gitignore
  const gitignoreContent = `node_modules
.env
.DS_Store
`;
  fs.writeFileSync(path.join(tempDir, '.gitignore'), gitignoreContent);
  
  // 创建基本目录结构
  fs.mkdirSync(path.join(tempDir, 'content'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'content', 'posts'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'content', 'drafts'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'content', 'assets'), { recursive: true });
  
  // 创建示例分类信息
  const categoriesContent = `[
  {
    "id": 1,
    "name": "技术",
    "slug": "tech",
    "description": "技术相关文章"
  },
  {
    "id": 2,
    "name": "金融",
    "slug": "finance",
    "description": "金融相关文章"
  },
  {
    "id": 3,
    "name": "生活",
    "slug": "life",
    "description": "生活相关文章"
  }
]`;
  fs.writeFileSync(path.join(tempDir, 'categories.json'), categoriesContent);
  
  // 创建示例文章概览
  const postsOverviewContent = `[]`;
  fs.writeFileSync(path.join(tempDir, 'posts-overview.json'), postsOverviewContent);
  
  console.log('初始文件创建完成');
}

// 执行脚本
resetGithubRepo().catch(error => {
  console.error('执行失败:', error);
  process.exit(1);
}); 