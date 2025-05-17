import simpleGit, { SimpleGit, RemoteWithRefs } from 'simple-git';
import path from 'path';
import fs from 'fs';
import { Post } from '@/types/post';
import { enhancedSlugify } from './utils';

// Git仓库配置
export interface GitConfig {
  localPath: string;        // 本地仓库路径
  remoteName: string;       // 远程仓库名称
  remoteUrl: string;        // 远程仓库URL
  defaultBranch: string;    // 默认分支
  author: {                 // 提交作者信息
    name: string;
    email: string;
  };
}

// Git操作状态
export interface GitStatus {
  isRepo: boolean;          // 是否是有效仓库
  currentBranch: string;    // 当前分支
  hasChanges: boolean;      // 是否有未提交更改
  lastSync: Date | null;    // 最后同步时间
  changedFiles: string[];   // 已更改文件列表
  errorMessage?: string;    // 错误信息
}

// 提交历史记录
export interface CommitInfo {
  hash: string;
  date: Date;
  message: string;
  author: string;
}

// 文件历史
export interface FileHistory {
  filePath: string;
  commits: CommitInfo[];
}

/**
 * Git 服务类 - 处理所有与 Git 相关的操作
 */
export class GitService {
  private git: SimpleGit;
  private config: GitConfig;
  private isInitialized: boolean = false;

  constructor(config: GitConfig) {
    this.config = config;
    // 确保路径存在
    if (!fs.existsSync(config.localPath)) {
      fs.mkdirSync(config.localPath, { recursive: true });
    }
    this.git = simpleGit(config.localPath);
  }

  /**
   * 获取内容目录路径
   */
  getContentPath(): string {
    return this.config.localPath;
  }

