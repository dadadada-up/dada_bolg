// 移除'use server'指令

import { Octokit } from "octokit";
import matter from "gray-matter";
import { Post } from "@/types/post";
import { slugify, enhancedSlugify } from "@/lib/utils";
// 导入持久化缓存模块
import {
  getCachedPosts,
  setCachedPosts,
  getCachedContent,
  setCachedContent,
  getCachedTreeData,
  setCachedTreeData,
  clearAllGithubCache,
  getCacheStats,
  clearCache,
  clearCacheItem,
  clearPostCache
} from "@/lib/fs-cache";
import fs from 'fs';
import path from 'path';

// 检查并获取环境变量
const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || "dadadada-up";
const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME || "dada_blog";
const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;

// 环境变量检查与日志
console.log(`[GitHub 初始化] 开始加载, 环境: ${process.env.NODE_ENV}`);
console.log(`[GitHub 初始化] 仓库: ${owner}/${repo}`);
console.log(`[GitHub 初始化] Token 长度: ${token?.length || 0}`);
console.log(`[GitHub 初始化] Token 格式: ${token ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}` : 'Missing'}`);

// 如果token不存在，记录警告
if (!token) {
  console.warn('[GitHub 初始化] 警告: GitHub Token 未设置, API请求可能会失败');
}

// 使用本地内容目录方便本地开发
const contentBasePath = path.resolve(process.cwd(), '../../content');
console.log(`[GitHub 初始化] 内容目录路径: ${contentBasePath}`);

// 更新基础路径指向content/posts目录
const basePath = "content/posts";

// 原始内容的基础URL
const rawBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main`;

// GitHub API基础URL
const apiBaseUrl = `https://api.github.com/repos/${owner}/${repo}`;

// 缓存系统
const MEMORY_CACHE_TTL = 1000 * 60 * 15; // 内存缓存15分钟
const FS_CACHE_TTL = 1000 * 60 * 60 * 24; // 文件系统缓存24小时
const RETRY_DELAY = 500; // 失败重试的基础延迟时间

// 内存缓存初始化
const memoryCache = {
  posts: null as Post[] | null,
  lastFetched: 0,
  treeData: null as any | null,
  treeLastFetched: 0,
};

// 内容内存缓存，使用Map提高访问效率
const contentMemoryCache = new Map<string, { content: string; timestamp: number }>();

// 检查持久化缓存状态
async function logCacheStatus() {
  try {
    // 输出缓存状态
    const postsStats = await getCacheStats('github-posts');
    const contentStats = await getCacheStats('github-content');
    const treeStats = await getCacheStats('github-tree');
    
    console.log('[FS-Cache] 缓存状态:');
    console.log(`  - 文章缓存: ${postsStats.count} 项, ${Math.round(postsStats.size / 1024)} KB`);
    console.log(`  - 内容缓存: ${contentStats.count} 项, ${Math.round(contentStats.size / 1024)} KB`);
    console.log(`  - 树缓存: ${treeStats.count} 项, ${Math.round(treeStats.size / 1024)} KB`);
  } catch (error) {
    console.error('[FS-Cache] 获取缓存状态失败:', error);
  }
}

// 异步初始化 - 不阻塞启动
logCacheStatus().catch(console.error);

// 延时函数
const randomDelay = async (min = 200, max = 500): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min) + min);
  return new Promise(resolve => setTimeout(resolve, delay));
};

interface GitHubFileContent {
  type: string;
  name: string;
  path: string;
  content?: string;
}

interface GithubTreeItem {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
  url: string;
}

interface GithubTreeResponse {
  sha: string;
  url: string;
  tree: GithubTreeItem[];
  truncated: boolean;
}

// 手动定义分类目录
const knownCategories = [
  'tech-tools',
  'product-management',
  'open-source',
  'personal-blog',
  'finance',
  'insurance',
  'family-life'
];

// 分类映射关系
const categoryMapping: Record<string, string> = {
  'travel': 'family-life',
  'reading': 'family-life',
  'agriculture-insurance': 'insurance'
};

// 英文到中文的分类名映射
const categoryNameMapping: Record<string, string> = {
  'tech-tools': '技术工具',
  'product-management': '产品经理',
  'open-source': '开源项目',
  'personal-blog': '个人博客',
  'finance': '金融',
  'insurance': '保险',
  'family-life': '家庭生活',
  'travel': '旅行',
  'reading': '读书笔记'
};

// 中文到英文的反向映射
const reverseCategoryNameMapping: Record<string, string> = {};
for (const [key, value] of Object.entries(categoryNameMapping)) {
  reverseCategoryNameMapping[value] = key;
}

type KnownFiles = {
  [K in 'tech-tools' | 'finance' | 'product-management' | 'open-source' | 'personal-blog' | 'insurance' | 'reading' | 'family-life']: string[];
}

const knownFiles: KnownFiles = {
  'tech-tools': [
    'content/posts/tech-tools/2025-01-24-notion+cursor.md',
    'content/posts/tech-tools/2025-02-06-notion+pushplus公众号任务提醒.md',
    'content/posts/tech-tools/2025-04-07-Sublime-Text使用指南.md',
    'content/posts/tech-tools/2024-03-18-VS-Code中使用Draw.io完全指南.md'
  ],
  'finance': [
    'content/posts/finance/2025-04-07-投资前必知必会.md',
    'content/posts/finance/2025-04-07-投资基金的常见费用.md',
    'content/posts/finance/2025-04-07-港币购买美债学习.md'
  ],
  'product-management': [
    'content/posts/product-management/2024-10-28-trading-product-manager.md',
    'content/posts/product-management/2024-10-30-product-management-document.md',
    'content/posts/product-management/2024-12-30-alipay-health-module-experience.md'
  ],
  'open-source': [
    'content/posts/open-source/2024-03-18-钉钉监控：企业级应用实践.md',
    'content/posts/open-source/2025-04-03-dingtalk-message-monitor.md'
  ],
  'personal-blog': [
    'content/posts/personal-blog/2024-03-20-个人博客项目需求说明书.md'
  ],
  'insurance': [
    'content/posts/insurance/2024-03-18-农业保险研究报告.md',
    'content/posts/insurance/2025-04-03-融资信保.md',
    'content/posts/insurance/2025-04-07-「再保险」平台.md'
  ],
  'reading': [
    'content/posts/reading/2024-10-31-《供给侧改革背景下中国多层次农业保险产品结构研究》读书笔记.md',
    'content/posts/reading/2024-11-01-《"新基建"时代农业保险数智化转型》读书笔记.md'
  ],
  'family-life': [
    'content/posts/family-life/2024-10-30-家庭教育实践.md'
  ]
};

