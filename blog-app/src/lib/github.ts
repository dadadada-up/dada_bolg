import { Octokit } from "octokit";
import matter from "gray-matter";
import { Post } from "@/types/post";
import { slugify } from "@/lib/utils";

const owner = process.env.GITHUB_REPO_OWNER || "dadadada-up";
const repo = process.env.GITHUB_REPO_NAME || "dada_blog";
// 更新基础路径指向content/posts目录
const basePath = "content/posts";

// 原始内容的基础URL
const rawBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main`;

// GitHub API基础URL
const apiBaseUrl = `https://api.github.com/repos/${owner}/${repo}`;

// 缓存系统
const CACHE_TTL = 1000 * 60 * 10; // 10分钟缓存
const cache = {
  posts: null as Post[] | null,
  lastFetched: 0,
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
  'reading',
  'product-management',
  'open-source',
  'personal-blog',
  'finance',
  'insurance',
  'family-life'
];

/**
 * 获取仓库目录树
 */
async function getRepositoryTree(): Promise<GithubTreeResponse | null> {
  try {
    console.log("[GitHub API] 获取仓库目录树...");
    const response = await fetch(`${apiBaseUrl}/git/trees/main?recursive=1`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': process.env.GITHUB_TOKEN=your_token_here  ? `token ${process.env.GITHUB_TOKEN=your_token_here }` : '',
      }
    });
    
    if (!response.ok) {
      console.error(`[GitHub API] 获取仓库目录树失败: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
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
  const tree = await getRepositoryTree();
  if (!tree) return [];
  
  // 找出所有content/posts目录下的.md文件
  const markdownPaths = tree.tree
    .filter(item => 
      item.type === 'blob' && 
      item.path.startsWith(basePath) && 
      item.path.endsWith('.md')
    )
    .map(item => item.path);
  
  console.log(`[GitHub API] 找到 ${markdownPaths.length} 个Markdown文件`);
  return markdownPaths;
}

/**
 * 获取所有博客文章 - 使用自动扫描目录的方式
 */
export async function getPosts(): Promise<Post[]> {
  try {
    // 检查缓存
    const now = Date.now();
    if (cache.posts && (now - cache.lastFetched < CACHE_TTL)) {
      console.log("[GitHub API] 使用缓存的文章列表...");
      return cache.posts;
    }
    
    console.log("[GitHub API] 开始获取所有文章...");
    const posts: Post[] = [];
    
    // 自动扫描获取所有Markdown文件路径
    const markdownPaths = await scanDirectory();
    
    // 如果自动扫描失败或没有找到文件，降级使用手动列表
    if (!markdownPaths || markdownPaths.length === 0) {
      console.log("[GitHub API] 自动扫描未找到文件，降级使用手动文件列表...");
      return getPostsFromKnownFiles();
    }
    
    // 处理每个Markdown文件
    for (const filePath of markdownPaths) {
      try {
        console.log(`[GitHub API] 尝试获取文件: ${filePath}`);
        
        // 从路径中提取分类
        const pathParts = filePath.split('/');
        const category = pathParts.length >= 3 ? pathParts[2] : 'uncategorized';
        
        const fileContent = await fetchRawContent(filePath);
        if (fileContent) {
          const post = processMarkdownContent(fileContent, filePath, category);
          if (post) posts.push(post);
        }
      } catch (error) {
        console.error(`[GitHub API] 获取文件 ${filePath} 失败:`, error);
      }
    }
    
    console.log(`[GitHub API] 总共获取到 ${posts.length} 篇文章`);
    
    // 按日期排序，最新的文章排在前面
    const sortedPosts = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // 更新缓存
    cache.posts = sortedPosts;
    cache.lastFetched = now;
    
    return sortedPosts;
  } catch (error) {
    console.error('[GitHub API] 获取文章列表失败:', error);
    // 降级使用手动文件列表
    console.log("[GitHub API] 遇到错误，降级使用手动文件列表...");
    return getPostsFromKnownFiles();
  }
}

/**
 * 直接从raw.githubusercontent.com获取文件内容
 */
async function fetchRawContent(path: string): Promise<string | null> {
  try {
    const url = `${rawBaseUrl}/${path}`;
    console.log(`[GitHub API] 尝试获取内容: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[GitHub API] 获取内容失败: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    console.error(`[GitHub API] 获取内容失败:`, error);
    return null;
  }
}