  /**
   * 初始化仓库
   */
  async initialize(): Promise<boolean> {
    try {
      console.log(`[Git Service] 正在初始化仓库: ${this.config.localPath}`);
      
      // 检查是否已是Git仓库
      const isRepo = await this.git.checkIsRepo();
      
      if (!isRepo) {
        console.log('[Git Service] 不是Git仓库，正在初始化新仓库');
        // 初始化新仓库
        await this.git.init();
        
        // 配置用户信息
        await this.git.addConfig('user.name', this.config.author.name, false, 'local');
        await this.git.addConfig('user.email', this.config.author.email, false, 'local');
        
        // 创建初始提交
        const readmePath = path.join(this.config.localPath, 'README.md');
        if (!fs.existsSync(readmePath)) {
          fs.writeFileSync(readmePath, `# 博客内容仓库\n\n此仓库由博客系统自动管理，用于存储博客内容。\n\n创建于: ${new Date().toISOString()}\n`, 'utf-8');
          await this.git.add('README.md');
          await this.git.commit('初始化内容仓库');
        }
        
        // 配置远程仓库
        if (this.config.remoteUrl) {
          console.log(`[Git Service] 添加远程仓库: ${this.config.remoteName} -> ${this.config.remoteUrl}`);
          try {
            await this.git.addRemote(this.config.remoteName, this.config.remoteUrl);
          } catch (error) {
            console.warn('[Git Service] 添加远程仓库失败，可能已存在:', error);
            // 如果远程已存在，更新URL
            await this.git.remote(['set-url', this.config.remoteName, this.config.remoteUrl]);
          }
        }
      } else {
        console.log('[Git Service] 已是Git仓库，检查配置');
        // 确保用户信息配置正确
        try {
          await this.git.addConfig('user.name', this.config.author.name, false, 'local');
          await this.git.addConfig('user.email', this.config.author.email, false, 'local');
        } catch (error) {
          console.warn('[Git Service] 更新用户信息失败:', error);
        }
        
        // 检查并更新远程仓库
        if (this.config.remoteUrl) {
          try {
            const remotes = await this.git.getRemotes(true);
            const existingRemote = remotes.find((r: RemoteWithRefs) => r.name === this.config.remoteName);
            
            if (!existingRemote) {
              await this.git.addRemote(this.config.remoteName, this.config.remoteUrl);
            } else if (existingRemote.refs.fetch !== this.config.remoteUrl) {
              await this.git.remote(['set-url', this.config.remoteName, this.config.remoteUrl]);
            }
          } catch (error) {
            console.warn('[Git Service] 检查远程仓库失败:', error);
          }
        }
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[Git Service] 初始化仓库失败:', error);
      return false;
    }
  }

  /**
   * 克隆远程仓库
   */
  async cloneRepository(): Promise<boolean> {
    try {
      if (!this.config.remoteUrl) {
        console.error('[Git Service] 未设置远程仓库URL');
        return false;
      }
      
      console.log(`[Git Service] 正在克隆仓库: ${this.config.remoteUrl} -> ${this.config.localPath}`);
      
      // 检查目录是否为空
      const files = fs.readdirSync(this.config.localPath);
      if (files.length > 0 && !files.every((f: string) => f.startsWith('.') || f === 'README.md')) {
        console.warn('[Git Service] 目标目录不为空，无法克隆');
        return false;
      }
      
      // 克隆仓库
      await this.git.clone(this.config.remoteUrl, this.config.localPath);
      
      // 配置用户信息
      await this.git.addConfig('user.name', this.config.author.name, false, 'local');
      await this.git.addConfig('user.email', this.config.author.email, false, 'local');
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[Git Service] 克隆仓库失败:', error);
      return false;
    }
  }

  /**
   * 获取仓库状态
   */
  async getStatus(): Promise<GitStatus> {
    try {
      const isRepo = await this.git.checkIsRepo();
      
      if (!isRepo) {
        return {
          isRepo: false,
          currentBranch: '',
          hasChanges: false,
          lastSync: null,
          changedFiles: []
        };
      }
      
      const status = await this.git.status();
      
      // 获取最后一次提交时间
      const log = await this.git.log({ maxCount: 1 });
      const lastCommitDate = log.latest ? new Date(log.latest.date) : null;
      
      const changedFiles = status.files.map((f: {path: string}) => f.path);
      
      return {
        isRepo: true,
        currentBranch: status.current || '',
        hasChanges: status.files.length > 0,
        lastSync: lastCommitDate,
        changedFiles
      };
    } catch (error) {
      console.error('[Git Service] 获取仓库状态失败:', error);
      return {
        isRepo: false,
        currentBranch: '',
        hasChanges: false,
        lastSync: null,
        changedFiles: [],
        errorMessage: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 添加文件到暂存区
   */
  async stageFiles(files: string[] = ['.']): Promise<boolean> {
    try {
      await this.git.add(files);
      return true;
    } catch (error) {
      console.error('[Git Service] 添加文件到暂存区失败:', error);
      return false;
    }
  }

  /**
   * 提交更改
   */
  async commitChanges(message: string): Promise<boolean> {
    try {
      // 检查是否有更改
      const status = await this.git.status();
      if (status.files.length === 0) {
        console.log('[Git Service] 没有更改需要提交');
        return true;
      }
      
      await this.git.commit(message);
      return true;
    } catch (error) {
      console.error('[Git Service] 提交更改失败:', error);
      return false;
    }
  }

  /**
   * 拉取远程更新
   */
  async pullChanges(): Promise<boolean> {
    try {
      if (!this.config.remoteUrl) {
        console.warn('[Git Service] 未设置远程仓库URL，跳过拉取');
        return true;
      }
      
      console.log(`[Git Service] 正在从 ${this.config.remoteName}/${this.config.defaultBranch} 拉取更新`);
      
      // 尝试拉取更新
      try {
        await this.git.pull(this.config.remoteName, this.config.defaultBranch);
        return true;
      } catch (error) {
        // 如果拉取失败，检查是否是由于有未提交的更改
        const status = await this.git.status();
        if (status.files.length > 0) {
          console.warn('[Git Service] 拉取失败，有未提交的更改:', status.files.map(f => f.path));
          // 尝试存储更改
          await this.git.stash(['save', '自动存储未提交的更改']);
          // 重新拉取
          await this.git.pull(this.config.remoteName, this.config.defaultBranch);
          // 恢复存储的更改
          await this.git.stash(['pop']);
          return true;
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('[Git Service] 拉取远程更新失败:', error);
      return false;
    }
  }

  /**
   * 推送更改到远程
   */
  async pushChanges(): Promise<boolean> {
    try {
      if (!this.config.remoteUrl) {
        console.warn('[Git Service] 未设置远程仓库URL，跳过推送');
        return true;
      }
      
      console.log(`[Git Service] 正在推送更改到 ${this.config.remoteName}/${this.config.defaultBranch}`);
      
      await this.git.push(this.config.remoteName, this.config.defaultBranch);
      return true;
    } catch (error) {
      console.error('[Git Service] 推送更改失败:', error);
      return false;
    }
  }

  /**
   * 获取文件历史
   */
  async getFileHistory(filePath: string): Promise<FileHistory> {
    try {
      const relativePath = path.relative(this.config.localPath, filePath);
      console.log(`[Git Service] 获取文件历史: ${relativePath}`);
      
      const log = await this.git.log({ file: relativePath });
      
      const commits = log.all.map((commit: {
        hash: string;
        date: string;
        message: string;
        author_name: string;
        author_email: string;
      }) => ({
        hash: commit.hash,
        date: new Date(commit.date),
        message: commit.message,
        author: `${commit.author_name} <${commit.author_email}>`
      }));
      
      return {
        filePath: relativePath,
        commits
      };
    } catch (error) {
      console.error(`[Git Service] 获取文件历史失败: ${filePath}`, error);
      return {
        filePath,
        commits: []
      };
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflicts(strategy: 'local' | 'remote'): Promise<boolean> {
    try {
      console.log(`[Git Service] 使用 ${strategy} 策略解决冲突`);
      
      // 获取有冲突的文件
      const status = await this.git.status();
      const conflictFiles = status.conflicted;
      
      if (conflictFiles.length === 0) {
        console.log('[Git Service] 没有冲突需要解决');
        return true;
      }
      
      for (const file of conflictFiles) {
        if (strategy === 'local') {
          await this.git.raw(['checkout', '--ours', file]);
        } else {
          await this.git.raw(['checkout', '--theirs', file]);
        }
        await this.git.add(file);
      }
      
      // 提交合并结果
      await this.git.commit(`解决合并冲突，使用 ${strategy} 更改`);
      return true;
    } catch (error) {
      console.error('[Git Service] 解决冲突失败:', error);
      return false;
    }
  }

  /**
   * 同步数据库内容到Git仓库
   */
  async syncFromDatabase(posts: Post[]): Promise<{success: boolean; processed: number; errors: number}> {
    try {
      console.log('[Git Service] 开始同步数据库内容到Git仓库');
      
      // 确保仓库已初始化
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      let processed = 0;
      let errors = 0;
      
      // 确保posts目录存在
      const postsDir = path.join(this.config.localPath, 'posts');
      if (!fs.existsSync(postsDir)) {
        fs.mkdirSync(postsDir, { recursive: true });
      }
      
      // 将数据库文章写入文件系统
      for (const post of posts) {
        try {
          // 确定分类目录
          const category = post.categories?.[0] || 'uncategorized';
          const categoryDir = path.join(postsDir, category);
          
          if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
          }
          
          // 构建文件名和路径
          const fileDate = post.date.split('T')[0];
          const fileName = `${fileDate}-${post.slug}.md`;
          const filePath = path.join(categoryDir, fileName);
          
          // 构建Markdown内容
          let content = '---\n';
          content += `title: "${post.title}"\n`;
          content += `date: "${post.date}"\n`;
          
          if (post.updated) {
            content += `updated: "${post.updated}"\n`;
          }
          
          content += 'categories:\n';
          (post.categories || []).forEach(cat => {
            content += `  - "${cat}"\n`;
          });
          
          content += 'tags:\n';
          (post.tags || []).forEach(tag => {
            content += `  - "${tag}"\n`;
          });
          
          if (post.excerpt) {
            content += `description: "${post.excerpt}"\n`;
          }
          
          if (post.coverImage) {
            content += `image: "${post.coverImage}"\n`;
          }
          
          content += '---\n\n';
          content += post.content;
          
          // 写入文件
          fs.writeFileSync(filePath, content, 'utf-8');
          processed++;
        } catch (error) {
          console.error(`[Git Service] 处理文章 ${post.slug} 失败:`, error);
          errors++;
        }
      }
      
      // 提交更改
      if (processed > 0) {
        await this.git.add('.');
        await this.git.commit(`更新 ${processed} 篇文章 [自动同步]`);
      }
      
      return { success: true, processed, errors };
    } catch (error) {
      console.error('[Git Service] 同步到Git仓库失败:', error);
      return { success: false, processed: 0, errors: 1 };
    }
  }

  /**
   * 从Git仓库同步内容到内存对象
   */
  async syncToMemory(): Promise<{ posts: Post[]; success: boolean; }> {
    try {
      console.log('[Git Service] 开始从Git仓库同步内容到内存');
      
      // 确保仓库已初始化
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const posts: Post[] = [];
      
      // 确保posts目录存在
      const postsDir = path.join(this.config.localPath, 'posts');
      if (!fs.existsSync(postsDir)) {
        console.log('[Git Service] posts目录不存在');
        return { posts, success: true };
      }
      
      // 读取所有分类目录
      const categories = fs.readdirSync(postsDir)
        .filter(item => {
          const itemPath = path.join(postsDir, item);
          return fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory();
        });
      
      console.log(`[Git Service] 发现 ${categories.length} 个分类目录`);
      
      // 处理每个分类目录
      for (const category of categories) {
        const categoryDir = path.join(postsDir, category);
        
        // 获取该分类下的所有Markdown文件
        const files = fs.readdirSync(categoryDir)
          .filter(file => file.endsWith('.md') && fs.statSync(path.join(categoryDir, file)).isFile());
        
        console.log(`[Git Service] 在分类 ${category} 中发现 ${files.length} 个Markdown文件`);
        
        // 处理每个文件
        for (const file of files) {
          try {
            const filePath = path.join(categoryDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // 解析front matter
            const match = content.match(/^---\n([\s\S]*?)---\n([\s\S]*)$/);
            if (!match) {
              console.warn(`[Git Service] 文件 ${filePath} 格式不正确，缺少front matter`);
              continue;
            }
            
            const frontMatter = match[1];
            const markdown = match[2].trim();
            
            // 提取元数据
            const title = frontMatter.match(/title:\s*"(.+?)"/)?.[1] || '';
            const date = frontMatter.match(/date:\s*"(.+?)"/)?.[1] || new Date().toISOString();
            const updated = frontMatter.match(/updated:\s*"(.+?)"/)?.[1];
            const description = frontMatter.match(/description:\s*"(.+?)"/)?.[1] || '';
            const image = frontMatter.match(/image:\s*"(.+?)"/)?.[1];
            
            // 提取分类
            const categoriesMatch = frontMatter.match(/categories:\n([\s\S]*?)(?:\n\w|$)/);
            const categories = categoriesMatch
              ? categoriesMatch[1].split('\n')
                  .map(line => line.match(/-\s*"(.+?)"/)?.[1])
                  .filter(Boolean) as string[]
              : [category];
            
            // 提取标签
            const tagsMatch = frontMatter.match(/tags:\n([\s\S]*?)(?:\n\w|$)/);
            const tags = tagsMatch
              ? tagsMatch[1].split('\n')
                  .map(line => line.match(/-\s*"(.+?)"/)?.[1])
                  .filter(Boolean) as string[]
              : [];
            
            // 文件名中提取slug
            const slug = file.match(/^\d{4}-\d{2}-\d{2}-(.+)\.md$/)?.[1] || 
                         enhancedSlugify(title, { maxLength: 80 });
            
            // 计算阅读时间
            const wordCount = markdown.split(/\s+/).length;
            const readingTime = Math.ceil(wordCount / 200) || 1;
            
            // 构建Post对象
            const post: Post = {
              slug,
              title,
              date,
              updated,
              content: markdown,
              excerpt: description || markdown.substring(0, 160).replace(/\n/g, ' ') + '...',
              categories,
              tags,
              published: true,
              featured: frontMatter.includes('featured: true'),
              coverImage: image,
              readingTime,
              metadata: {
                originalFile: path.relative(this.config.localPath, filePath),
                wordCount,
                readingTime
              }
            };
            
            posts.push(post);
          } catch (error) {
            console.error(`[Git Service] 处理文件 ${file} 失败:`, error);
          }
        }
      }
      
      console.log(`[Git Service] 共处理 ${posts.length} 篇文章`);
      return { posts, success: true };
    } catch (error) {
      console.error('[Git Service] 从Git仓库同步内容失败:', error);
      return { posts: [], success: false };
    }
  }
}

// 创建默认Git服务实例
export const gitService = new GitService({
  localPath: path.resolve(process.cwd(), '../../content'),
  remoteName: 'origin',
  remoteUrl: process.env.NEXT_PUBLIC_GITHUB_REPO_URL || '',
  defaultBranch: 'main',
  author: {
    name: 'Blog System',
    email: process.env.NEXT_PUBLIC_GIT_AUTHOR_EMAIL || 'blog@example.com'
  }
}); 