/**
 * 获取仓库目录树
 */
async function getRepositoryTree(): Promise<GithubTreeResponse | null> {
  try {
    // 1. 检查内存缓存
    const now = Date.now();
    if (memoryCache.treeData && (now - memoryCache.treeLastFetched < MEMORY_CACHE_TTL)) {
      console.log("[GitHub API] 使用内存缓存的仓库树...");
      return memoryCache.treeData;
    }
    
    // 2. 检查文件系统缓存
    const cachedTree = await getCachedTreeData();
    if (cachedTree) {
      console.log("[GitHub API] 使用文件系统缓存的仓库树...");
      // 更新内存缓存
      memoryCache.treeData = cachedTree.data;
      memoryCache.treeLastFetched = cachedTree.timestamp;
      return cachedTree.data;
    }

    console.log("[GitHub API] 获取仓库目录树...");
    console.log(`[GitHub API] 使用仓库: ${owner}/${repo}`);
    
    // 确保token存在
    if (!token) {
      console.error('[GitHub API] 获取仓库目录树失败: 缺少GitHub Token');
      return null;
    }
    
    const response = await fetch(`${apiBaseUrl}/git/trees/main?recursive=1`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
        'User-Agent': 'Dada Blog'
      }
    });
    
    if (!response.ok) {
      let errorInfo = '';
      try {
        const errorText = await response.text();
        errorInfo = errorText;
      } catch (e) {
        errorInfo = 'Unable to get error text';
      }
      
      console.error(`[GitHub API] 获取仓库目录树失败: ${response.status} ${response.statusText}`);
      console.error(`[GitHub API] 错误详情: ${errorInfo}`);
      
      if (response.status === 401) {
        console.error('[GitHub API] Token 认证失败，请确保:');
        console.error('1. Token 格式正确且未过期');
        console.error('2. Token 具有 repo 权限');
        console.error('3. Token 已正确配置在 .env.local 文件中');
        console.error(`4. 当前使用的 Token: ${token.substring(0, 5)}...${token.substring(token.length - 5)}`);
      }
      return null;
    }
    
    const data = await response.json();
    
    // 更新内存缓存
    memoryCache.treeData = data;
    memoryCache.treeLastFetched = now;
    
    // 更新文件系统缓存
    await setCachedTreeData(data);
    
    return data;
  } catch (error) {
    console.error('[GitHub API] 获取仓库目录树失败:', error);
    return null;
  }
}

/**
 * 递归扫描目录获取Markdown文件
 */
async function scanDirectory(): Promise<string[]> {
  try {
    console.log(`[GitHub API] 开始扫描目录: ${basePath}`);
    
    // 确保token存在
    if (!token) {
      console.error('[GitHub API] 扫描目录失败: 缺少GitHub Token');
      return [];
    }
    
    // 首先获取posts目录下的所有分类文件夹
    const contentsUrl = `${apiBaseUrl}/contents/${basePath}`;
    console.log(`[GitHub API] 请求目录: ${contentsUrl}`);
    
    const response = await fetch(contentsUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dada Blog'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[GitHub API] 获取目录失败: HTTP ${response.status}`);
      console.error(`[GitHub API] 错误响应: ${errorBody.substring(0, 200)}${errorBody.length > 200 ? '...' : ''}`);
      return [];
    }

    const contents = await response.json();
    
    // 确保是数组
    if (!Array.isArray(contents)) {
      console.error(`[GitHub API] 目录内容不是数组: ${typeof contents}`);
      return [];
    }
    
    const categories = contents
      .filter(item => item.type === 'dir')
      .map(item => item.name);
    
    console.log(`[GitHub API] 找到 ${categories.length} 个分类目录: ${categories.join(', ')}`);
    
    // 然后获取每个分类目录下的所有markdown文件
    const markdownFiles: string[] = [];
    
    for (const category of categories) {
      const categoryUrl = `${apiBaseUrl}/contents/${basePath}/${category}`;
      console.log(`[GitHub API] 扫描分类: ${category}, URL: ${categoryUrl}`);
      
      try {
        const categoryResponse = await fetch(categoryUrl, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Dada Blog'
          }
        });
        
        if (!categoryResponse.ok) {
          console.error(`[GitHub API] 获取分类 ${category} 失败: HTTP ${categoryResponse.status}`);
          continue;
        }
        
        const categoryContents = await categoryResponse.json();
        
        if (!Array.isArray(categoryContents)) {
          console.error(`[GitHub API] 分类 ${category} 内容不是数组`);
          continue;
        }
        
        const files = categoryContents
          .filter(item => item.type === 'file' && item.name.endsWith('.md'))
          .map(item => `${basePath}/${category}/${item.name}`);
        
        console.log(`[GitHub API] 在分类 ${category} 中找到 ${files.length} 个Markdown文件`);
        markdownFiles.push(...files);
      } catch (error) {
        console.error(`[GitHub API] 扫描分类 ${category} 失败:`, error);
      }
    }
    
    console.log(`[GitHub API] 总共找到 ${markdownFiles.length} 个Markdown文件`);
    return markdownFiles;
  } catch (error) {
    console.error('[GitHub API] 扫描目录失败:', error);
    return [];
  }
}