/**
 * 处理Markdown内容
 */
function processMarkdownContent(content: string, path: string, category: string): Post | null {
  try {
    let processedContent = content;
    let data, markdownContent;
    
    // 使用gray-matter解析front matter
    try {
      const parsed = matter(processedContent);
      data = parsed.data;
      markdownContent = parsed.content;
    } catch (yamlError) {
      console.error(`[GitHub API] YAML解析错误(${path}):`, yamlError);
      // 尝试移除整个YAML部分，直接处理内容
      console.log(`[GitHub API] 尝试移除YAML部分并继续处理文件: ${path}`);
      const noYamlContent = processedContent.replace(/^---\n[\s\S]*?\n---\n/, '');
      markdownContent = noYamlContent;
      
      // 创建一个基本的data对象
      data = {};
    }
    
    // 如果设置了不发布，则跳过
    if (data.published === false) return null;
    
    // 计算阅读时间
    const readingTime = Math.ceil(markdownContent.split(/\s+/).length / 200);
    
    // 处理图片路径，如果有image字段是相对路径，转换为GitHub raw路径
    let coverImage = data.image || null;
    if (coverImage) {
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
    }
    
    // 确保categories是数组
    let categories = Array.isArray(data.categories) 
      ? data.categories 
      : (typeof data.categories === 'string' 
          ? [data.categories] 
          : [category]);
    
    // 确保tags是数组
    let tags = Array.isArray(data.tags) 
      ? data.tags 
      : (typeof data.tags === 'string' 
          ? [data.tags] 
          : []);
    
    // 移除tags和categories中的"true"字符串（通常是格式错误造成的）
    categories = categories.filter((cat: any) => cat !== "true");
    tags = tags.filter((tag: any) => tag !== "true");
    
    // 如果categories为空，使用默认分类
    if (categories.length === 0) {
      categories = [category];
    }
    
    // 从文件名生成slug
    const fileName = path.split('/').pop()?.replace(/\.md$/, "") || "";
    let slug = data.slug;
    
    // 如果没有显式设置slug，则从文件名生成
    if (!slug) {
      // 检查是否是日期格式开头的文件名
      const dateRegex = /^(\d{4}-\d{2}-\d{2})-(.+)$/;
      const dateMatch = fileName.match(dateRegex);
      
      if (dateMatch && dateMatch[2]) {
        // 如果有日期前缀，只使用日期后面的部分生成slug
        slug = slugify(dateMatch[2]);
      } else {
        // 否则使用完整文件名
        slug = slugify(fileName);
      }
    }
    
    // 提取标题，优先使用front matter中的title
    const title = data.title || fileName.replace(/-/g, ' ');
    
    // 提取日期，优先使用front matter中的date，否则从文件名中提取
    let date = data.date;
    if (!date) {
      const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
      date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
    }
    
    console.log(`处理文章: ${fileName}, slug: ${slug}`);
    
    return {
      slug,
      title,
      date,
      updated: data.updateDate || date,
      content: markdownContent,
      excerpt: data.description || markdownContent.slice(0, 160) + "...",
      categories,
      tags,
      published: true,
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
    const posts = await getAllPosts();
    return posts.find(post => post.slug === slug) || null;
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
    
    // 为每个分类定义一些已知的文章文件
    const knownFiles: Record<string, string[]> = {
      'tech-tools': [
        '2025-01-07-Cursor-rules.md',
        '2025-01-07-Sublime-Text.md',
        '2024-04-03-Cursor-介绍.md',
        '2025-02-05-deepseek本地化部署.md',
        '2025-02-10-cursor-full-usage.md',
        '2023-09-01-如何获取Notion数据库字段信息.md',
        '2025-02-14-AI编程-DeepSeek-R1-vs-Claude-3.5-Sonnet.md',
        '2025-01-01-tech-tools-document.md',
        '2025-02-16-tech-tools-document.md',
        '2025-02-17-AI帮我写SQL，十倍效率提升.md',
        '2025-02-27-废品回收调研.md',
        '2025-01-24-notion+cursor.md',
        '2025-02-06-notion+pushplus公众号任务提醒.md',
        '2025-04-07-Sublime-Text使用指南.md',
        '2024-03-18-VS-Code中使用Draw.io完全指南.md',
        '2025-01-01-Asset-Tracker.md',
        '2025-02-05-asset.md',
        '2025-04-07-语雀文档能力支持整理.md',
        '2025-02-06-macos-docker-installation-guide.md',
        '2025-02-07-GitHub-Desktop安装与汉化.md',
        '2025-04-03-VSCode绘图插件使用指南.md',
        '2025-02-07-GitHub仓库三种克隆方式.md'
      ],
      'finance': [
        '2025-02-09-hkd-us-bonds-study.md',
        '2025-04-07-港币购买美债学习.md',
        '2025-04-07-投资前必知必会.md',
        '2025-04-07-一文详解房地产投资.md',
        '2025-04-07-《投资第一课》学习笔记.md',
        '2025-04-07-投资基金的常见费用.md',
        '2024-10-29-房地产系列分析.md',
        '2025-03-27-unnamed-document.md',
        '2025-04-07-房地产系列.md'
      ],
      'product-management': [
        '2024-10-28-trading-product-manager.md',
        '2024-10-30-product-management-document.md',
        '2024-12-30-alipay-health-module-experience.md',
        '2025-01-15-product-management-document.md',
        '2025-02-06-brd-business-requirements-template.md',
        '2025-04-07-BRD.md',
        '2025-04-07-B端需求分析与挖掘.md',
        '2025-04-07-PM12条.md',
        '2025-04-07-PMF.md',
        '2025-04-07-PRD模版.md',
        '2025-04-07-黄金.md',
        '2025-04-07-需求分析.md',
        '2025-04-07-保全系统建设.md',
        '2025-04-07-保险产品分类.md',
        '2025-04-07-如何理解中台？.md',
        '2025-04-07-知识管理的认知.md',
        '2025-04-07-超级用户方法论.md',
        '2025-04-07-业务需求文档模板.md',
        '2025-04-07-产品生命周期理论.md',
        '2025-04-07-后台产品经理感悟.md'
      ],
      'reading': [
        '2024-10-31-《供给侧改革背景下中国多层次农业保险产品结构研究》读书笔记.md',
        '2024-11-01-《"新基建"时代农业保险数智化转型》读书笔记.md',
        '2025-04-07-《小狗钱钱》读后感.md',
        '2025-04-07-《精力管理》读后感.md',
        '2025-04-07-《认知觉醒》读后感.md',
        '2025-04-07-《大国经济学》读书感.md',
        '2025-04-07-《"新基建"时代农业保险数智化转型》读书笔记.md'
      ],
      'open-source': [
        '2024-03-18-dingtalk-monitor-guide.md',
        '2025-04-03-dingtalk-monitor.md'
      ],
      'personal-blog': [
        '2024-03-20-personal-blog-requirements.md'
      ],
      'insurance': [
        '2024-03-18-agriculture-insurance.md',
        '2025-04-03-financing-credit-insurance.md'
      ],
      'family-life': [
        '2025-04-03-requirements-document.md',
        '2025-04-07-家庭财产安全清单.md',
        '2025-04-07-国内景点清单.md',
        '2025-04-07-旅游清单.md'
      ]
    };
    
    // 遍历已知分类
    for (const category of knownCategories) {
      console.log(`[GitHub API] 处理分类: ${category}`);
      
      // 获取该分类的已知文件
      const categoryFiles = knownFiles[category] || [];
      
      // 如果有已知文件，尝试获取它们
      if (categoryFiles.length > 0) {
        for (const fileName of categoryFiles) {
          try {
            const filePath = `${basePath}/${category}/${fileName}`;
            console.log(`[GitHub API] 尝试获取文件: ${filePath}`);
            
            const fileContent = await fetchRawContent(filePath);
            if (fileContent) {
              const post = processMarkdownContent(fileContent, filePath, category);
              if (post) posts.push(post);
            }
          } catch (error) {
            console.error(`[GitHub API] 获取文件 ${fileName} 失败:`, error);
          }
        }
      } else {
        // 如果没有已知文件，尝试获取示例文件（向后兼容）
        try {
          const testFilePath = `${basePath}/${category}/example.md`;
          const fileContent = await fetchRawContent(testFilePath);
          
          if (fileContent) {
            const post = processMarkdownContent(fileContent, testFilePath, category);
            if (post) posts.push(post);
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