/**
 * 获取博客文章，优先使用本地文件系统而不是远程API
 */
export async function getPosts(): Promise<Post[]> {
  // 导入缓存优化器
  const { getCachedData, preloadContents } = await import('./api-cache-optimizer');
  
  // 调试日志：开始获取文章
  console.log("[GitHub API] 开始获取文章列表...");
  
  try {
    // 1. 首先尝试从内存缓存获取
    const now = Date.now();
    if (memoryCache.posts && (now - memoryCache.lastFetched < MEMORY_CACHE_TTL)) {
      console.log(`[GitHub API] 使用内存缓存的文章列表 (${memoryCache.posts.length} 篇文章)`);
      return memoryCache.posts;
    }
    
    // 2. 然后尝试从文件系统缓存获取
    const cachedPosts = await getCachedPosts();
    if (cachedPosts) {
      console.log(`[GitHub API] 使用文件系统缓存的文章列表 (${cachedPosts.data.length} 篇文章)`);
      // 更新内存缓存
      memoryCache.posts = cachedPosts.data;
      memoryCache.lastFetched = cachedPosts.timestamp;
      return cachedPosts.data;
    }
    
    // 3. 如果本地文件系统上存在content目录，优先使用本地内容
    if (fs.existsSync(contentBasePath)) {
      console.log(`[GitHub API] 本地内容目录存在，尝试从本地文件系统获取文章...`);
      try {
        // 扫描本地目录获取Markdown文件列表
        const localFiles = await scanLocalDirectory();
        if (localFiles && localFiles.length > 0) {
          console.log(`[GitHub API] 本地找到 ${localFiles.length} 个Markdown文件`);
          
          // 处理所有本地Markdown文件
          const posts: Post[] = [];
          
          for (const filePath of localFiles) {
            try {
              // 读取文件内容
              const fileContent = fs.readFileSync(filePath, 'utf8');
              
              // 从路径中推导分类
              const relativePath = path.relative(contentBasePath, filePath);
              const pathParts = relativePath.split(path.sep);
              let category = 'uncategorized';
              
              if (pathParts.length > 1 && pathParts[0] === 'posts' && pathParts[1]) {
                category = pathParts[1];
              }
              
              // 处理Markdown内容
              const post = processMarkdownContent(fileContent, relativePath, category);
              if (post) {
                posts.push(post);
              }
            } catch (fileError) {
              console.error(`[GitHub API] 处理本地文件 ${filePath} 失败:`, fileError);
            }
          }
          
          if (posts.length > 0) {
            // 保存到缓存
            console.log(`[GitHub API] 已处理 ${posts.length} 篇本地文章，更新缓存`);
            memoryCache.posts = posts;
            memoryCache.lastFetched = now;
            await setCachedPosts(posts);
            return posts;
          }
        }
      } catch (localError) {
        console.error('[GitHub API] 扫描本地内容目录失败:', localError);
      }
    }
    
    // 4. 尝试使用预定义的文件列表
    console.log('[GitHub API] 尝试从预定义文件列表获取文章...');
    try {
      const knownPosts = await getPostsFromKnownFiles();
      if (knownPosts && knownPosts.length > 0) {
        console.log(`[GitHub API] 从预定义列表获取了 ${knownPosts.length} 篇文章`);
        // 保存到缓存
        memoryCache.posts = knownPosts;
        memoryCache.lastFetched = now;
        await setCachedPosts(knownPosts);
        return knownPosts;
      }
    } catch (knownError) {
      console.error('[GitHub API] 从预定义文件列表获取文章失败:', knownError);
    }
    
    // 5. 最后尝试从GitHub API获取
    console.log('[GitHub API] 尝试通过GitHub API获取文章...');
    try {
      // 使用GitHub API获取仓库树
      const treeData = await getRepositoryTree();
      
      if (!treeData) {
        console.error('[GitHub API] 无法获取仓库树，返回空文章列表');
        return [];
      }
      
      // 筛选posts目录下的.md文件
      const markdownFiles = treeData.tree
        .filter(item => item.path.startsWith(basePath) && item.path.endsWith('.md'))
        .map(item => item.path);
      
      console.log(`[GitHub API] 找到 ${markdownFiles.length} 个Markdown文件`);
      
      // 预加载文章内容
      await preloadContents(markdownFiles, fetchRawContent);
      
      const posts: Post[] = [];
      
      // 并行处理，提高效率
      const results = await Promise.allSettled(
        markdownFiles.map(async (path) => {
          try {
            // 从路径中推导分类
            const pathParts = path.split('/');
            let category = 'uncategorized';
            
            if (pathParts.length > 2 && pathParts[0] === 'content' && pathParts[1] === 'posts') {
              category = pathParts[2];
            }
            
            // 获取文件内容
            const content = await fetchRawContent(path);
            
            if (!content) {
              console.error(`[GitHub API] 无法获取文件内容: ${path}`);
              return null;
            }
            
            // 处理Markdown内容
            return processMarkdownContent(content, path, category);
          } catch (error) {
            console.error(`[GitHub API] 处理文件失败 ${path}:`, error);
            return null;
          }
        })
      );
      
      // 过滤并添加有效的文章
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          posts.push(result.value);
        }
      });
      
      // 保存到缓存
      console.log(`[GitHub API] 成功处理 ${posts.length} 篇GitHub文章，更新缓存`);
      memoryCache.posts = posts;
      memoryCache.lastFetched = now;
      await setCachedPosts(posts);
      return posts;
    } catch (apiError) {
      console.error('[GitHub API] 通过API获取文章失败:', apiError);
      return [];
    }
  } catch (error) {
    console.error('[GitHub API] getPosts 发生未处理的错误:', error);
    return [];
  }
}

/**
 * 扫描本地文件系统内容目录中的Markdown文件
 */
async function scanLocalDirectory(): Promise<string[]> {
  console.log(`[GitHub API] 扫描本地内容目录: ${contentBasePath}`);
  
  // 递归查找所有.md文件
  const findMarkdownFiles = (dir: string): string[] => {
    let results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // 如果是目录，递归查找
        const subResults = findMarkdownFiles(fullPath);
        results = [...results, ...subResults];
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // 如果是Markdown文件，添加到结果中
        results.push(fullPath);
      }
    }
    
    return results;
  };
  
  return findMarkdownFiles(contentBasePath);
}

/**
 * 直接从文件系统获取文件内容
 */
async function fetchRawContent(path: string, retries = 2, backoff = RETRY_DELAY): Promise<string | null> {
  try {
    // 1. 检查内存缓存
    const now = Date.now();
    const cached = contentMemoryCache.get(path);
    if (cached && (now - cached.timestamp < MEMORY_CACHE_TTL)) {
      return cached.content;
    }
    
    // 2. 检查文件系统缓存
    const cachedContent = await getCachedContent(path);
    if (cachedContent) {
      // 更新内存缓存
      contentMemoryCache.set(path, {
        content: cachedContent.data,
        timestamp: cachedContent.timestamp
      });
      return cachedContent.data;
    }
    
    // 3. 直接从文件系统读取
    // 从path中提取实际文件路径
    const relativePath = path.replace(/^content\//, '');
    const filePath = `${contentBasePath}/${relativePath}`;
    
    if (!fs.existsSync(filePath)) {
      console.error(`[文件系统] 文件不存在: ${filePath}`);
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 更新内存缓存
    contentMemoryCache.set(path, {
      content,
      timestamp: Date.now()
    });
    
    // 更新文件系统缓存
    await setCachedContent(path, content, FS_CACHE_TTL);
    
    return content;
  } catch (error) {
    console.error(`[文件系统] 读取文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return null;
  }
}

/**
 * 处理Markdown内容
 */
function processMarkdownContent(content: string, path: string, category: string): Post | null {
  try {
    let processedContent = content;
    let data: any = {}, markdownContent = '';
    
    // 检查内容是否包含 front matter
    const hasFrontMatter = processedContent.trim().startsWith('---');
    
    // 使用gray-matter解析front matter
    try {
      // 如果内容存在但格式不正确，尝试修复常见问题
      if (hasFrontMatter) {
        // 修复特定格式问题
        processedContent = fixYamlFrontMatter(processedContent);
        
        // 确保front matter以三个破折号开始和结束
        if (!processedContent.startsWith('---\n')) {
          processedContent = '---\n' + processedContent.substring(3);
        }
        
        const frontMatterEnd = processedContent.indexOf('---', 4);
        if (frontMatterEnd === -1) {
          // 如果没有结束标记，添加一个
          const firstContentLine = processedContent.indexOf('\n\n', 4);
          if (firstContentLine !== -1) {
            processedContent = 
              processedContent.substring(0, firstContentLine) + 
              '\n---\n' + 
              processedContent.substring(firstContentLine);
          } else {
            // 如果找不到空行，在最后添加结束标记
            processedContent += '\n---\n';
          }
        }
      }

      // 尝试解析
      const parsed = matter(processedContent);
      data = parsed.data || {};
      markdownContent = parsed.content || '';
    } catch (error) {
      console.error(`[GitHub API] 解析YAML失败: ${path}`, error);
      
      // 提取YAML部分以便记录
      let yamlPart = '';
      if (hasFrontMatter) {
        const start = processedContent.indexOf('---') + 3;
        const end = processedContent.indexOf('---', start);
        if (end > start) {
          yamlPart = processedContent.substring(start, end);
        }
      }
      console.error(`[GitHub API] YAML内容: ${yamlPart}`);
      
      // 完全移除YAML部分并继续处理
      markdownContent = processedContent.replace(/^---[\s\S]*?---/, '').trim();
      
      // 从文件名中提取标题和日期
      const fileName = path.split('/').pop()?.replace(/\.md$/, "") || "";
      const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
      
      // 提取文件名中的标题部分，移除日期前缀
      const titleFromFileName = dateMatch 
        ? dateMatch[2].replace(/[_-]/g, ' ') 
        : fileName.replace(/[_-]/g, ' ');
      
      // 将首字母大写
      const formattedTitle = titleFromFileName.charAt(0).toUpperCase() + titleFromFileName.slice(1);
      
      data = {
        title: formattedTitle,
        date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
        categories: [category],
        tags: [],
        description: markdownContent.slice(0, 160).replace(/\n/g, ' ') + "...",
        published: true // 默认为已发布
      };
    }
    
    // 如果设置了不发布，则跳过 - 此处有问题，需要保留并明确设置published属性
    // 但不应该返回null，而是将published设为false
    const isPublished = data.published !== false; // 默认为已发布，只有明确设置为false才视为未发布
    
    // 计算阅读时间
    const readingTime = Math.ceil(markdownContent.split(/\s+/).length / 200) || 1;
    
    // 处理图片路径，如果有image字段是相对路径，转换为GitHub raw路径
    let coverImage = data.image || null;
    if (coverImage) {
      try {
        if (coverImage.startsWith('http')) {
          // 已经是完整URL，不做处理
        } else if (coverImage.startsWith('/')) {
          // 如果是绝对路径，转换为GitHub raw路径
          coverImage = `${rawBaseUrl}${coverImage}`;
        } else {
          // 如果是相对路径，转换为GitHub raw路径
          const imagePath = path.split('/').slice(0, -1).join('/');
          coverImage = `${rawBaseUrl}/${imagePath}/${coverImage}`;
        }
        console.log(`[GitHub API] 转换了封面图片路径: ${coverImage}`);
      } catch (error) {
        console.error(`[GitHub API] 处理封面图片路径失败: ${coverImage}`, error);
        coverImage = null;
      }
    }
    
    // 获取原始分类数据
    let categories = [];
    try {
      categories = Array.isArray(data.categories) 
        ? data.categories.filter(Boolean).map(String)
        : (typeof data.categories === 'string' 
            ? [String(data.categories)]
            : [category]);
    } catch (error) {
      categories = [category];
    }
    
    // 应用分类路径映射
    categories = categories.map((cat: string) => categoryMapping[cat] || cat);
    
    // 创建用于前端展示的中文分类名
    const displayCategories = categories.map((cat: string) => categoryNameMapping[cat] || cat);
    
    // 确保tags是数组
    let tags = [];
    try {
      tags = Array.isArray(data.tags) 
        ? data.tags.filter(Boolean).map(String)
        : (typeof data.tags === 'string' 
            ? [String(data.tags)]
            : []);
    } catch (error) {
      tags = [];
    }
    
    // 移除tags和categories中的"true"字符串（通常是格式错误造成的）
    categories = categories.filter((cat: any) => cat !== "true" && Boolean(cat));
    tags = tags.filter((tag: any) => tag !== "true" && Boolean(tag));
    
    // 如果categories为空，使用默认分类
    if (categories.length === 0) {
      categories = [category];
    }
    
    // 从文件名生成slug
    const fileName = path.split('/').pop()?.replace(/\.md$/, "") || "";
    let slug = data.slug;
    
    // 如果没有显式设置slug，则尝试从其他信息生成
    if (!slug || slug.trim() === '') {
      // 首先，尝试从标题生成
      if (data.title) {
        slug = enhancedSlugify(data.title, { maxLength: 80 });
      } else {
        // 如果没有标题，尝试从文件名生成
        // 检查是否是日期格式开头的文件名
        const dateRegex = /^(\d{4}-\d{2}-\d{2})-(.+)$/;
        const dateMatch = fileName.match(dateRegex);
        
        if (dateMatch && dateMatch[2]) {
          // 如果有日期前缀，只使用日期后面的部分生成slug
          slug = enhancedSlugify(dateMatch[2], { maxLength: 80 });
        } else {
          // 否则使用完整文件名
          slug = enhancedSlugify(fileName, { maxLength: 80 });
        }
      }
      
      console.log(`[GitHub API] 从标题或文件名生成slug: ${slug} 用于文件: ${path}`);
    }
    
    // 确保slug不为空
    if (!slug || slug.trim() === '') {
      slug = 'untitled-post';
      console.log(`[GitHub API] 使用默认slug: ${slug} 用于文件: ${path}`);
    }
    
    // 提取标题，优先使用front matter中的title
    const title = data.title || fileName.replace(/-/g, ' ');
    
    // 提取日期，优先使用front matter中的date
    let date = data.date;
    if (!date) {
      const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
      date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
    }
    
    // 确保日期格式正确
    try {
      new Date(date).toISOString();
    } catch (e) {
      date = new Date().toISOString().split('T')[0];
    }
    
    console.log(`处理文章: ${fileName}, slug: ${slug}, 发布状态: ${isPublished}`);
    
    return {
      slug,
      title,
      date,
      updated: data.updateDate || date,
      content: markdownContent,
      excerpt: data.description || markdownContent.slice(0, 160).replace(/\n/g, ' ') + "...",
      categories,
      displayCategories,
      tags,
      published: isPublished, // 正确设置发布状态
      featured: !!data.featured,
      coverImage,
      readingTime,
      metadata: {
        wordCount: markdownContent.split(/\s+/).length,
        readingTime,
        originalFile: path,
      },
    };
  } catch (error) {
    console.error(`处理Markdown内容失败 ${path}:`, error);
    return null;
  }
}

// 添加一个新函数用于修复YAML前言
function fixYamlFrontMatter(content: string): string {
  // 找出前置内容部分 (在两个 --- 之间)
  const matches = content.match(/^---\s*\n([\s\S]*?)\n---/);
  
  if (!matches || !matches[1]) {
    return content; // 无法找到前置内容，返回原样
  }
  
  const frontMatter = matches[1];
  const rest = content.slice(matches[0].length);
  
  // 修复categories和tags的问题
  let fixed = frontMatter;
  
  // 修复 categories 格式问题: categories: "- "value"" -> categories:\n  - "value"
  fixed = fixed.replace(/categories:\s*"(.+?)"/g, (match, p1) => {
    // 检查是否已经是数组格式
    if (p1.startsWith('-')) {
      // 将引号中的列表转换为实际的YAML列表
      return 'categories:\n  ' + p1.replace(/- "([^"]+)"/g, '- "$1"')
                                    .replace(/^-\s+"([^"]+)"$/, '- "$1"');
    }
    // 单个值转换为列表
    return `categories:\n  - "${p1.replace(/"/g, '')}"`;
  });
  
  // 同样修复 tags 格式问题
  fixed = fixed.replace(/tags:\s*"(.+?)"/g, (match, p1) => {
    if (p1.startsWith('-')) {
      return 'tags:\n  ' + p1.replace(/- "([^"]+)"/g, '- "$1"')
                              .replace(/^-\s+"([^"]+)"$/, '- "$1"');
    }
    return `tags:\n  - "${p1.replace(/"/g, '')}"`;
  });
  
  // 清理多余的引号和格式
  fixed = fixed
    // 修复字段引号问题
    .replace(/(\w+):\s*"([^"]*?)"/g, '$1: "$2"')
    // 修复连续的换行
    .replace(/\n{3,}/g, '\n\n')
    // 修复没有引号的值
    .replace(/(\w+):\s+([^"\n{][^\n]*?)$/gm, (match, key, value) => {
      // 跳过已经有引号、数组或对象的值
      if (value.trim().startsWith('"') || 
          value.trim().startsWith('[') || 
          value.trim().startsWith('{')) {
        return match;
      }
      return `${key}: "${value.trim()}"`;
    });
  
  return `---\n${fixed}\n---${rest}`;
}

/**
 * 获取所有文章
 * 这是getPosts的别名，为了保持API一致性
 */
export const getAllPosts = getPosts;

/**
 * 获取内容（兼容旧API）
 */
export async function getContents(path: string = ""): Promise<GitHubFileContent[]> {
  console.log(`[GitHub API 兼容] getContents被调用，但已被简化实现替换`);
  return [];
}

/**
 * 获取文件内容（兼容旧API）
 */
export async function getFileContent(path: string): Promise<string | null> {
  return fetchRawContent(path);
}

/**
 * 通过slug获取特定文章
 */
export async function getPostBySlug(slug: string) {
  try {
    console.log(`[getPostBySlug] 尝试获取文章，slug: ${slug}`);
    const posts = await getAllPosts();
    console.log(`[getPostBySlug] 获取到 ${posts.length} 篇文章`);
    
    // 调试所有文章的slug
    console.log(`[getPostBySlug] 所有文章的slug: ${posts.map(p => p.slug).join(', ')}`);
    
    // 首先尝试精确匹配
    let post = posts.find(post => post.slug === slug);
    
    // 如果找不到，尝试不区分大小写的匹配
    if (!post && slug) {
      post = posts.find(post => 
        post.slug.toLowerCase() === slug.toLowerCase()
      );
      
      // 移除模糊匹配逻辑，避免错误匹配到不相关的文章
    }
    
    console.log(`[getPostBySlug] 查找结果: ${post ? '找到文章: ' + post.title : '未找到文章'}`);
    
    return post || null;
  } catch (error) {
    console.error('获取特定文章失败:', error);
    return null;
  }
}

/**
 * 基于手动文件列表获取文章（备份方法）
 */
export async function getPostsFromKnownFiles(): Promise<Post[]> {
  try {
    console.log("[GitHub API] 开始获取所有文章(手动列表)...");
    const posts: Post[] = [];
    
    // 遍历已知分类
    for (const category of knownCategories) {
      console.log(`[GitHub API] 处理分类: ${category}`);
      
      // 获取该分类的已知文件
      const categoryFiles = knownFiles[category as keyof KnownFiles] || [];
      
      // 如果有已知文件，尝试获取它们
      if (categoryFiles.length > 0) {
        for (const filePath of categoryFiles) {
          try {
            console.log(`[GitHub API] 尝试获取文件: ${filePath}`);
            
            const fileContent = await fetchRawContent(filePath);
            if (fileContent) {
              const post = processMarkdownContent(fileContent, filePath, category);
              if (post) posts.push(post);
            }
          } catch (error) {
            console.error(`[GitHub API] 获取文件失败:`, error);
          }
        }
      } else {
        // 如果没有已知文件，尝试扫描目录
        try {
          console.log(`[GitHub API] 尝试扫描目录: ${basePath}/${category}`);
          const contents = await getContents(`${basePath}/${category}`);
          
          for (const item of contents) {
            if (item.type === 'file' && item.name.endsWith('.md')) {
              const filePath = item.path;
              console.log(`[GitHub API] 发现文件: ${filePath}`);
              
              const fileContent = await fetchRawContent(filePath);
              if (fileContent) {
                const post = processMarkdownContent(fileContent, filePath, category);
                if (post) posts.push(post);
              }
            }
          }
        } catch (error) {
          console.error(`[GitHub API] 处理分类 ${category} 时出错:`, error);
        }
      }
    }
    
    console.log(`[GitHub API] 总共获取到 ${posts.length} 篇文章(手动列表)`);
    
    // 按日期排序，最新的文章排在前面
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('[GitHub API] 获取文章列表失败:', error);
    return [];
  }
}

// 清除缓存
export function clearContentCache() {
  console.log('[GitHub API] 开始清除所有缓存...');
  
  // 清除内存缓存
  memoryCache.posts = null;
  memoryCache.lastFetched = 0;
  memoryCache.treeData = null;
  memoryCache.treeLastFetched = 0;
  contentMemoryCache.clear();
  
  console.log('[GitHub API] 内存缓存已清除');
  
  // 清除文件系统缓存
  clearAllGithubCache().then(success => {
    if (success) {
      console.log('[GitHub API] 文件系统缓存清除成功');
    } else {
      console.error('[GitHub API] 文件系统缓存清除失败');
    }
  }).catch(error => {
    console.error('[GitHub API] 文件系统缓存清除出错:', error);
  });
}

// 完整重置 - 清除所有缓存并强制重新获取数据
export async function forceRefreshAllData(): Promise<boolean> {
  try {
    console.log('[GitHub API] 开始强制刷新所有数据...');
    
    // 1. 清除所有缓存
    memoryCache.posts = null;
    memoryCache.lastFetched = 0;
    memoryCache.treeData = null;
    memoryCache.treeLastFetched = 0;
    contentMemoryCache.clear();
    
    // 2. 清除文件系统缓存
    await clearAllGithubCache();
    
    // 3. 重新获取仓库树结构
    console.log('[GitHub API] 强制重新获取仓库树数据...');
    const treeData = await getRepositoryTree();
    if (!treeData) {
      console.error('[GitHub API] 获取仓库树失败');
      return false;
    }
    
    // 4. 预加载文章列表
    console.log('[GitHub API] 强制重新获取文章列表...');
    const posts = await getPosts();
    console.log(`[GitHub API] 成功获取 ${posts.length} 篇文章`);
    
    console.log('[GitHub API] 数据强制刷新完成');
    return true;
  } catch (error) {
    console.error('[GitHub API] 强制刷新数据失败:', error);
    return false;
  }
}

/**
 * 更新文章
 */
export async function updatePost(post: Post): Promise<void> {
  try {
    // 验证数据
    if (!post.title || !post.content) {
      throw new Error('文章标题和内容不能为空');
    }
    
    if (!post.categories || post.categories.length === 0) {
      throw new Error('文章必须至少有一个分类');
    }

    // 确定文件路径，优先使用metadata中的原始路径
    let filePath;
    if (post.metadata?.originalFile) {
      filePath = post.metadata.originalFile;
      console.log(`[GitHub API] 使用原始文件路径更新: ${filePath}`);
    } else {
      // 构建文件路径，使用日期作为文件名前缀
      const datePrefix = post.date.split('T')[0];
      filePath = `${basePath}/${post.categories[0]}/${datePrefix}-${post.slug}.md`;
      console.log(`[GitHub API] 构建文件路径更新: ${filePath}`);
    }

    // 构建YAML前置元数据
    const content = `---
title: "${post.title}"
${post.slug ? `slug: "${post.slug}"` : ''}
date: "${post.date}"
${post.updated ? `updated: "${post.updated}"` : ''}
categories: 
${post.categories.map(cat => `  - "${cat}"`).join('\n')}
tags:
${post.tags.map(tag => `  - "${tag}"`).join('\n')}
${post.description ? `description: "${post.description}"` : ''}
${post.coverImage ? `image: "${post.coverImage}"` : ''}
${post.published !== undefined ? `published: ${post.published}` : ''}
---

${post.content}`;

    // 获取文件的 SHA
    const fileInfoResponse = await fetch(`${apiBaseUrl}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dada Blog'
      }
    });

    if (!fileInfoResponse.ok) {
      const errorText = await fileInfoResponse.text();
      console.error(`[GitHub API] 获取文件信息失败: ${fileInfoResponse.status} ${errorText}`);
      console.error(`[GitHub API] 尝试访问的文件路径: ${filePath}`);
      throw new Error(`获取文件信息失败: ${fileInfoResponse.status} ${errorText}`);
    }

    const fileInfo = await fileInfoResponse.json();

    // 更新文件
    const updateResponse = await fetch(`${apiBaseUrl}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dada Blog',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update post: ${post.title}`,
        content: Buffer.from(content).toString('base64'),
        sha: fileInfo.sha
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`更新文件失败: ${updateResponse.status} ${errorText}`);
    }
    
    // 使用选择性缓存清除
    await clearPostCache(post.slug);
    
    // 仅清除文章列表缓存，不影响其他内容
    await clearCacheItem('all-posts', 'github-posts');
    
    console.log(`[GitHub API] 成功更新文章: ${post.title}`);
  } catch (error: any) {
    console.error('更新文章失败:', error.message);
    throw error;
  }
}

export async function deletePost(post: Post): Promise<void> {
  try {
    if (!post.categories || post.categories.length === 0) {
      throw new Error('文章必须至少有一个分类');
    }

    // 确定文件路径，优先使用metadata中的原始路径
    let filePath;
    if (post.metadata?.originalFile) {
      filePath = post.metadata.originalFile;
      console.log(`[GitHub API] 使用原始文件路径删除: ${filePath}`);
    } else {
      // 构建文件路径，使用日期作为文件名前缀
      const datePrefix = post.date.split('T')[0];
      filePath = `${basePath}/${post.categories[0]}/${datePrefix}-${post.slug}.md`;
      console.log(`[GitHub API] 构建文件路径删除: ${filePath}`);
    }
    
    // 获取文件的 SHA
    const fileInfoResponse = await fetch(`${apiBaseUrl}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dada Blog'
      }
    });

    if (!fileInfoResponse.ok) {
      const errorText = await fileInfoResponse.text();
      console.error(`[GitHub API] 获取文件信息失败: ${fileInfoResponse.status} ${errorText}`);
      console.error(`[GitHub API] 尝试访问的文件路径: ${filePath}`);
      throw new Error(`获取文件信息失败: ${fileInfoResponse.status} ${errorText}`);
    }

    const fileInfo = await fileInfoResponse.json();
    
    // 删除文件
    const deleteResponse = await fetch(`${apiBaseUrl}/contents/${filePath}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Dada Blog'
      },
      body: JSON.stringify({
        message: `删除文章: ${post.title}`,
        sha: fileInfo.sha
      })
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`删除文件失败: ${deleteResponse.status} ${errorText}`);
    }

    // 使用选择性缓存清除
    await clearPostCache(post.slug);
    
    // 仅清除文章列表缓存，不影响其他内容
    await clearCacheItem('all-posts', 'github-posts');
    
    console.log(`[GitHub API] 成功删除文章: ${post.title}`);
  } catch (error) {
    console.error('删除文章失败:', error);
    throw error;
  }
}

export async function createPost(post: Post, retries = 3): Promise<any> {
  try {
    // 如果没有提供slug，从标题生成
    if (!post.slug) {
      post.slug = enhancedSlugify(post.title, { maxLength: 80 });
      console.log(`[GitHub API] 从标题生成slug: ${post.slug}`);
    }
    
    // 构建YAML前置元数据，确保正确的格式
    const content = `---
title: "${post.title}"
date: "${post.date}"
categories: 
${post.categories.map(cat => `  - "${cat}"`).join('\n')}
tags:
${post.tags.map(tag => `  - "${tag}"`).join('\n')}
${post.description ? `description: "${post.description}"` : ''}
---

${post.content}`;

    // 构建文件路径 - 移除时间戳后缀，确保文件名与slug匹配
    const category = post.categories[0] || 'uncategorized';
    const dateStr = post.date.split('T')[0];
    let filePath = `${basePath}/${category}/${dateStr}-${post.slug}.md`;

    console.log(`[GitHub API] 尝试创建文章: ${filePath}`);
    
    // 检查分类目录是否存在，如果不存在则先创建
    try {
      console.log(`[GitHub API] 检查分类目录是否存在: ${basePath}/${category}`);
      const dirCheckResponse = await fetch(`${apiBaseUrl}/contents/${basePath}/${category}?ref=main`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Dada Blog'
        }
      });
      
      // 如果目录不存在，创建目录
      if (dirCheckResponse.status === 404) {
        console.log(`[GitHub API] 分类目录 "${category}" 不存在，尝试创建...`);
        
        // 创建空的README.md文件来创建目录
        const readmeContent = `# ${category}\n\n此目录包含 ${category} 分类的文章`;
        const readmeRequestBody = {
          message: `Create category directory: ${category}`,
          content: Buffer.from(readmeContent).toString('base64')
        };
        
        const createDirResponse = await fetch(`${apiBaseUrl}/contents/${basePath}/${category}/README.md`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Dada Blog'
          },
          body: JSON.stringify(readmeRequestBody)
        });
        
        if (!createDirResponse.ok) {
          const errorText = await createDirResponse.text();
          console.error(`[GitHub API] 无法创建分类目录: ${category}, 错误: ${errorText}`);
          throw new Error(`创建分类目录失败: ${errorText}`);
        }
        
        console.log(`[GitHub API] 成功创建分类目录: ${category}`);
      }
    } catch (dirError) {
      console.error(`[GitHub API] 检查或创建分类目录时出错:`, dirError);
      // 继续尝试创建文件，也许有些错误是临时的
    }
    
    // 检查文件是否已存在，如果存在则添加后缀
    try {
      console.log(`[GitHub API] 检查文件是否已存在: ${filePath}`);
      const fileCheckResponse = await fetch(`${apiBaseUrl}/contents/${filePath}?ref=main`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Dada Blog'
        }
      });
      
      // 如果文件已存在，添加后缀
      if (fileCheckResponse.status === 200) {
        console.log(`[GitHub API] 文件已存在，添加后缀`);
        let suffix = 1;
        let newFilePath;
        let fileExists = true;
        
        // 尝试添加递增数字后缀，直到找到可用文件名
        while (fileExists && suffix < 100) { // 最多尝试99次
          newFilePath = `${basePath}/${category}/${dateStr}-${post.slug}-${suffix}.md`;
          console.log(`[GitHub API] 尝试使用新文件路径: ${newFilePath}`);
          
          const newFileCheckResponse = await fetch(`${apiBaseUrl}/contents/${newFilePath}?ref=main`, {
            method: 'GET',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Dada Blog'
            }
          });
          
          if (newFileCheckResponse.status === 404) {
            fileExists = false;
            filePath = newFilePath;
            // 更新post.slug以匹配新的文件名
            post.slug = `${post.slug}-${suffix}`;
            console.log(`[GitHub API] 已更新slug为: ${post.slug}`);
          } else {
            suffix++;
          }
        }
        
        if (fileExists) {
          throw new Error('无法创建文章：无法找到可用的文件名');
        }
      }
    } catch (error: any) {
      // 只有在明确文件已存在时才处理错误，其他错误（如网络问题）可以忽略，让后续创建操作处理
      if (error.message && error.message.includes('无法创建文章')) {
        throw error;
      }
      console.log(`[GitHub API] 检查文件是否存在时发生错误，将继续尝试创建: ${error.message}`);
    }
    
    // 准备请求体
    const requestBody: any = {
      message: `Create post: ${post.title}`,
      content: Buffer.from(content).toString('base64'),
    };
    
    const response = await fetch(`${apiBaseUrl}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dada Blog'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // 如果是409冲突错误，并且还有重试次数，则重试
      if (response.status === 409 && retries > 0) {
        console.log(`[GitHub API] 遇到409冲突，等待重试...剩余重试次数: ${retries}`);
        // 等待短暂时间后重试
        await new Promise(resolve => setTimeout(resolve, 2000));
        return createPost(post, retries - 1);
      }
      
      throw new Error(`创建文章失败: ${response.status} ${errorText}`);
    }

    // 获取响应内容
    const responseData = await response.json();
    
    // 清除缓存
    clearContentCache();
    console.log(`[GitHub API] 成功创建文章: ${post.title}`);
    
    // 返回创建的文件信息（包括路径、文件名等）
    return {
      slug: post.slug,
      path: filePath,
      ...responseData
    };
  } catch (error: any) {
    console.error(`[GitHub API] 创建文章失败:`, error);
    throw error;
  }
}

// 中英文分类名映射
export const categoryMappings: Record<string, string> = {
  "product-management": "产品管理",
  "tech-tools": "技术工具",
  "family-life": "家庭生活",
  "insurance": "保险",
  "finance": "金融",
  "open-source": "开源",
  "personal-blog": "个人博客",
  "reading": "读书笔记"
};

// 英文到中文的转换函数
export function getDisplayCategoryName(englishName: string): string {
  return categoryMappings[englishName] || englishName;
}

// 中文到英文的转换函数
export function getEnglishCategoryName(chineseName: string): string {
  const entry = Object.entries(categoryMappings).find(([_, value]) => value === chineseName);
  return entry ? entry[0] : chineseName;
}

// 获取所有中英文分类映射
export function getAllCategoryMappings(): Array<{name: string, slug: string}> {
  return Object.entries(categoryMappings).map(([slug, name]) => ({
    slug,
    name
  }));
}